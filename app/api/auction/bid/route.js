import { NextResponse } from 'next/server';
import { placeBid } from '@/lib/auction-db';
import { isAuctionAdmin, isAuctionAuthenticated } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Bid attribution is ADMIN-only (auctioneer physically clicks the paddle for the team
    // that raised their hand — teams watch the live stage but don't click bids themselves)
    const isAdmin = await isAuctionAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the main auctioneer/admin can attribute paddle bids.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teamId, bidAmount } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const result = await placeBid({ teamId, bidAmount });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to place bid' }, { status: 400 });
  }
}
