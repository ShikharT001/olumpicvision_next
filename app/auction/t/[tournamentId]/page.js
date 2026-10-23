import { notFound, redirect } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import TournamentHub from '@/components/auction/TournamentHub';
import '@/app/auction/auction.css';
import { getTournamentById, getLiveAuctionState, getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `${tournament.tournament_name} Live Auction Hub | Olympic Vision`
      : 'Tournament Auction Hub | Olympic Vision',
    description: 'Player Auction Console, Stage Display, and Team Squad Portals.',
  };
}

export default async function TournamentHubPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params.tournamentId;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    notFound();
  }

  const tournamentTeams = await getAuctionTeams(tournament.id);

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorParam = searchParams?.error || '';
    return (
      <AuctionLoginGate
        tournament={tournament}
        tournamentTeams={tournamentTeams}
        errorMessage={errorParam}
        returnTo={`/auction/t/${tournamentId}`}
      />
    );
  }

  const session = await getAuctionSession();
  const role = session.role;
  const isAdmin = session.isAdmin;
  const loggedTeam = session.team;

  // STRICT VALIDATION: If authenticated as team, verify they belong to this tournament
  if (role === 'team' && loggedTeam?.id) {
    const isRegistered = tournamentTeams.some(
      (t) => String(t.id) === String(loggedTeam.id)
    );
    if (!isRegistered) {
      return (
        <AuctionLoginGate
          tournament={tournament}
          tournamentTeams={tournamentTeams}
          errorMessage={`Access Denied: Your team session (${loggedTeam.name || 'Team'}) is not registered for ${tournament.tournament_name}. Only teams registered by the admin are authorized.`}
          returnTo={`/auction/t/${tournamentId}`}
        />
      );
    }
    // Directly redirect registered team to their squad auction screen
    redirect(`/auction/t/${tournamentId}/teams?teamId=${loggedTeam.id}&tab=squads`);
  }

  const liveState = await getLiveAuctionState(tournament.id);

  return (
    <div className="auction-shell d-flex flex-column min-vh-100" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <TournamentHub
        tournament={tournament}
        liveState={liveState}
        role={role}
        isAdmin={isAdmin}
      />
      <footer className="mt-auto py-3 border-top border-secondary border-opacity-10 text-center text-secondary small">
        <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <span>© 2026 {tournament.tournament_name} • Olympic Vision</span>
          <span>
            Multi-Sport Auction Engine by{' '}
            <a href="https://thetechnocyte.com" target="_blank" rel="noreferrer" className="text-info text-decoration-none fw-semibold">
              Technocyte
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
