import { NextResponse } from 'next/server';
import { getAuctionTeams, createAuctionTeam, updateAuctionTeam } from '@/lib/auction-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const teams = await getAuctionTeams();
    return NextResponse.json({ teams });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, teamId, ...teamData } = body;

    if (action === 'update' && teamId) {
      const updated = await updateAuctionTeam(teamId, teamData);
      return NextResponse.json({ team: updated });
    }

    if (!teamData.team_name || !teamData.team_code) {
      return NextResponse.json({ error: 'Team name and code are required' }, { status: 400 });
    }

    const created = await createAuctionTeam(teamData);
    return NextResponse.json({ team: created });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to process team' }, { status: 400 });
  }
}
