import { notFound } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import PlayerPoolManager from '@/components/auction/PlayerPoolManager';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getAuctionPlayers, getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `Player Pool & Lots | ${tournament.tournament_name}`
      : 'Auction Player Pool',
    description: 'Manage registered player lots, categories, and base prices.',
  };
}

export default async function TournamentPlayersPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params.tournamentId;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const tournamentTeams = await getAuctionTeams(tournament.id);

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorParam = searchParams?.error || '';
    return (
      <AuctionLoginGate
        tournament={tournament}
        tournamentTeams={tournamentTeams}
        errorMessage={errorParam}
        returnTo={`/auction/t/${tournamentId}/players`}
      />
    );
  }

  const session = await getAuctionSession();
  const role = session.role;
  const isAdmin = session.isAdmin;
  const loggedTeam = session.team;

  if (role === 'team' && loggedTeam?.id) {
    const isRegistered = tournamentTeams.some((t) => String(t.id) === String(loggedTeam.id));
    if (!isRegistered) {
      return (
        <AuctionLoginGate
          tournament={tournament}
          tournamentTeams={tournamentTeams}
          errorMessage={`Your team session (${loggedTeam.name || 'Team'}) is not registered for ${tournament.tournament_name}.`}
          returnTo={`/auction/t/${tournamentId}/players`}
        />
      );
    }
  }

  const initialPlayers = await getAuctionPlayers({}, tournament.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <main className="flex-grow-1">
        <PlayerPoolManager
          initialPlayers={initialPlayers}
          isAdmin={isAdmin}
          tournament={tournament}
          tournamentId={tournament.id}
        />
      </main>
    </div>
  );
}
