import {
  getAuctionPlayers,
  importFromRegistrations,
  updateAuctionPlayer,
  createAuctionPlayer,
  setActivePlayer,
} from '@/lib/auction-db';
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
      return NextResponse.json(
        { error: 'Unauthorized. Only the main admin can modify players.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Import from verified PDVL registrations
    if (action === 'import') {
      const res = await importFromRegistrations();
      return NextResponse.json(res);
    }

    // Directly add a player without a registration record
    if (action === 'create') {
      const { data } = body;
      if (!data?.full_name) {
        return NextResponse.json({ error: 'Player full_name is required' }, { status: 400 });
      }
      const player = await createAuctionPlayer(data);
      return NextResponse.json({ player });
    }

    // Put a player on the live hammer podium
    if (action === 'select') {
      const { playerId } = body;
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await setActivePlayer(playerId);
      return NextResponse.json(res);
    }

    // Update player details (base price, lot, grade)
    if (action === 'update') {
      const { playerId, data } = body;
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await updateAuctionPlayer(playerId, data);
      return NextResponse.json({ success: true, player: res });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 400 });
  }
}
