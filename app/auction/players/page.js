import AuctionNavbar from '@/components/auction/AuctionNavbar';
import PlayerPoolManager from '@/components/auction/PlayerPoolManager';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionPlayers } from '@/lib/auction-db';
import { isAuctionAuthenticated } from '../actions';

export const metadata = {
  title: 'Auction Player Pool & Lots | PDVL 2026 Auction',
  description: 'Manage registered volleyball player lots, categories, and base prices for the PDVL auction.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionPlayersPage({ searchParams }) {
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const resolvedParams = await searchParams;
    const errorMessage = resolvedParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo="/auction/players" />;
  }

  const initialPlayers = await getAuctionPlayers();

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column">
      <AuctionNavbar />
      <main className="flex-grow-1">
        <PlayerPoolManager initialPlayers={initialPlayers} />
      </main>
    </div>
  );
}
