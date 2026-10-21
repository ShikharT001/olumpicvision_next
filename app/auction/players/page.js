import AuctionNavbar from '@/components/auction/AuctionNavbar';
import PlayerPoolManager from '@/components/auction/PlayerPoolManager';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionPlayers, getTournamentById, getTournaments } from '@/lib/auction-db';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole } from '../actions';

export const metadata = {
  title: 'Auction Player Pool & Lots | Multi-Sport Live Auction',
  description: 'Manage registered player lots, categories, and base prices.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionPlayersPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/players${tournParam}`} />;
  }

  const role = await getAuctionRole();
  const isAdmin = await isAuctionAdmin();

  let tournament = null;
  if (searchParams?.tournamentId) {
    tournament = await getTournamentById(searchParams.tournamentId);
  }
  if (!tournament) {
    const all = await getTournaments();
    tournament = all[0] || null;
  }

  const initialPlayers = await getAuctionPlayers({}, tournament?.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} />
      <main className="flex-grow-1">
        <PlayerPoolManager
          initialPlayers={initialPlayers}
          isAdmin={isAdmin}
          tournament={tournament}
          tournamentId={tournament?.id}
        />
      </main>
    </div>
  );
}
