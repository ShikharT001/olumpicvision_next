import { NextResponse } from 'next/server';
import {
  getCategoryFeePaise,
  isAllowedCategoryForParticipant,
} from '@/lib/marathon';
import { getDbClient } from '@/lib/postgres';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Abort any registration that takes longer than 12 seconds
export const maxDuration = 12;

export async function POST(request) {
  // ── Rate limit: max 5 registration attempts per IP per 10 minutes ──────────
  const ip = getClientIp(request);
  const { allowed, retryAfter } = checkRateLimit(ip, 'register', 5, 10 * 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many registration attempts. Please wait ${retryAfter} seconds and try again.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  let client;

  try {
    const data = await request.json();
    const {
      fullName,
      email,
      phone,
      dob,
      gender,
      school,
      category,
      tshirtSize,
      documentUrl,
      partnerDocumentUrl,
      paymentScreenshotUrl,
    } = data;

    // ── Validate required fields ───────────────────────────────────────────────
    if (!fullName || !email || !phone || !dob || !gender || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Basic phone sanity (must be 10 digits starting with 6-9)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
    }

    // Basic email sanity
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Identity document upload is required for registration.' },
        { status: 400 }
      );
    }

    if (category === 'couple' && !partnerDocumentUrl) {
      return NextResponse.json(
        { error: "Partner's identity document upload is required for couple registration." },
        { status: 400 }
      );
    }

    if (!isAllowedCategoryForParticipant({ dob, gender, category })) {
      return NextResponse.json(
        { error: 'Selected category is not allowed for this age and gender.' },
        { status: 400 }
      );
    }

    // No payment required — open categories are now free
    // (historical payment data in DB is preserved for admin access)

    client = await getDbClient();

    try {
      await client.query('BEGIN');

      // ── Duplicate check: same phone number cannot register twice ─────────────
      const dupCheck = await client.query(
        `SELECT id FROM registrations WHERE mobile_no = $1 LIMIT 1`,
        [phone]
      );

      if (dupCheck.rowCount > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'A registration with this phone number already exists. Please contact the organizers if this is an error.' },
          { status: 409 }
        );
      }

      const result = await client.query(
        `INSERT INTO registrations 
          (
            full_name, email, mobile_no, date_of_birth, gender,
            school_college_name, category_code,
            registration_status, payment_required, payment_status,
            fee_amount_paise, document_url, partner_document_url, payment_screenshot_url,
            tshirt_size
          ) 
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12, $13, $14) 
         RETURNING id`,
        [
          fullName.trim(),
          email.trim().toLowerCase(),
          phone,
          dob,
          gender,
          school?.trim() || null,
          category,
          false,
          'not_required',
          getCategoryFeePaise(category),
          documentUrl,
          partnerDocumentUrl || null,
          paymentScreenshotUrl || null,
          tshirtSize || null,
        ]
      );

      const registrationId = result.rows[0].id;

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Registration successful! Your details have been submitted.',
        id: registrationId,
        paymentRequired: false,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);

    // Handle unique constraint violation (race condition duplicate)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A registration with this phone number already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process registration. Please try again.' },
      { status: 500 }
    );
  }
}
