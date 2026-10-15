import Link from 'next/link';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamsManager from '@/components/auction/TeamsManager';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole } from '../actions';

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

  const role = await getAuctionRole();
  const isAdmin = await isAuctionAdmin();

  if (!isAdmin) {
    return (
      <div className="auction-shell min-vh-100 d-flex flex-column">
        <AuctionNavbar role={role} />
        <main className="container my-auto py-5 text-center">
          <div className="auction-card p-4 p-md-5 mx-auto text-center" style={{ maxWidth: 540 }}>
            <div className="fs-1 mb-2">🛡️</div>
            <span className="badge bg-danger text-white rounded-pill px-3 py-1 text-xs fw-extrabold text-uppercase mb-3">
              Admin Privileges Required
            </span>
            <h3 className="h4 fw-extrabold text-white mb-2">
              Team & Budget Configuration is Restricted
            </h3>
            <p className="text-secondary small mb-4 leading-relaxed">
              Teams and purses can only be modified by the Main Tournament Administrator. You can view all live squads and remaining purses on the public team board.
            </p>
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
              <Link href="/auction/teams" className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold">
                Go to Team Squads Board →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const initialTeams = await getAuctionTeams();

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column">
      <AuctionNavbar role="admin" />
      <main className="flex-grow-1">
        <TeamsManager initialTeams={initialTeams} />
      </main>
    </div>
  );
}
