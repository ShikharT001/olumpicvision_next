import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated } from '../actions';

export const metadata = {
  title: 'Team Squads & Remaining Purse | PDVL 2026 Auction',
  description: 'Track team purse spending, remaining budget, and acquired volleyball rosters in real time.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionTeamsPage({ searchParams }) {
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const resolvedParams = await searchParams;
    const errorMessage = resolvedParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo="/auction/teams" />;
  }

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
