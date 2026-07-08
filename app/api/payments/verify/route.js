import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/postgres';
import { getPhonePeOrderStatus } from '@/lib/phonepe';

export const runtime = 'nodejs';

function getLatestPaymentDetail(statusPayload) {
  const paymentDetails = Array.isArray(statusPayload.paymentDetails)
    ? statusPayload.paymentDetails
    : [];

  return (
    paymentDetails.find((paymentDetail) => paymentDetail.state === 'COMPLETED') ||
    paymentDetails.at(-1) ||
    null
  );
}

function getFailureReason(statusPayload, paymentDetail) {
  return (
    statusPayload.errorContext?.description ||
    statusPayload.errorCode ||
    paymentDetail?.errorCode ||
    paymentDetail?.detailedErrorCode ||
    'PhonePe payment failed'
  );
}

export async function POST(request) {
  let client;

  try {
    const { registrationId, orderId, merchantOrderId = orderId } =
      await request.json();

    if (!registrationId || !merchantOrderId) {
      return NextResponse.json(
        { error: 'Missing PhonePe verification fields' },
        { status: 400 }
      );
    }

    const statusPayload = await getPhonePeOrderStatus(merchantOrderId);
    const paymentDetail = getLatestPaymentDetail(statusPayload);
    const providerPaymentId =
      paymentDetail?.transactionId || statusPayload.orderId || null;
    const rawResponse = JSON.stringify({ phonepeStatus: statusPayload });

    client = await getDbClient();
    await client.query('BEGIN');

    if (statusPayload.state === 'COMPLETED') {
      await client.query(
        `UPDATE payment_transactions
         SET status = 'captured',
             provider_payment_id = $1,
             raw_response = COALESCE(raw_response, '{}'::jsonb) || $2::jsonb,
             paid_at = NOW(),
             updated_at = NOW()
         WHERE registration_id = $3 AND provider_order_id = $4`,
        [providerPaymentId, rawResponse, registrationId, merchantOrderId]
      );

      await client.query(
        `UPDATE registrations
         SET payment_status = 'paid',
             registration_status = 'confirmed'
         WHERE id = $1`,
        [registrationId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        status: 'paid',
        message: 'Payment verified and registration confirmed',
      });
    }

    if (statusPayload.state === 'FAILED') {
      const failureReason = getFailureReason(statusPayload, paymentDetail);

      await client.query(
        `UPDATE payment_transactions
         SET status = 'failed',
             provider_payment_id = COALESCE($1, provider_payment_id),
             failure_reason = $2,
             raw_response = COALESCE(raw_response, '{}'::jsonb) || $3::jsonb,
             updated_at = NOW()
         WHERE registration_id = $4 AND provider_order_id = $5`,
        [
          providerPaymentId,
          failureReason,
          rawResponse,
          registrationId,
          merchantOrderId,
        ]
      );

      await client.query(
        `UPDATE registrations
         SET payment_status = 'failed'
         WHERE id = $1`,
        [registrationId]
      );

      await client.query('COMMIT');

      return NextResponse.json(
        { error: failureReason, status: 'failed' },
        { status: 400 }
      );
    }

    await client.query(
      `UPDATE payment_transactions
       SET status = 'created',
           provider_payment_id = COALESCE($1, provider_payment_id),
           raw_response = COALESCE(raw_response, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()
       WHERE registration_id = $3 AND provider_order_id = $4`,
      [providerPaymentId, rawResponse, registrationId, merchantOrderId]
    );

    await client.query(
      `UPDATE registrations
       SET payment_status = 'payment_pending'
       WHERE id = $1 AND payment_status <> 'paid'`,
      [registrationId]
    );

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: false,
        status: 'pending',
        message: 'Payment is still pending with PhonePe.',
      },
      { status: 202 }
    );
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
