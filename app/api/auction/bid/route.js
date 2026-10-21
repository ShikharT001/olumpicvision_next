import { NextResponse } from 'next/server';
import { placeBid } from '@/lib/auction-db';
import { isAuctionAdmin } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const isAdmin = await isAuctionAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the main auctioneer/admin can attribute paddle bids.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teamId, bidAmount, tournamentId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const result = await placeBid({ teamId, bidAmount, tournamentId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to place bid' }, { status: 400 });
  }
}
