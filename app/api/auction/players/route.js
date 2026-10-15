import { NextResponse } from 'next/server';
import { getAuctionPlayers, importFromRegistrations, updateAuctionPlayer, setActivePlayer } from '@/lib/auction-db';
import { isAuctionAdmin } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const lot = searchParams.get('lot');
    const position = searchParams.get('position');

    const players = await getAuctionPlayers({ status, lot, position });
    return NextResponse.json({ players });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await isAuctionAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Only the main admin can modify players.' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'import') {
      const res = await importFromRegistrations();
      return NextResponse.json(res);
    }

    if (action === 'select') {
      const { playerId } = body;
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await setActivePlayer(playerId);
      return NextResponse.json(res);
    }

    if (action === 'update') {
      const { playerId, data } = body;
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await updateAuctionPlayer(playerId, data);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 400 });
  }
}
