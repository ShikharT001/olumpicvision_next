import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/postgres';
import { getCashfreeOrderStatus, getCashfreeOrderPayments } from '@/lib/cashfree';

export const runtime = 'nodejs';

function getLatestPaymentDetail(paymentsList) {
  if (!Array.isArray(paymentsList) || paymentsList.length === 0) {
    return null;
  }
  return (
    paymentsList.find((p) => p.payment_status === 'SUCCESS') ||
    paymentsList.at(-1) ||
    null
  );
}

function getFailureReason(paymentDetail) {
  return (
    paymentDetail?.payment_message ||
    paymentDetail?.error_details?.error_description ||
    paymentDetail?.error_details?.error_code ||
    'Cashfree payment failed'
  );
}

export async function POST(request) {
  let client;

  try {
    const { registrationId, orderId } = await request.json();

    if (!registrationId || !orderId) {
      return NextResponse.json(
        { error: 'Missing Cashfree verification fields' },
        { status: 400 }
      );
    }

    const orderPayload = await getCashfreeOrderStatus(orderId);
    const paymentsList = await getCashfreeOrderPayments(orderId).catch(() => []);
    const paymentDetail = getLatestPaymentDetail(paymentsList);

    const providerPaymentId = paymentDetail?.cf_payment_id || orderPayload.cf_order_id || null;
    const rawResponse = JSON.stringify({ cashfreeOrder: orderPayload, cashfreePayments: paymentsList });

    client = await getDbClient();
    await client.query('BEGIN');

    if (orderPayload.order_status === 'PAID') {
      await client.query(
        `UPDATE payment_transactions
         SET status = 'captured',
             provider_payment_id = $1,
             raw_response = COALESCE(raw_response, '{}'::jsonb) || $2::jsonb,
             paid_at = NOW(),
             updated_at = NOW()
         WHERE registration_id = $3 AND provider_order_id = $4`,
        [providerPaymentId, rawResponse, registrationId, orderId]
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

    if (orderPayload.order_status === 'EXPIRED' || orderPayload.order_status === 'TERMINATED') {
      const failureReason = getFailureReason(paymentDetail);

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
          orderId,
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
      [providerPaymentId, rawResponse, registrationId, orderId]
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
        message: 'Payment is still pending with Cashfree.',
      },
      { status: 202 }
    );
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => { });
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
