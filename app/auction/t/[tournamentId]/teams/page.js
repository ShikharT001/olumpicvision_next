import { notFound } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `Team Squads & Purse | ${tournament.tournament_name}`
      : 'Team Squads & Purse',
    description: 'Track team purse spending, remaining budget, and acquired rosters.',
  };
}

export default async function TournamentTeamsPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params.tournamentId;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const initialTeams = await getAuctionTeams(tournament.id);

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorParam = searchParams?.error || '';
    return (
      <AuctionLoginGate
        tournament={tournament}
        tournamentTeams={initialTeams}
        errorMessage={errorParam}
        returnTo={`/auction/t/${tournamentId}/teams`}
      />
    );
  }

  const session = await getAuctionSession();
  const role = session.role;
  const loggedTeam = session.team;

  // STRICT TOURNAMENT VALIDATION FOR REGISTERED TEAMS
  if (role === 'team' && loggedTeam?.id) {
    const isRegisteredInThisTournament = initialTeams.some(
      (t) => String(t.id) === String(loggedTeam.id)
    );
    if (!isRegisteredInThisTournament) {
      return (
        <AuctionLoginGate
          tournament={tournament}
          tournamentTeams={initialTeams}
          errorMessage={`Your active team session (${loggedTeam.name || 'Team'}) is not registered for ${tournament.tournament_name}. Only teams registered for this championship can access this auction screen.`}
          returnTo={`/auction/t/${tournamentId}/teams`}
        />
      );
    }
  }

  // Pre-select the logged-in team's ID if not explicitly specified in searchParams
  const activeTeamId = searchParams?.teamId || (role === 'team' ? loggedTeam?.id : null);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <main className="flex-grow-1">
        <TeamSquadsDashboard
          initialTeams={initialTeams}
          tournament={tournament}
          tournamentId={tournament.id}
          initialTab={searchParams?.tab || 'squads'}
          isAdmin={session.isAdmin}
          loggedTeam={loggedTeam}
          initialTeamId={activeTeamId}
        />
      </main>
    </div>
  );
}
