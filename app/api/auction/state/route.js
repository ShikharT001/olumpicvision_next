import { NextResponse } from 'next/server';
import { getLiveAuctionState } from '@/lib/auction-db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId') || null;
    const data = await getLiveAuctionState(tournamentId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching auction state:', err);
    return NextResponse.json({ error: 'Failed to fetch auction state' }, { status: 500 });
  }
}
