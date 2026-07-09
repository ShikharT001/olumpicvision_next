import { NextResponse } from 'next/server';
import {
  getCategoryFeePaise,
  isAllowedCategoryForParticipant,
  isPaidCategory,
} from '@/lib/marathon';
import { getDbClient } from '@/lib/postgres';
import {
  createMerchantOrderId,
  createPhonePePayment,
  getPhonePeCheckoutScriptUrl,
} from '@/lib/phonepe';

export const runtime = 'nodejs';

export async function POST(request) {
  let client;

  try {
    const data = await request.json();
    const { fullName, phone, dob, gender, school, category, documentUrl, partnerDocumentUrl } = data;

    // Validate required fields
    if (!fullName || !phone || !dob || !gender || !category) {
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

    client = await getDbClient();

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
            fee_amount_paise,
            document_url,
            partner_document_url
          ) 
         VALUES 
          ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11) 
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
          documentUrl,
          partnerDocumentUrl || null,
        ]
      );

      const registrationId = result.rows[0].id;
      let phonePeOrder = null;
      let merchantOrderId = null;

      if (paymentRequired) {
        const origin = new URL(request.url).origin;
        merchantOrderId = createMerchantOrderId(registrationId);
        phonePeOrder = await createPhonePePayment({
          merchantOrderId,
          amountPaise: feeAmountPaise,
          registrationId,
          fullName,
          category,
          redirectUrl: `${origin}/#register`,
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
              provider_payment_id,
              status,
              raw_response
            )
           VALUES ($1, $2, $3, 'INR', 'phonepe', $4, $5, 'created', $6)`,
          [
            registrationId,
            category,
            feeAmountPaise,
            merchantOrderId,
            phonePeOrder.orderId || null,
            JSON.stringify(phonePeOrder),
          ]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: paymentRequired
          ? 'Registration created. Complete PhonePe payment to confirm.'
          : 'Registration successful',
        id: registrationId,
        paymentRequired,
        payment: paymentRequired
          ? {
            orderId: merchantOrderId,
            phonePeOrderId: phonePeOrder.orderId || null,
            redirectUrl: phonePeOrder.redirectUrl,
            checkoutScriptUrl: getPhonePeCheckoutScriptUrl(),
            amount: feeAmountPaise,
            currency: 'INR',
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
