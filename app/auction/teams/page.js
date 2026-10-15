import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import '@/app/auction/auction.css';
import { getAuctionTeams } from '@/lib/auction-db';

export const metadata = {
  title: 'Team Squads & Remaining Purse | PDVL 2026 Auction',
  description: 'Track team purse spending, remaining budget, and acquired volleyball rosters in real time.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionTeamsPage() {
  const initialTeams = await getAuctionTeams();

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column">
      <AuctionNavbar />
      <main className="flex-grow-1">
        <TeamSquadsDashboard initialTeams={initialTeams} />
      </main>
    </div>
  );
}
