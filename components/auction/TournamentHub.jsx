'use client';

import Link from 'next/link';

export default function TournamentHub({ tournament, liveState = {}, role = 'team', isAdmin = false }) {
  const teams = liveState.teams || [];
  const totalPurse = teams.reduce((acc, t) => acc + Number(t.initial_purse || 0), 0);
  const remainingPurse = teams.reduce((acc, t) => acc + Number(t.remaining_purse || 0), 0);
  const totalSpent = Math.max(0, totalPurse - remainingPurse);
  const totalSquadCount = teams.reduce((acc, t) => acc + (t.squad_count || 0), 0);

  const tId = tournament?.id || tournament?.slug;
  const basePath = `/auction/t/${tId}`;
  const sport = tournament?.sportConfig || {};

  return (
    <div className="container py-4 py-md-5 my-auto">
      {/* Top Breadcrumb Navigation */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <Link
            href="/auction"
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 text-white text-xs text-decoration-none"
          >
            ← All Games
          </Link>
          <span className="text-secondary small">/</span>
          <Link
            href={`/auction?sport=${tournament.sport_id}`}
            className="btn btn-sm btn-outline-info rounded-pill px-3 py-1 text-info text-xs text-decoration-none"
          >
            {sport.icon || '🏅'} {tournament.sport_name} Tournaments
          </Link>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className={`badge rounded-pill text-xs px-2.5 py-1 ${tournament.status === 'active' ? 'tournament-badge-live' : 'bg-secondary text-white'}`}>
            {tournament.status === 'active' ? '● LIVE TOURNAMENT' : tournament.status?.toUpperCase()}
          </span>
          <span className="badge bg-dark text-secondary border border-secondary border-opacity-30 rounded-pill text-xs">
            {tournament.season_year || '2026/27'}
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="text-center mx-auto mb-5" style={{ maxWidth: 840 }}>
        <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-warning-subtle text-warning border border-warning-subtle mb-3">
          <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
          <span className="small fw-bold text-uppercase" style={{ letterSpacing: '0.08em' }}>
            {isAdmin ? 'Main Admin Auction Command Stage' : 'Franchise Live Updates Hub'}
          </span>
        </div>

        <div className="d-flex align-items-center justify-content-center gap-2.5 mb-2">
          <span className="fs-1">{sport.icon || '🏆'}</span>
          <h1 className="display-5 fw-extrabold text-white mb-0 tracking-tight">
            {tournament.tournament_name}
          </h1>
        </div>

        {tournament.venue && (
          <p className="text-secondary small mb-3">
            📍 {tournament.venue}
          </p>
        )}

        <p className="text-secondary fs-5 mb-4 leading-relaxed">
          {isAdmin
            ? `Welcome to the ${tournament.sport_name} Live Auction Command Center. Manage bidding podiums, stream live big-screen stage graphics, and track team purses in real time.`
            : `Welcome Team Managers and Franchise Representatives for ${tournament.tournament_name}. Track real-time bids, live sold outcomes, and remaining budgets.`}
        </p>

        {liveState.lastNotification && (
          <div className="d-inline-flex flex-wrap align-items-center justify-content-center gap-2.5 px-4 py-2 rounded-pill bg-black bg-opacity-40 border border-warning border-opacity-30 mb-4 shadow-sm">
            <span className={`badge rounded-pill px-2.5 py-1 text-xs fw-extrabold ${liveState.lastNotification.type === 'sold' ? 'badge-gold' : 'bg-warning text-dark'}`}>
              {liveState.lastNotification.type === 'sold' ? '🎉 LATEST SALE' : '⚠️ LATEST OUTCOME'}
            </span>
            <strong className="text-white small mb-0">{liveState.lastNotification.message}</strong>
          </div>
        )}

        {/* Quick Nav Cards */}
        <div className="row g-3 justify-content-center">
          <div className="col-12 col-sm-6 col-md-3">
            <Link
              href={`${basePath}/admin`}
              className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
              style={{ borderColor: 'rgba(6, 182, 212, 0.4)' }}
            >
              <div className="fs-1 mb-2">🔨</div>
              <h4 className="fw-bold text-white mb-1">
                {isAdmin ? 'Auctioneer Console' : 'Live Auction Console'}
              </h4>
              <p className="text-secondary small mb-3">
                {isAdmin
                  ? 'Admin podium to control active bids, physical paddle attribution, and hammer gavel.'
                  : 'Watch the live auctioneer podium in real time. Track current bids, increments, and gavel stages.'}
              </p>
              <span className="text-cyan small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                {isAdmin ? 'Launch Console →' : 'Watch Live Console →'}
              </span>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-md-3">
            <Link
              href={`${basePath}/live`}
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

          <div className="col-12 col-sm-6 col-md-3">
            <Link
              href={`${basePath}/teams`}
              className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
              style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              <div className="fs-1 mb-2">🛡️</div>
              <h4 className="fw-bold text-white mb-1">Squads &amp; Purse</h4>
              <p className="text-secondary small mb-3">
                Inspect all teams, remaining budget charts, purchased rosters, and positional balance.
              </p>
              <span className="text-success small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                View Team Rosters →
              </span>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-md-3">
            <Link
              href={`${basePath}/players`}
              className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
              style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}
            >
              <div className="fs-1 mb-2">📋</div>
              <h4 className="fw-bold text-white mb-1">
                {isAdmin ? 'Player Pool & Lots' : 'Player Pool'}
              </h4>
              <p className="text-secondary small mb-3">
                Browse registered players, playing positions for {tournament.sport_name}, base prices, and lot order.
              </p>
              <span className="text-info small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                {isAdmin ? 'Manage Players →' : 'Browse Players →'}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Overview Stats */}
      <div className="auction-card p-4 mx-auto" style={{ maxWidth: 940 }}>
        <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3 border-secondary border-opacity-25">
          <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
            <span>{sport.icon || '🏆'} Tournament Financials &amp; Roster Health</span>
          </h5>
          <div className="d-flex align-items-center gap-2">
            {isAdmin && (
              <Link
                href={`${basePath}/manage-teams`}
                className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 text-xs fw-bold"
              >
                ⚙️ Manage Teams &amp; Purses
              </Link>
            )}
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill small fw-bold">
              ● SYNC ACTIVE
            </span>
          </div>
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
    </div>
  );
}
