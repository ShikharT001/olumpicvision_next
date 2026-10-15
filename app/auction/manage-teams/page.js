import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamsManager from '@/components/auction/TeamsManager';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated } from '../actions';

export const metadata = {
  title: 'Manage Teams & Budgets | PDVL 2026 Auction',
  description: 'Configure participating volleyball teams, starting purses, and squad limits for the PDVL live auction.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionManageTeamsPage({ searchParams }) {
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const resolvedParams = await searchParams;
    const errorMessage = resolvedParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo="/auction/manage-teams" />;
  }

  const initialTeams = await getAuctionTeams();

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column">
      <AuctionNavbar />
      <main className="flex-grow-1">
        <TeamsManager initialTeams={initialTeams} />
      </main>
    </div>
  );
}
