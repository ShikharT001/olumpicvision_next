'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAuction } from '@/app/auction/actions';

export default function AuctionNavbar({ role = 'team', tournament = null, team = null }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpGuideOpen, setHelpGuideOpen] = useState(false);
  const isAdmin = role === 'admin';
  const tournamentId = tournament?.id || tournament?.slug;
  const basePath = tournamentId ? `/auction/t/${tournamentId}` : '/auction';

  const isTeam = role === 'team' || Boolean(team?.id);
  const [navStageView, setNavStageView] = useState('podium');

  useEffect(() => {
    if (!isAdmin) return;
    const checkState = async () => {
      try {
        const url = tournamentId ? `/api/auction/state?tournamentId=${encodeURIComponent(tournamentId)}` : '/api/auction/state';
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json?.state?.stage_view) {
            setNavStageView(json.state.stage_view);
          }
        }
      } catch {}
    };
    checkState();
    const timer = setInterval(checkState, 2000);
    return () => clearInterval(timer);
  }, [isAdmin, tournamentId]);

  const handleToggleNavbarStageView = async () => {
    const nextView = navStageView === 'top10' ? 'podium' : 'top10';
    setNavStageView(nextView);
    try {
      await fetch('/api/auction/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_stage_view', view: nextView, tournamentId }),
      });
    } catch {}
  };

  // Human-friendly logical sequence ordered for tournament operators
  const adminLinks = tournamentId
    ? [
        {
          href: `${basePath}/manage-teams`,
          label: '⚙️ Teams Setup',
          step: 'Step 1',
          hint: 'Configure franchise teams, budgets & colors',
        },
        {
          href: `${basePath}/players`,
          label: '📋 Players & Lots',
          step: 'Step 2',
          hint: 'Register players, set base prices & auction order',
        },
        {
          href: `${basePath}/admin`,
          label: '🔨 Live Auction Desk',
          step: 'Step 3',
          hint: 'Live bidding podium, team paddles & hammer control',
          isLiveDesk: true,
        },
        {
          href: `${basePath}/teams`,
          label: '🛡️ Squads & Purses',
          step: 'Step 4',
          hint: 'View acquired rosters, remaining budgets & top 10',
        },
        {
          href: `${basePath}/pools`,
          label: '🎡 Pool Draw',
          step: 'Step 5',
          hint: 'Draw teams into tournament groups with spin wheel',
        },
        {
          href: `${basePath}/live`,
          label: '📺 Big Screen TV ↗',
          hint: 'Fullscreen display for audience TV or venue projector',
          isExternal: true,
        },
        {
          href: `${basePath}/stream`,
          label: '🎥 YouTube Live ↗',
          hint: 'Broadcast stream with live camera & auction overlay',
          isExternal: true,
        },
      ]
    : [
        { href: '/auction', label: '🏆 Championships' },
        { href: '/auction/teams', label: '🛡️ Squads & Purse' },
      ];

  const teamLinks = tournamentId
    ? [
        ...(team?.id
          ? [{ href: `${basePath}/teams?teamId=${team.id}`, label: `⭐ My Squad (${team.code || 'Team'})`, hint: 'View your team roster and budget' }]
          : []),
        { href: `${basePath}/teams`, label: '🛡️ All Squads & Purses', hint: 'Track all teams and budgets' },
        { href: `${basePath}/live`, label: '📺 Big-Screen Stage ↗', hint: 'Audience display', isExternal: true },
      ]
    : [
        { href: '/auction', label: '🏆 Championships' },
        { href: '/auction/teams', label: '🛡️ Squads & Purse' },
      ];

  const visibleLinks = isAdmin ? adminLinks : teamLinks;

  return (
    <>
      <header
        className="border-bottom sticky-top"
        style={{
          borderColor: 'var(--auction-border)',
          background: 'rgba(9, 14, 26, 0.96)',
          backdropFilter: 'blur(20px)',
          zIndex: 1040,
        }}
      >
        <div className="container-fluid px-2.5 px-md-4 py-2 d-flex align-items-center justify-content-between gap-2">
          {/* Brand & Breadcrumbs */}
          <div className="d-flex align-items-center gap-1.5 min-w-0">
            <Link
              href={isTeam && tournamentId ? `${basePath}/teams` : '/auction'}
              className="text-decoration-none d-flex align-items-center gap-1.5 flex-shrink-0"
              title="Return to Auction Hub"
            >
              <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-30 px-2 py-0.5 rounded-pill text-xs fw-bold">
                🏆 OV
              </span>
              <span className="fw-extrabold text-white tracking-tight d-none d-sm-inline" style={{ fontSize: '0.92rem' }}>
                {isTeam ? 'FRANCHISE PORTAL' : 'AUCTION HUB'}
              </span>
            </Link>

            {tournament && (
              <>
                <span className="text-secondary opacity-40 small flex-shrink-0">/</span>
                <Link
                  href={basePath}
                  className="badge badge-gold px-2 px-sm-2.5 py-1 rounded-pill text-xs d-inline-flex align-items-center gap-1 shadow-sm text-truncate text-decoration-none"
                  style={{ maxWidth: 'clamp(120px, 34vw, 240px)' }}
                  title={`${tournament.tournament_name} — Click to view Dashboard Hub`}
                >
                  <span className="text-truncate">{tournament.tournament_name}</span>
                </Link>
              </>
            )}

            {team ? (
              <span
                className="badge px-2 py-0.5 rounded-pill text-xs fw-extrabold shadow-sm d-inline-flex align-items-center gap-1 flex-shrink-0"
                style={{
                  backgroundColor: team.color || '#06b6d4',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
                title={`Logged in as ${team.name || team.code}`}
              >
                <span>🛡️</span>
                <span className="text-truncate" style={{ maxWidth: 100 }}>
                  {team.code || team.name}
                </span>
              </span>
            ) : isAdmin ? (
              <span className="badge bg-warning text-dark px-2 py-0.5 rounded-pill text-xs fw-extrabold shadow-sm flex-shrink-0">
                👑 ADMIN
              </span>
            ) : null}
          </div>

          {/* DESKTOP NAVIGATION TABS */}
          <nav className="d-none d-lg-flex align-items-center gap-1 ms-auto">
            {tournament && isAdmin && (
              <Link
                href={`/auction?sport=${tournament.sport_id}`}
                className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-1 text-xs fw-bold me-1 d-inline-flex align-items-center gap-1"
                title="Switch to another tournament or sport"
              >
                <span>⇄</span>
                <span>Switch Sport</span>
              </Link>
            )}

            {/* Quick Non-IT Operator Help Button */}
            <button
              type="button"
              className="btn btn-sm btn-outline-warning rounded-pill px-2.5 py-1 text-xs fw-bold me-1 d-inline-flex align-items-center gap-1 shadow-sm"
              onClick={() => setHelpGuideOpen(true)}
              title="Click for a quick step-by-step guide on how to run this auction"
            >
              <span>💡</span>
              <span>How To Run</span>
            </button>

            {visibleLinks.map((link) => {
              const isActive = pathname === link.href;
              const isExternal = Boolean(link.isExternal);
              const isLiveDesk = Boolean(link.isLiveDesk);

              return (
                <div key={link.href} className="d-inline-flex align-items-center gap-1">
                  <Link
                    href={link.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className={`btn btn-sm rounded-pill px-2.5 py-1 fw-bold transition-all d-inline-flex align-items-center gap-1.5 ${
                      isActive
                        ? isLiveDesk
                          ? 'btn-warning text-dark shadow fw-black'
                          : 'btn-primary text-white shadow-sm'
                        : isLiveDesk
                        ? 'btn-outline-warning text-warning border-opacity-70'
                        : 'btn-outline-secondary border-0 text-light opacity-80 hover-opacity-100'
                    }`}
                    style={{ fontSize: '0.8rem' }}
                    title={link.hint}
                  >
                    <span>{link.label}</span>
                    {isLiveDesk && (
                      <span className="badge bg-danger text-white rounded-pill px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                        ●
                      </span>
                    )}
                  </Link>
                  {isExternal && link.label.includes('Big Screen') && isAdmin && (
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-2 py-0.5 text-xs fw-black d-inline-flex align-items-center gap-1 shadow-sm transition-all ${
                        navStageView === 'top10'
                          ? 'btn-warning text-dark border-2 border-white'
                          : 'btn-outline-warning text-warning'
                      }`}
                      style={{ fontSize: '0.74rem' }}
                      onClick={handleToggleNavbarStageView}
                      title="Toggle TV projector between Active Player and Top 10 Bids"
                    >
                      <span>🏆</span>
                      <span>{navStageView === 'top10' ? 'Top 10' : 'Top 10'}</span>
                    </button>
                  )}
                </div>
              );
            })}

            <form action={logoutAuction} className="ms-1">
              <button
                type="submit"
                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 text-xs fw-semibold"
                title="Lock portal and logout"
              >
                🔒 Lock
              </button>
            </form>
          </nav>

          {/* MOBILE TOGGLER BUTTON */}
          <div className="d-flex d-lg-none align-items-center gap-1.5 ms-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-warning rounded-pill px-2 py-1 text-xs fw-bold d-inline-flex align-items-center gap-1"
              onClick={() => setHelpGuideOpen(true)}
              title="Help Guide"
            >
              <span>💡</span>
              <span>Guide</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-extrabold d-inline-flex align-items-center gap-1.5 transition-all ${
                mobileMenuOpen
                  ? 'btn-warning text-dark shadow-sm'
                  : 'btn-outline-secondary border-opacity-40 text-light'
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span>{mobileMenuOpen ? '✕' : '☰'}</span>
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* WORKFLOW PROGRESSION RIBBON FOR NON-IT OPERATORS (DESKTOP) */}
        {tournament && isAdmin && (
          <div
            className="d-none d-md-flex align-items-center justify-content-between px-3 px-md-4 py-1 border-top border-secondary border-opacity-20 text-xs"
            style={{ background: 'rgba(5, 9, 20, 0.85)' }}
          >
            <div className="d-flex align-items-center gap-2 overflow-auto py-0.5">
              <span className="text-white-50 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                Tournament Flow:
              </span>

              <Link
                href={`${basePath}/manage-teams`}
                className={`text-decoration-none px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1 transition-all ${
                  pathname.includes('/manage-teams')
                    ? 'bg-primary text-white fw-bold shadow-sm'
                    : 'text-white-50 hover-text-white'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                <span>1. Teams Setup</span>
              </Link>
              <span className="text-secondary opacity-40">➔</span>

              <Link
                href={`${basePath}/players`}
                className={`text-decoration-none px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1 transition-all ${
                  pathname.includes('/players')
                    ? 'bg-primary text-white fw-bold shadow-sm'
                    : 'text-white-50 hover-text-white'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                <span>2. Player Lots</span>
              </Link>
              <span className="text-secondary opacity-40">➔</span>

              <Link
                href={`${basePath}/admin`}
                className={`text-decoration-none px-2.5 py-0.5 rounded-pill d-inline-flex align-items-center gap-1 transition-all ${
                  pathname.includes('/admin')
                    ? 'bg-warning text-dark fw-black shadow-sm'
                    : 'text-warning opacity-80 hover-opacity-100'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                <span>⚡ 3. Live Auction Desk</span>
              </Link>
              <span className="text-secondary opacity-40">➔</span>

              <Link
                href={`${basePath}/teams`}
                className={`text-decoration-none px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1 transition-all ${
                  pathname.includes('/teams') && !pathname.includes('/manage-teams')
                    ? 'bg-primary text-white fw-bold shadow-sm'
                    : 'text-white-50 hover-text-white'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                <span>4. Squads &amp; Purses</span>
              </Link>
              <span className="text-secondary opacity-40">➔</span>

              <Link
                href={`${basePath}/pools`}
                className={`text-decoration-none px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1 transition-all ${
                  pathname.includes('/pools')
                    ? 'bg-primary text-white fw-bold shadow-sm'
                    : 'text-white-50 hover-text-white'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                <span>5. Pool Draw</span>
              </Link>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
              <Link
                href={`${basePath}/live`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none text-info d-inline-flex align-items-center gap-1 opacity-90 hover-opacity-100 fw-semibold"
                style={{ fontSize: '0.74rem' }}
                title="Open audience display in new tab"
              >
                <span>📺 Projector TV View ↗</span>
              </Link>
            </div>
          </div>
        )}

        {/* MOBILE COLLAPSIBLE DROPDOWN NAV */}
        {mobileMenuOpen && (
          <div
            className="d-lg-none border-top border-secondary border-opacity-25 p-3"
            style={{
              background: 'linear-gradient(180deg, rgba(9, 14, 26, 0.98) 0%, rgba(5, 8, 18, 0.99) 100%)',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.75)',
              maxHeight: '75vh',
              overflowY: 'auto',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2.5 pb-2 border-bottom border-secondary border-opacity-20">
              <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs fw-bold text-uppercase">
                TOURNAMENT NAVIGATION
              </span>
              <span className="text-white-50 text-xs">
                {tournament ? tournament.tournament_name : 'Olympic Vision'}
              </span>
            </div>

            <div className="row g-2 mb-3">
              {visibleLinks.map((link) => {
                const isActive = pathname === link.href;
                const parts = link.label.split(' ');
                const icon = parts[0];
                const text = parts.slice(1).join(' ');

                return (
                  <div key={link.href} className="col-6">
                    <Link
                      href={link.href}
                      target={link.isExternal ? '_blank' : undefined}
                      className={`btn w-100 text-start p-2.5 rounded-3 d-flex align-items-center gap-2 text-xs fw-bold transition-all ${
                        isActive
                          ? 'btn-info text-dark shadow-sm'
                          : 'auction-sub-card text-white hover-border-info'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="fs-5 lh-1 flex-shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="text-truncate">{text}</div>
                        {link.step && (
                          <span className="badge bg-black bg-opacity-60 text-warning px-1.5 py-0.2 rounded text-xxs">
                            {link.step}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Quick Guide Trigger on mobile */}
            <div className="mb-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-warning w-100 rounded-pill py-2 text-xs fw-bold d-flex align-items-center justify-content-center gap-1.5"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setHelpGuideOpen(true);
                }}
              >
                <span>💡</span>
                <span>How to Run This Auction (Step-by-Step Guide)</span>
              </button>
            </div>

            {/* Admin Switch Tournament Button */}
            {tournament && isAdmin && (
              <div className="mb-2.5">
                <Link
                  href={`/auction?sport=${tournament.sport_id}`}
                  className="btn btn-sm btn-outline-info w-100 rounded-pill py-2 text-xs fw-bold d-flex align-items-center justify-content-center gap-1.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>⇄</span>
                  <span>Switch Championship Tournament</span>
                </Link>
              </div>
            )}

            {/* Logout / Lock Button */}
            <div className="pt-2 border-top border-secondary border-opacity-20">
              <form action={logoutAuction}>
                <button
                  type="submit"
                  className="btn btn-outline-danger w-100 rounded-pill py-2 text-xs fw-bold d-flex align-items-center justify-content-center gap-2"
                >
                  <span>🔒</span>
                  <span>Lock &amp; Logout of Portal</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* QUICK NON-IT OPERATOR HELP GUIDE MODAL */}
      {helpGuideOpen && (
        <div
          className="modal show d-block"
          data-bs-theme="dark"
          style={{ backgroundColor: 'rgba(2, 6, 16, 0.88)', backdropFilter: 'blur(10px)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content auction-card border-warning border-opacity-40 text-white shadow-2xl">
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2.5">
                  <span className="fs-3">💡</span>
                  <div>
                    <h5 className="modal-title fw-black text-warning mb-0 fs-5">
                      Tournament Auctioneer &amp; Operator Guide
                    </h5>
                    <span className="text-white-50 text-xs">
                      Simple step-by-step instructions for non-IT tournament coordinators
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setHelpGuideOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 text-start">
                <div className="row g-3 mb-4">
                  {/* Step 1 */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-30 h-100">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-primary text-white rounded-pill px-2 py-0.5 text-xs fw-bold">
                          Step 1
                        </span>
                        <strong className="text-white small">⚙️ Teams Setup</strong>
                      </div>
                      <p className="text-white-50 small mb-0">
                        Go to <strong>Teams Setup</strong> to register franchise teams, choose team jersey colors, and set starting purse money (e.g. ₹1,00,000 per team).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-30 h-100">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-primary text-white rounded-pill px-2 py-0.5 text-xs fw-bold">
                          Step 2
                        </span>
                        <strong className="text-white small">📋 Player Lots</strong>
                      </div>
                      <p className="text-white-50 small mb-0">
                        In <strong>Player Lots</strong>, add players one-by-one or import an Excel/CSV list. Set their Chest #, playing position, category, and base price.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-warning border-opacity-40 h-100">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-warning text-dark rounded-pill px-2 py-0.5 text-xs fw-black">
                          Step 3
                        </span>
                        <strong className="text-warning small">🔨 Live Auction Desk</strong>
                      </div>
                      <p className="text-white-50 small mb-0">
                        This is the auction desk!
                        <br />• Click <strong>&quot;Call Next Player&quot;</strong> or enter their Chest #.
                        <br />• When a team raises their paddle in the room, tap that <strong>Team&apos;s Card</strong> (+₹500 / +₹1,000).
                        <br />• Tap <strong>&quot;SOLD!&quot;</strong> when bidding concludes!
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-info border-opacity-30 h-100">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-info text-dark rounded-pill px-2 py-0.5 text-xs fw-bold">
                          Step 4
                        </span>
                        <strong className="text-info small">📺 Big Screen Projector / TV</strong>
                      </div>
                      <p className="text-white-50 small mb-0">
                        Connect your laptop to an HDMI TV or projector. Click <strong>&quot;Big Screen TV ↗&quot;</strong>, drag that window to the TV screen, and press <strong>F11</strong> for full-screen audience fanfare!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Helpful tips box */}
                <div className="p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-30 mb-3">
                  <h6 className="text-warning fw-bold mb-1.5 d-flex align-items-center gap-1.5 fs-6">
                    <span>⚡ Quick Tips for the Auctioneer:</span>
                  </h6>
                  <ul className="text-white-50 small mb-0 ps-3">
                    <li className="mb-1">
                      <strong>Mistake during bidding?</strong> Simply tap <strong>&quot;↺ Undo&quot;</strong> to revert the last bid or hammer award instantly.
                    </li>
                    <li className="mb-1">
                      <strong>No bids for a player?</strong> Tap <strong>&quot;✕ Unsold&quot;</strong> to safely place them in the Round 2 pool for later.
                    </li>
                    <li className="mb-1">
                      <strong>Want to show Top 10 Bids on the big screen?</strong> Click the <strong>&quot;Show Top 10&quot;</strong> button on your desk anytime during the break.
                    </li>
                    <li>
                      <strong>Check team budgets:</strong> Open <strong>Squads &amp; Purses</strong> anytime to see remaining money and roster balance for each team.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-2.5 d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-warning text-dark rounded-pill px-4 py-1.5 fw-bold text-xs shadow"
                  onClick={() => setHelpGuideOpen(false)}
                >
                  Got It, Let&apos;s Run the Auction! ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
