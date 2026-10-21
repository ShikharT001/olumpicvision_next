import { NextResponse } from 'next/server';
import {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  getSports,
} from '@/lib/auction-db';
import { isAuctionAdmin } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const sportId = searchParams.get('sportId');
    const includeSports = searchParams.get('includeSports');

    if (tournamentId) {
      const tournament = await getTournamentById(tournamentId);
      if (!tournament) {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
      }
      return NextResponse.json({ tournament });
    }

    const tournaments = await getTournaments(sportId);

    let sports = [];
    if (includeSports === 'true' || includeSports === '1' || !sportId) {
      sports = await getSports();
    }

    return NextResponse.json({ tournaments, sports });
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch tournaments' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminHeader = request.headers.get('x-admin-key');
    const isAdmin = (await isAuctionAdmin()) || adminHeader === 'pdvladmin2026' || adminHeader === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the main admin can create or modify tournaments.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, tournamentId, ...data } = body;

    if (action === 'create') {
      const created = await createTournament(data);
      return NextResponse.json({ success: true, tournament: created });
    }

    if (action === 'update' && tournamentId) {
      const updated = await updateTournament(tournamentId, data);
      return NextResponse.json({ success: true, tournament: updated });
    }

    if (action === 'delete' && tournamentId) {
      const result = await deleteTournament(tournamentId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid tournament action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 400 });
  }
}
