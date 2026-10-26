import { NextResponse } from 'next/server';
import { getAuctionTeams, createAuctionTeam, updateAuctionTeam, deleteAuctionTeam, updateTournamentPools, seedTournamentDefaultTeams } from '@/lib/auction-db';
import { isAuctionAdmin } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const teams = await getAuctionTeams(tournamentId);
    return NextResponse.json({ teams });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await isAuctionAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the main admin can create or modify teams.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, tournamentId, teamId, ...teamData } = body;

    // Seed default franchise teams for tournament
    if (action === 'seed_defaults') {
      const seeded = await seedTournamentDefaultTeams(tournamentId);
      return NextResponse.json({ success: true, teams: seeded });
    }

    // Bulk update tournament pools
    if (action === 'update_pools') {
      const { pools, poolAssignments } = body;
      const updatedTeams = await updateTournamentPools(tournamentId, pools || poolAssignments);
      return NextResponse.json({ success: true, teams: updatedTeams });
    }

    // Delete team
    if (action === 'delete' && teamId) {
      const deleted = await deleteAuctionTeam(teamId);
      return NextResponse.json(deleted);
    }

    // Update existing team details / purse
    if (action === 'update' && teamId) {
      const updated = await updateAuctionTeam(teamId, teamData);
      return NextResponse.json({ team: updated });
    }

    // Create a new franchise team
    if (!teamData.team_name || !teamData.team_code) {
      return NextResponse.json({ error: 'Team name and code are required' }, { status: 400 });
    }
    const created = await createAuctionTeam(teamData, tournamentId);
    return NextResponse.json({ team: created });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to process team' }, { status: 400 });
  }
}
