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
    const { registrationId, orderId } = await request.json();

    if (!registrationId || !orderId) {
      return NextResponse.json(
        { error: 'Missing payment cancellation fields' },
        { status: 400 }
      );
    }

    client = await pool.connect();
    await client.query('BEGIN');

    await client.query(
      `UPDATE payment_transactions
       SET status = 'cancelled',
           failure_reason = 'Checkout closed before payment',
           updated_at = NOW()
       WHERE registration_id = $1 AND provider_order_id = $2 AND status <> 'captured'`,
      [registrationId, orderId]
    );

    await client.query(
      `UPDATE registrations
       SET payment_status = 'cancelled'
       WHERE id = $1 AND payment_status <> 'paid'`,
      [registrationId]
    );

    await client.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Payment cancellation update error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment cancellation', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
