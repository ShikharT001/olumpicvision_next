import { NextResponse } from 'next/server';
import {
  getLiveAuctionState,
  getAuctionTeams,
  triggerPoolSpin,
  resetTournamentPools,
  setPoolFormat,
  autoDrawTournamentPools,
  updateTournamentPools,
} from '@/lib/auction-db';
import { isAuctionAdmin } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId') || null;
    const data = await getLiveAuctionState(tournamentId);
    return NextResponse.json({
      success: true,
      numPools: data?.state?.pool_num_pools || 2,
      spinEvent: data?.state?.pool_spin_event || null,
      teams: data?.teams || [],
      state: data?.state || {},
    });
  } catch (err) {
    console.error('Error fetching pools data:', err);
    return NextResponse.json({ error: 'Failed to fetch pools data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await isAuctionAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin credentials required to modify tournament pool draws.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, tournamentId, numPools, teamId, pool, finalRotation, pools, poolAssignments } = body;

    if (action === 'spin') {
      const result = await triggerPoolSpin({
        tournamentId,
        teamId,
        pool,
        finalRotation,
        numPools,
      });
      return NextResponse.json(result);
    }

    if (action === 'reset') {
      const result = await resetTournamentPools(tournamentId);
      return NextResponse.json(result);
    }

    if (action === 'format') {
      const result = await setPoolFormat(numPools, tournamentId);
      return NextResponse.json(result);
    }

    if (action === 'auto_draw') {
      const updatedTeams = await autoDrawTournamentPools(tournamentId, numPools);
      return NextResponse.json({ success: true, teams: updatedTeams });
    }

    if (action === 'save') {
      const updatedTeams = await updateTournamentPools(tournamentId, pools || poolAssignments);
      return NextResponse.json({ success: true, teams: updatedTeams });
    }

    return NextResponse.json({ error: `Unknown pool action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('Error handling pool draw action:', err);
    return NextResponse.json({ error: err.message || 'Pool action failed' }, { status: 500 });
  }
}
