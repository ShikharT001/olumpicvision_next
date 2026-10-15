import Link from 'next/link';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctioneerConsole from '@/components/auction/AuctioneerConsole';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getLiveAuctionState } from '@/lib/auction-db';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole } from '../actions';

export const metadata = {
  title: 'Auctioneer Control Console | PDVL 2026 Live Auction',
  description: 'Podium controls, physical paddle attribution, and live hammer gavel for Palghar District Volleyball League auction.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionAdminPage({ searchParams }) {
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const resolvedParams = await searchParams;
    const errorMessage = resolvedParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo="/auction/admin" />;
  }

  const role = await getAuctionRole();
  const isAdmin = await isAuctionAdmin();

  if (!isAdmin) {
    return (
      <div className="auction-shell min-vh-100 d-flex flex-column">
        <AuctionNavbar role={role} />
        <main className="container my-auto py-5 text-center">
          <div className="auction-card p-4 p-md-5 mx-auto text-center" style={{ maxWidth: 540 }}>
            <div className="fs-1 mb-2">🛑</div>
            <span className="badge bg-danger text-white rounded-pill px-3 py-1 text-xs fw-extrabold text-uppercase mb-3">
              Admin Privileges Required
            </span>
            <h3 className="h4 fw-extrabold text-white mb-2">
              Auctioneer Console is Restricted
            </h3>
            <p className="text-secondary small mb-4 leading-relaxed">
              You are currently logged in with <strong>Team View-Only</strong> access. Only the Main Tournament Admin / Auctioneer has permission to operate the gavel and attribute paddle bids.
            </p>
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
              <Link href="/auction/teams" className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold">
                Go to Team Squads Board →
              </Link>
              <Link href="/auction/live" className="btn btn-outline-light rounded-pill px-3 py-2 text-xs fw-bold">
                Watch Live Stage ↗
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const initialData = await getLiveAuctionState();

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column">
      <AuctionNavbar role="admin" />
      <main className="flex-grow-1">
        <AuctioneerConsole initialData={initialData} />
      </main>
    </div>
  );
}
