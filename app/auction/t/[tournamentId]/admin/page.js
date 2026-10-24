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

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorParam = searchParams?.error || '';
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

  const session = await getAuctionSession();
  const role = session.role;
  const isAdmin = session.isAdmin;
  const loggedTeam = session.team;

  // STRICT TOURNAMENT VALIDATION FOR REGISTERED TEAMS
  if (role === 'team' && loggedTeam?.id) {
    const isRegistered = tournamentTeams.some(
      (t) => String(t.id) === String(loggedTeam.id)
    );
    if (!isRegistered) {
      return (
        <AuctionLoginGate
          tournament={tournament}
          tournamentTeams={tournamentTeams}
          errorMessage={`Your active team session (${loggedTeam.name || 'Team'}) is not registered for ${tournament.tournament_name}. Only registered teams for this championship are authorized.`}
          returnTo={`/auction/t/${tournamentId}/admin`}
        />
      );
    }
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
