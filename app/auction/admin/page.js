import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctioneerConsole from '@/components/auction/AuctioneerConsole';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getLiveAuctionState, getTournamentById, getTournaments } from '@/lib/auction-db';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole, getAuctionSession } from '../actions';

export const metadata = {
  title: 'Auctioneer Control Console | Multi-Sport Live Auction',
  description: 'Podium controls, physical paddle attribution, and live hammer gavel.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionAdminPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  const session = await getAuctionSession();
  const role = session.role;
  const isAdmin = session.isAdmin;
  const loggedTeam = session.team;

  if (!isAuthed || !isAdmin) {
    const errorMessage = searchParams?.error === 'invalid'
      ? 'Incorrect admin passcode. Please verify and try again.'
      : !isAdmin && isAuthed
      ? 'Admin authorization required. The Auctioneer Console can only be operated by tournament administrators.'
      : '';
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    return (
      <AuctionLoginGate
        errorMessage={errorMessage}
        returnTo={`/auction/admin${tournParam}`}
        initialRole="admin"
      />
    );
  }

  let tournament = null;
  if (searchParams?.tournamentId) {
    tournament = await getTournamentById(searchParams.tournamentId);
  }
  if (!tournament) {
    const all = await getTournaments();
    tournament = all[0] || null;
  }

  const initialData = await getLiveAuctionState(tournament?.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <main className="flex-grow-1">
        <AuctioneerConsole
          initialData={initialData}
          role={role}
          isAdmin={isAdmin}
          tournament={tournament}
          tournamentId={tournament?.id}
          loggedTeam={loggedTeam}
        />
      </main>
    </div>
  );
}
