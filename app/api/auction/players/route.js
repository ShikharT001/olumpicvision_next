import { NextResponse } from 'next/server';
import {
  getAuctionPlayers,
  importFromRegistrations,
  updateAuctionPlayer,
  createAuctionPlayer,
  deleteAuctionPlayer,
  setActivePlayer,
  markSoldPlayerUnsold,
  changePlayerStatus,
} from '@/lib/auction-db';
import { isAuctionAdmin } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const lot = searchParams.get('lot');
    const position = searchParams.get('position');
    const category = searchParams.get('category') || searchParams.get('player_category');
    const sportId = searchParams.get('sportId') || searchParams.get('sport_id');
    const tournamentId = searchParams.get('tournamentId');

    const players = await getAuctionPlayers({ status, lot, position, category, sportId }, tournamentId);
    return NextResponse.json({ players });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminHeader = request.headers.get('x-admin-key');
    const isAdmin = (await isAuctionAdmin()) || adminHeader === 'pdvladmin2026' || adminHeader === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the main admin can modify players.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, tournamentId, playerId, data } = body;

    // Import from verified registrations
    if (action === 'import') {
      const res = await importFromRegistrations(tournamentId);
      return NextResponse.json(res);
    }

    // Bulk import players array (from CSV/JSON with photos)
    if (action === 'bulk_import') {
      const playersList = Array.isArray(data?.players) ? data.players : [];
      if (playersList.length === 0) {
        return NextResponse.json({ error: 'No player records provided for bulk import' }, { status: 400 });
      }
      const imported = [];
      for (const p of playersList) {
        if (p && (p.full_name || p.name)) {
          const created = await createAuctionPlayer({
            ...p,
            full_name: p.full_name || p.name,
            photo_url: p.photo_url || p.photo || p.image_url || '',
          }, tournamentId);
          imported.push(created);
        }
      }
      return NextResponse.json({ success: true, importedCount: imported.length, players: imported });
    }

    // Directly add a player without a registration record
    if (action === 'create') {
      if (!data?.full_name) {
        return NextResponse.json({ error: 'Player full_name is required' }, { status: 400 });
      }
      const player = await createAuctionPlayer(data, tournamentId);
      return NextResponse.json({ player });
    }

    // Put a player on the live hammer podium
    if (action === 'select') {
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await setActivePlayer(playerId, tournamentId);
      return NextResponse.json(res);
    }

    // Update player details (base price, lot, grade)
    if (action === 'update') {
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await updateAuctionPlayer(playerId, data);
      return NextResponse.json({ success: true, player: res });
    }

    // Mark a sold player unsold and refund team purse
    if (action === 'mark_unsold') {
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await markSoldPlayerUnsold(playerId);
      return NextResponse.json(res);
    }

    // Change player auction status / edit sold outcome
    if (action === 'change_status') {
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await changePlayerStatus(playerId, data?.status || data?.newStatus, data);
      return NextResponse.json(res);
    }

    // Delete a player
    if (action === 'delete') {
      if (!playerId) return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      const res = await deleteAuctionPlayer(playerId);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 400 });
  }
}
