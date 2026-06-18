import { Pool } from 'pg';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

export async function POST(request) {
  let client;

  try {
    const {
      registrationId,
      orderId,
      paymentId,
      reason = 'Payment failed or was cancelled',
      rawResponse = null,
    } = await request.json();

    if (!registrationId || !orderId) {
      return NextResponse.json(
        { error: 'Missing payment failure fields' },
        { status: 400 }
      );
    }

    client = await pool.connect();
    await client.query('BEGIN');

    await client.query(
      `UPDATE payment_transactions
       SET status = 'failed',
           provider_payment_id = COALESCE($1, provider_payment_id),
           failure_reason = $2,
           raw_response = COALESCE($3, raw_response),
           updated_at = NOW()
       WHERE registration_id = $4 AND provider_order_id = $5`,
      [
        paymentId || null,
        reason,
        rawResponse ? JSON.stringify(rawResponse) : null,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Payment failure update error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment failure', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
