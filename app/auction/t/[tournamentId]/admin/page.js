import { notFound } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctioneerConsole from '@/components/auction/AuctioneerConsole';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getLiveAuctionState, getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `Auctioneer Podium | ${tournament.tournament_name}`
      : 'Auctioneer Console',
    description: 'Podium controls, physical paddle attribution, and live hammer gavel.',
  };
}

export default async function TournamentAdminPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params?.tournamentId;

  // Fetch tournament and teams first so they are always available for the login gate
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const tournamentTeams = await getAuctionTeams(tournament.id);

  const isAuthed = await isAuctionAuthenticated();
  const session = await getAuctionSession();
  const role = session.role;
  const isAdmin = session.isAdmin;
  const loggedTeam = session.team;

  if (!isAuthed || !isAdmin) {
    const errorParam = searchParams?.error === 'invalid'
      ? 'Incorrect admin passcode. Please verify and try again.'
      : !isAdmin && isAuthed
      ? 'Admin authorization required. The Auctioneer Console can only be operated by tournament administrators.'
      : (searchParams?.error || '');
    return (
      <AuctionLoginGate
        tournament={tournament}
        tournamentTeams={tournamentTeams}
        errorMessage={errorParam}
        returnTo={`/auction/t/${tournamentId}/admin`}
        initialRole="admin"
      />
    );
  }

  const initialData = await getLiveAuctionState(tournament.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <main className="flex-grow-1">
        <AuctioneerConsole
          initialData={initialData}
          role={role}
          isAdmin={isAdmin}
          tournament={tournament}
          tournamentId={tournament.id}
          loggedTeam={loggedTeam}
        />
      </main>
    </div>
  );
}
