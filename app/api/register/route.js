import { NextResponse } from 'next/server';
import {
  getCategoryFeePaise,
  isAllowedCategoryForParticipant,
  isPaidCategory,
} from '@/lib/marathon';
import { getDbClient } from '@/lib/postgres';

export const runtime = 'nodejs';

export async function POST(request) {
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
      documentUrl,
      partnerDocumentUrl,
      paymentScreenshotUrl,
    } = data;

    // Validate required fields
    if (!fullName || !email || !phone || !dob || !gender || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Document is mandatory for every participant
    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Identity document upload is required for registration.' },
        { status: 400 }
      );
    }

    // For couple category, partner document is also required
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

    const paymentRequired = isPaidCategory(category);
    const feeAmountPaise = getCategoryFeePaise(category);

    // If payment is required, they must have uploaded a payment screenshot
    if (paymentRequired && !paymentScreenshotUrl) {
      return NextResponse.json(
        { error: 'Payment verification screenshot is required for this category.' },
        { status: 400 }
      );
    }

    client = await getDbClient();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO registrations 
          (
            full_name,
            email,
            mobile_no,
            date_of_birth,
            gender,
            school_college_name,
            category_code,
            registration_status,
            payment_required,
            payment_status,
            fee_amount_paise,
            document_url,
            partner_document_url,
            payment_screenshot_url
          ) 
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12, $13) 
         RETURNING id`,
        [
          fullName,
          email,
          phone,
          dob,
          gender,
          school || null,
          category,
          paymentRequired,
          paymentRequired ? 'payment_pending' : 'not_required',
          feeAmountPaise,
          documentUrl,
          partnerDocumentUrl || null,
          paymentRequired ? paymentScreenshotUrl : null,
        ]
      );

      const registrationId = result.rows[0].id;

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: paymentRequired
          ? 'Registration and payment details submitted for verification. We will verify and confirm shortly.'
          : 'Registration successful. Your details have been submitted.',
        id: registrationId,
        paymentRequired,
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
