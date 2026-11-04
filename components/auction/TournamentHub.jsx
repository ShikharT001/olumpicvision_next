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
          {isAdmin ? (
            <>
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
            </>
          ) : (
            <span className="badge badge-gold px-3 py-1 rounded-pill text-xs fw-extrabold shadow-sm">
              🛡️ {tournament.tournament_name}
            </span>
          )}
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
      <div className="text-center mx-auto mb-5" style={{ maxWidth: 880 }}>
        <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-warning-subtle text-warning border border-warning-subtle mb-3">
          <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
          <span className="small fw-bold text-uppercase" style={{ letterSpacing: '0.08em' }}>
            {isAdmin ? 'Tournament Command Center' : 'Franchise Portal Hub'}
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
            ? `Welcome to the ${tournament.sport_name} Live Auction Control Center. Follow the numbered steps below to setup teams, register players, and conduct real-time bidding with projector displays.`
            : `Welcome Team Managers and Franchise Representatives. Track real-time bids, live sold outcomes, and remaining budgets.`}
        </p>

        {liveState.lastNotification && (
          <div
            className={`d-inline-flex flex-wrap align-items-center justify-content-center gap-2.5 px-4 py-2 rounded-pill bg-black bg-opacity-40 border mb-4 shadow-sm ${
              liveState.lastNotification.type === 'sold'
                ? 'border-warning border-opacity-40'
                : liveState.lastNotification.type === 'unsold'
                ? 'border-danger border-opacity-50'
                : 'border-secondary border-opacity-30'
            }`}
          >
            <span
              className={`badge rounded-pill px-2.5 py-1 text-xs fw-extrabold ${
                liveState.lastNotification.type === 'sold'
                  ? 'badge-gold'
                  : liveState.lastNotification.type === 'unsold'
                  ? 'bg-danger text-white'
                  : 'badge-cyan'
              }`}
            >
              {liveState.lastNotification.type === 'sold'
                ? '🎉 LATEST SALE'
                : liveState.lastNotification.type === 'unsold'
                ? '🛑 PLAYER UNSOLD'
                : '⚠️ LATEST OUTCOME'}
            </span>
            <strong className="text-white small mb-0">{liveState.lastNotification.message}</strong>
          </div>
        )}

        {/* STEP-BY-STEP QUICK WORKFLOW CARDS FOR NON-IT ORGANIZERS */}
        {isAdmin ? (
          <div className="text-start mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
              <span className="text-warning text-xs fw-bold text-uppercase tracking-wider">
                🎯 TOURNAMENT ORGANIZER WORKFLOW
              </span>
              <span className="text-white-50 text-xs">
                Click any step to begin or manage
              </span>
            </div>

            <div className="row g-3">
              {/* Step 1: Teams Setup */}
              <div className="col-12 col-sm-6 col-lg-4">
                <Link
                  href={`${basePath}/manage-teams`}
                  className="card h-100 p-3.5 text-start text-decoration-none auction-card transition-all"
                  style={{ borderColor: 'rgba(59, 130, 246, 0.45)' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 text-xs fw-bold">
                      Step 1
                    </span>
                    <span className="fs-3">⚙️</span>
                  </div>
                  <h5 className="fw-bold text-white mb-1">Teams &amp; Purses</h5>
                  <p className="text-secondary small mb-3">
                    Add franchise teams, team codes, jersey colors, and set starting budgets (e.g. ₹1 Lakh).
                  </p>
                  <span className="text-primary small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                    Manage Teams ({teams.length}) →
                  </span>
                </Link>
              </div>

              {/* Step 2: Player Lots */}
              <div className="col-12 col-sm-6 col-lg-4">
                <Link
                  href={`${basePath}/players`}
                  className="card h-100 p-3.5 text-start text-decoration-none auction-card transition-all"
                  style={{ borderColor: 'rgba(99, 102, 241, 0.45)' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-indigo text-white rounded-pill px-2.5 py-1 text-xs fw-bold" style={{ backgroundColor: '#6366f1' }}>
                      Step 2
                    </span>
                    <span className="fs-3">📋</span>
                  </div>
                  <h5 className="fw-bold text-white mb-1">Player Pool &amp; Lots</h5>
                  <p className="text-secondary small mb-3">
                    Add players or upload Excel list. Set base prices, positions, and arrange auction lots.
                  </p>
                  <span className="text-info small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                    Manage Players Pool →
                  </span>
                </Link>
              </div>

              {/* Step 3: Live Auction Desk (HERO CARD) */}
              <div className="col-12 col-sm-6 col-lg-4">
                <Link
                  href={`${basePath}/admin`}
                  className="card h-100 p-3.5 text-start text-decoration-none auction-card transition-all"
                  style={{
                    borderColor: 'rgba(245, 158, 11, 0.7)',
                    background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.96) 100%)',
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 text-xs fw-black">
                      Step 3 • LIVE
                    </span>
                    <span className="fs-3">🔨</span>
                  </div>
                  <h5 className="fw-black text-warning mb-1">Live Auction Desk</h5>
                  <p className="text-secondary small mb-3">
                    The bidding console. Call players to the stage, record team paddle bids, and hammer &quot;SOLD&quot;!
                  </p>
                  <span className="text-warning small fw-black d-inline-flex align-items-center gap-1 mt-auto">
                    Launch Auction Desk ➔
                  </span>
                </Link>
              </div>

              {/* Step 4: Big Screen TV */}
              <div className="col-12 col-sm-6 col-lg-4">
                <Link
                  href={`${basePath}/live`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card h-100 p-3.5 text-start text-decoration-none auction-card transition-all"
                  style={{ borderColor: 'rgba(14, 165, 233, 0.45)' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-info text-dark rounded-pill px-2.5 py-1 text-xs fw-bold">
                      Step 4 • TV
                    </span>
                    <span className="fs-3">📺</span>
                  </div>
                  <h5 className="fw-bold text-white mb-1">Big Screen (TV / Projector)</h5>
                  <p className="text-secondary small mb-3">
                    Fullscreen 16:9 display for venue TV or projector with live price, player photos &amp; fanfare.
                  </p>
                  <span className="text-info small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                    Open Projector Window ↗
                  </span>
                </Link>
              </div>

              {/* Step 5: Squads & Purses */}
              <div className="col-12 col-sm-6 col-lg-4">
                <Link
                  href={`${basePath}/teams`}
                  className="card h-100 p-3.5 text-start text-decoration-none auction-card transition-all"
                  style={{ borderColor: 'rgba(16, 185, 129, 0.45)' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-success text-white rounded-pill px-2.5 py-1 text-xs fw-bold">
                      Step 5
                    </span>
                    <span className="fs-3">🛡️</span>
                  </div>
                  <h5 className="fw-bold text-white mb-1">Squads &amp; Purses</h5>
                  <p className="text-secondary small mb-3">
                    View bought rosters for each franchise, remaining budget bars, and the Top 10 Bids table.
                  </p>
                  <span className="text-success small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                    View Rosters &amp; Budgets →
                  </span>
                </Link>
              </div>

              {/* Step 6: Pool Draw & Broadcast */}
              <div className="col-12 col-sm-6 col-lg-4">
                <Link
                  href={`${basePath}/pools`}
                  className="card h-100 p-3.5 text-start text-decoration-none auction-card transition-all"
                  style={{ borderColor: 'rgba(236, 72, 153, 0.45)' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 text-xs fw-bold">
                      Step 6
                    </span>
                    <span className="fs-3">🎡</span>
                  </div>
                  <h5 className="fw-bold text-white mb-1">Pool Draw Wheel</h5>
                  <p className="text-secondary small mb-3">
                    Conduct the group stage draw! Spin the live wheel to assign teams into Pool A, Pool B, etc.
                  </p>
                  <span className="text-danger small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                    Open Spin Wheel →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Spectator / Team Quick Cards */
          <div className="row g-3 justify-content-center mb-4">
            <div className="col-12 col-sm-6 col-lg-4">
              <Link
                href={`${basePath}/teams`}
                className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
                style={{ borderColor: 'rgba(16, 185, 129, 0.45)' }}
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

            <div className="col-12 col-sm-6 col-lg-4">
              <Link
                href={`${basePath}/live`}
                target="_blank"
                rel="noopener noreferrer"
                className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
                style={{ borderColor: 'rgba(245, 158, 11, 0.45)' }}
              >
                <div className="fs-1 mb-2">📺</div>
                <h4 className="fw-bold text-white mb-1">Big-Screen Stage</h4>
                <p className="text-secondary small mb-3">
                  Watch live bids in 16:9 fullscreen display designed for venue TVs and projectors.
                </p>
                <span className="text-warning small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                  Open Projector View ↗
                </span>
              </Link>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <Link
                href={`${basePath}/admin`}
                className="card h-100 p-4 text-start text-decoration-none auction-card transition-all"
                style={{ borderColor: 'rgba(6, 182, 212, 0.45)' }}
              >
                <div className="fs-1 mb-2">🔨</div>
                <h4 className="fw-bold text-white mb-1">Live Auction Desk</h4>
                <p className="text-secondary small mb-3">
                  Watch the live podium in real time. Track current bids, increments, and gavel stages.
                </p>
                <span className="text-cyan small fw-bold d-inline-flex align-items-center gap-1 mt-auto">
                  Watch Live Console →
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Live Financial & Tournament Overview Stats */}
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
                ⚙️ Adjust Purses
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
