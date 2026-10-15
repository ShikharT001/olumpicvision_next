import { NextResponse } from 'next/server';
import { getLiveAuctionState } from '@/lib/auction-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLiveAuctionState();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching auction state:', err);
    return NextResponse.json({ error: 'Failed to fetch auction state' }, { status: 500 });
  }
}
