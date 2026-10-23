import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionTeams, getTournamentById, getTournaments } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '../actions';

export const metadata = {
  title: 'Team Squads & Remaining Purse | Multi-Sport Live Auction',
  description: 'Track team purse spending, remaining budget, and acquired rosters.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionTeamsPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  const session = await getAuctionSession();
  const role = session.role;
  const loggedTeam = session.team;

  // If logged in as a registered team, directly load their tournament auction screen!
  if (isAuthed && role === 'team' && loggedTeam?.id) {
    const tId = loggedTeam.tournamentId || session.tournamentId;
    if (tId) {
      redirect(`/auction/t/${tId}/teams?teamId=${loggedTeam.id}&tab=squads`);
    }
  }

  const allTournaments = await getTournaments();

  if (!isAuthed) {
    const errorParam = searchParams?.error || '';
    const tournamentsWithTeams = await Promise.all(
      allTournaments.map(async (t) => {
        const teams = await getAuctionTeams(t.id);
        return { ...t, teams };
      })
    );
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    return (
      <AuctionLoginGate
        allTournaments={tournamentsWithTeams}
        errorMessage={errorParam}
        returnTo={`/auction/teams${tournParam}`}
      />
    );
  }

  let tournament = null;
  if (searchParams?.tournamentId) {
    tournament = await getTournamentById(searchParams.tournamentId);
  }

  // With solely the volleyball championship active, immediately direct to its teams screen
  if (!tournament) {
    const defaultId = allTournaments[0]?.id || '00000000-0000-0000-0000-000000000001';
    redirect(`/auction/t/${defaultId}/teams`);
  }

  const initialTeams = await getAuctionTeams(tournament?.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <main className="flex-grow-1">
        <TeamSquadsDashboard
          initialTeams={initialTeams}
          tournament={tournament}
          tournamentId={tournament?.id}
          initialTab={searchParams?.tab || 'squads'}
          isAdmin={session.isAdmin}
          loggedTeam={loggedTeam}
          initialTeamId={searchParams?.teamId || (role === 'team' ? loggedTeam?.id : null)}
        />
      </main>
    </div>
  );
}
