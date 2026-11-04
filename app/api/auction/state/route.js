import { NextResponse } from 'next/server';
import { getLiveAuctionState, setStageView } from '@/lib/auction-db';

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, view, tournamentId } = body;

    if (action === 'set_stage_view' || action === 'stage_view') {
      const result = await setStageView(view || 'podium', tournamentId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Error updating auction state:', err);
    return NextResponse.json({ error: err.message || 'Failed to update auction state' }, { status: 500 });
  }
}
