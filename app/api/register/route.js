import { Pool } from 'pg';
import { NextResponse } from 'next/server';
import {
  getCategoryFeePaise,
  isAllowedCategoryForParticipant,
  isPaidCategory,
} from '@/lib/marathon';

export const runtime = 'nodejs';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

function isRazorpayConfigured() {
  return Boolean(
    razorpayKeyId &&
      razorpayKeySecret &&
      !razorpayKeyId.includes('replace') &&
      !razorpayKeySecret.includes('replace')
  );
}

async function createRazorpayOrder({ amountPaise, registrationId, fullName, category }) {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay test keys are not configured in .env.local');
  }

  const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: `bvm_${String(registrationId).slice(0, 30)}`,
      notes: {
        registration_id: registrationId,
        participant_name: fullName,
        category,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.description || 'Unable to create Razorpay order');
  }

  return payload;
}

export async function POST(request) {
  let client;

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

    if (!isAllowedCategoryForParticipant({ dob, gender, category })) {
      return NextResponse.json(
        { error: 'Selected category is not allowed for this age and gender.' },
        { status: 400 }
      );
    }

    const paymentRequired = isPaidCategory(category);
    const feeAmountPaise = getCategoryFeePaise(category);

    client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO registrations 
          (
            full_name,
            mobile_no,
            date_of_birth,
            gender,
            school_college_name,
            category_code,
            registration_status,
            payment_required,
            payment_status,
            fee_amount_paise
          ) 
         VALUES 
          ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9) 
         RETURNING id`,
        [
          fullName,
          phone,
          dob,
          gender,
          school || null,
          category,
          paymentRequired,
          paymentRequired ? 'payment_pending' : 'not_required',
          feeAmountPaise,
        ]
      );

      const registrationId = result.rows[0].id;
      let razorpayOrder = null;

      if (paymentRequired) {
        razorpayOrder = await createRazorpayOrder({
          amountPaise: feeAmountPaise,
          registrationId,
          fullName,
          category,
        });

        await client.query(
          `INSERT INTO payment_transactions
            (
              registration_id,
              category_code,
              amount_paise,
              currency,
              provider,
              provider_order_id,
              status,
              raw_response
            )
           VALUES ($1, $2, $3, 'INR', 'razorpay', $4, 'created', $5)`,
          [
            registrationId,
            category,
            feeAmountPaise,
            razorpayOrder.id,
            JSON.stringify(razorpayOrder),
          ]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: paymentRequired
          ? 'Registration created. Complete Razorpay payment to confirm.'
          : 'Registration successful',
        id: registrationId,
        paymentRequired,
        payment: paymentRequired
          ? {
              keyId: razorpayKeyId,
              orderId: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
              feeRupees: feeAmountPaise / 100,
            }
          : null,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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
