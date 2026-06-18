import crypto from 'crypto';
import { Pool } from 'pg';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!razorpayKeySecret || razorpayKeySecret.includes('replace')) {
    throw new Error('Razorpay key secret is not configured in .env.local');
  }

  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const receivedSignature = String(signature || '');

  if (receivedSignature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

export async function POST(request) {
  let client;

  try {
    const {
      registrationId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = await request.json();

    if (!registrationId || !orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay verification fields' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
    client = await pool.connect();
    await client.query('BEGIN');

    if (!isValid) {
      await client.query(
        `UPDATE payment_transactions
         SET status = 'failed',
             provider_payment_id = $1,
             provider_signature = $2,
             failure_reason = 'Invalid Razorpay signature',
             updated_at = NOW()
         WHERE registration_id = $3 AND provider_order_id = $4`,
        [paymentId, signature, registrationId, orderId]
      );

      await client.query(
        `UPDATE registrations
         SET payment_status = 'failed'
         WHERE id = $1`,
        [registrationId]
      );

      await client.query('COMMIT');

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    await client.query(
      `UPDATE payment_transactions
       SET status = 'captured',
           provider_payment_id = $1,
           provider_signature = $2,
           paid_at = NOW(),
           updated_at = NOW()
       WHERE registration_id = $3 AND provider_order_id = $4`,
      [paymentId, signature, registrationId, orderId]
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
      message: 'Payment verified and registration confirmed',
    });
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
