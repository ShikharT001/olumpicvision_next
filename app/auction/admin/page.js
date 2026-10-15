import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctioneerConsole from '@/components/auction/AuctioneerConsole';
import '@/app/auction/auction.css';
import { getLiveAuctionState } from '@/lib/auction-db';

export const metadata = {
  title: 'Auctioneer Control Console | PDVL 2026 Live Auction',
  description: 'Podium controls, physical paddle attribution, and live hammer gavel for Palghar District Volleyball League auction.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionAdminPage() {
  const initialData = await getLiveAuctionState();

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column">
      <AuctionNavbar />
      <main className="flex-grow-1">
        <AuctioneerConsole initialData={initialData} />
      </main>
    </div>
  );
}
