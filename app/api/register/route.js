import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

export async function POST(request) {
  try {
    const data = await request.json();
    const { fullName, phone, dob, gender, school, category } = data;

    // Validate required fields
    if (!fullName || !phone || !dob || !gender || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Insert into registrations table
      const result = await client.query(
        `INSERT INTO registrations 
          (full_name, mobile_no, date_of_birth, gender, school_college_name, category_code, registration_status) 
         VALUES 
          ($1, $2, $3, $4, $5, $6, 'pending') 
         RETURNING id`,
        [fullName, phone, dob, gender, school || null, category]
      );

      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        id: result.rows[0].id,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to process registration', details: error.message },
      { status: 500 }
    );
  }
}
