import AuctionNavbar from '@/components/auction/AuctionNavbar';
import PlayerPoolManager from '@/components/auction/PlayerPoolManager';
import '@/app/auction/auction.css';
import { getAuctionPlayers } from '@/lib/auction-db';

export const metadata = {
  title: 'Auction Player Pool & Lots | PDVL 2026 Auction',
  description: 'Manage registered volleyball player lots, categories, and base prices for the PDVL auction.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionPlayersPage() {
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
