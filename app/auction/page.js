import Link from 'next/link';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getLiveAuctionState } from '@/lib/auction-db';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole } from './actions';

export const metadata = {
  title: 'PDVL 2026/27 Live Auction Hub | Confidential Portal',
  description: 'Confidential Player Auction Console, Stage Display, and Team Squad Portals for Palghar District Volleyball League.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionHubPage({ searchParams }) {
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const resolvedParams = await searchParams;
    const errorMessage = resolvedParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo="/auction" />;
  }

  const role = await getAuctionRole();
  const isAdmin = await isAuctionAdmin();

  const data = await getLiveAuctionState();
  const teams = data.teams || [];
  const totalPurse = teams.reduce((acc, t) => acc + Number(t.initial_purse || 0), 0);
  const remainingPurse = teams.reduce((acc, t) => acc + Number(t.remaining_purse || 0), 0);
  const totalSpent = Math.max(0, totalPurse - remainingPurse);
  const totalSquadCount = teams.reduce((acc, t) => acc + (t.squad_count || 0), 0);

  return (
    <div className="auction-shell d-flex flex-column min-vh-100" data-bs-theme="dark">
      <AuctionNavbar role={role} />

      <main className="container py-4 py-md-5 my-auto">
        {/* Hero Banner */}
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 780 }}>
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-warning-subtle text-warning border border-warning-subtle mb-3">
            <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
            <span className="small fw-bold text-uppercase" style={{ letterSpacing: '0.08em' }}>
              {isAdmin ? 'Main Admin Command Stage' : 'Team Live Updates Hub'}
            </span>
          </div>
          <h1 className="display-5 fw-extrabold text-white mb-3 tracking-tight">
            Palghar District Volleyball League 2026/27
          </h1>
          <p className="text-secondary fs-5 mb-3 leading-relaxed">
            {isAdmin
              ? 'Welcome to the PDVL Live Auction Command Center. Manage bidding podiums, stream live big-screen stage graphics, and track team purses in real time.'
              : 'Welcome Team Managers and Franchise Representatives. Track real-time player bids, live sold announcements, and remaining team purses.'}
          </p>

          {data.lastNotification && (
            <div className="d-inline-flex flex-wrap align-items-center justify-content-center gap-2.5 px-4 py-2 rounded-pill bg-black bg-opacity-40 border border-warning border-opacity-30 mb-4 shadow-sm">
              <span className={`badge rounded-pill px-2.5 py-1 text-xs fw-extrabold ${data.lastNotification.type === 'sold' ? 'badge-gold' : 'bg-warning text-dark'}`}>
                {data.lastNotification.type === 'sold' ? '🎉 LATEST SALE' : '⚠️ LATEST OUTCOME'}
              </span>
              <strong className="text-white small mb-0">{data.lastNotification.message}</strong>
            </div>
          )}

          {/* Quick Nav Cards */}
          <div className="row g-3 justify-content-center">
            {isAdmin && (
              <div className="col-12 col-sm-6 col-md-4">
                <Link
                  href="/auction/admin"
                  className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
                  style={{ borderColor: 'rgba(6, 182, 212, 0.4)' }}
                >
                  <div className="fs-1 mb-2">🔨</div>
                  <h4 className="fw-bold text-white mb-1">Auctioneer Console</h4>
                  <p className="text-secondary small mb-3">
                    Admin podium to control active bids, physical paddle attribution, and hammer gavel.
                  </p>
                  <span className="text-cyan small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                    Launch Console →
                  </span>
                </Link>
              </div>
            )}

            <div className="col-12 col-sm-6 col-md-4">
              <Link
                href="/auction/live"
                className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
                style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <div className="fs-1 mb-2">📺</div>
                <h4 className="fw-bold text-white mb-1">Big-Screen Stage</h4>
                <p className="text-secondary small mb-3">
                  16:9 fullscreen display designed for venue TVs and projectors with celebratory fanfare.
                </p>
                <span className="text-warning small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                  Open Projector View →
                </span>
              </Link>
            </div>

            <div className="col-12 col-sm-6 col-md-4">
              <Link
                href="/auction/teams"
                className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
                style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <div className="fs-1 mb-2">🛡️</div>
                <h4 className="fw-bold text-white mb-1">Squads & Purse</h4>
                <p className="text-secondary small mb-3">
                  Inspect all teams, remaining budget charts, purchased rosters, and positional balance.
                </p>
                <span className="text-success small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                  View Team Rosters →
                </span>
              </Link>
            </div>

            {!isAdmin && (
              <div className="col-12 col-sm-6 col-md-4">
                <Link
                  href="/auction/players"
                  className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
                  style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}
                >
                  <div className="fs-1 mb-2">📋</div>
                  <h4 className="fw-bold text-white mb-1">Player Pool</h4>
                  <p className="text-secondary small mb-3">
                    Browse all registered tournament players, playing positions, base prices, and lot order.
                  </p>
                  <span className="text-info small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                    Browse Players →
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Live Overview Stats */}
        <div className="auction-card p-4 mx-auto" style={{ maxWidth: 940 }}>
          <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3 border-secondary border-opacity-25">
            <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <span>Auction Financials & Roster Health</span>
            </h5>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill small fw-bold">
              ● SYNC ACTIVE
            </span>
          </div>

          <div className="row g-3 text-center">
            <div className="col-6 col-md-3">
              <span className="text-secondary small d-block">Participating Teams</span>
              <strong className="fs-3 fw-bold text-white">{teams.length}</strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-secondary small d-block">Total League Purse</span>
              <strong className="fs-3 fw-bold text-warning">₹{totalPurse.toLocaleString()}</strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-secondary small d-block">Spent in Bids</span>
              <strong className="fs-3 fw-bold text-info">₹{totalSpent.toLocaleString()}</strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-secondary small d-block">Players Acquired</span>
              <strong className="fs-3 fw-bold text-success">{totalSquadCount}</strong>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-3 border-top border-secondary border-opacity-10 text-center text-secondary small">
        <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <span>© 2026 Palghar District Volleyball League & Olympic Vision</span>
          <span>
            Designed &amp; Developed by{' '}
            <a href="https://thetechnocyte.com" target="_blank" rel="noreferrer" className="text-info text-decoration-none fw-semibold">
              Technocyte
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
