'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAuction } from '@/app/auction/actions';

export default function AuctionNavbar({ role = 'team', tournament = null, team = null }) {
  const pathname = usePathname();
  const [showDrawer, setShowDrawer] = useState(false);
  const isAdmin = role === 'admin';

  const tournamentId = tournament?.id || tournament?.slug;
  const basePath = tournamentId ? `/auction/t/${tournamentId}` : '/auction';

  const isTeam = role === 'team' || Boolean(team?.id);

  const tournamentLinks = tournamentId
    ? isAdmin
      ? [
          { href: `${basePath}/admin`, label: '🔨 Auctioneer Console' },
          { href: `${basePath}/stream`, label: '🎥 YouTube Live' },
          { href: `${basePath}/live`, label: '📺 Big-Screen Live' },
          { href: `${basePath}/teams`, label: '🛡️ Squads & Purse' },
          { href: `${basePath}/pools`, label: '🎡 Pool Draw' },
          { href: `${basePath}/players`, label: '📋 Player Pool & Lots' },
          { href: `${basePath}/manage-teams`, label: '⚙️ Teams Setup' },
        ]
      : [
          ...(team?.id
            ? [{ href: `${basePath}/teams?teamId=${team.id}`, label: `⭐ My Squad (${team.code || 'Team'})` }]
            : []),
          { href: `${basePath}/teams`, label: '🛡️ Squads & Purse' },
          { href: `${basePath}/live`, label: '📺 Big-Screen Stage' },
        ]
    : [];

  const visibleLinks = tournamentLinks;

  // Mobile Bottom Bar Quick Destinations (Clean 4-5 touch items)
  const mobileQuickLinks = tournamentId
    ? isAdmin
      ? [
          { href: `${basePath}/admin`, label: 'Console', icon: '🔨' },
          { href: `${basePath}/stream`, label: 'Live Stream', icon: '🎥' },
          { href: `${basePath}/teams`, label: 'Squads', icon: '🛡️' },
          { href: `${basePath}/manage-teams`, label: 'Teams Setup', icon: '⚙️' },
          { isAction: true, label: 'More', icon: '☰' },
        ]
      : [
          ...(team?.id
            ? [{ href: `${basePath}/teams?teamId=${team.id}`, label: 'My Squad', icon: '⭐' }]
            : []),
          { href: `${basePath}/teams`, label: 'Squads', icon: '🛡️' },
          { href: `${basePath}/live`, label: 'Stage', icon: '📺' },
          { href: `${basePath}/stream`, label: 'Stream', icon: '🎥' },
          { isAction: true, label: 'More', icon: '☰' },
        ]
    : [
        { href: '/auction', label: 'Home', icon: '🏆' },
        { href: '/auction/teams', label: 'Squads', icon: '🛡️' },
        { isAction: true, label: 'More', icon: '☰' },
      ];

  return (
    <>
      <header
        className="border-bottom sticky-top"
        style={{
          borderColor: 'var(--auction-border)',
          background: 'rgba(8, 16, 34, 0.95)',
          backdropFilter: 'blur(14px)',
          zIndex: 1040,
        }}
      >
        <div className="container-fluid px-2.5 px-md-4 py-2 d-flex align-items-center justify-content-between gap-2">
          {/* Brand & Breadcrumbs */}
          <div className="d-flex align-items-center gap-1.5 min-w-0">
            <Link
              href={isTeam && tournamentId ? `${basePath}/teams` : '/auction'}
              className="text-decoration-none d-flex align-items-center gap-1.5 flex-shrink-0"
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
                <span
                  className="badge badge-gold px-2 px-sm-2.5 py-1 rounded-pill text-xs d-inline-flex align-items-center gap-1 shadow-sm text-truncate"
                  style={{ maxWidth: 'clamp(130px, 36vw, 260px)' }}
                  title={tournament.tournament_name}
                >
                  <span className="text-truncate">{tournament.tournament_name}</span>
                </span>
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
                <span className="text-truncate" style={{ maxWidth: 110 }}>
                  {team.code || team.name}
                </span>
              </span>
            ) : isAdmin ? (
              <span className="badge bg-warning text-dark px-2 py-0.5 rounded-pill text-xs fw-extrabold shadow-sm flex-shrink-0">
                👑 ADMIN
              </span>
            ) : null}
          </div>

          {/* DESKTOP NAVIGATION TABS (HIDDEN ON MOBILE) */}
          <nav className="d-none d-md-flex align-items-center gap-1.5 ms-auto">
            {tournament && isAdmin && (
              <Link
                href={`/auction?sport=${tournament.sport_id}`}
                className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-1 text-xs fw-bold me-1 d-inline-flex align-items-center gap-1"
                title="Change tournament"
              >
                <span>⇄</span>
                <span>Switch Tournament</span>
              </Link>
            )}

            {visibleLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`btn btn-sm rounded-pill px-2.5 px-md-3 py-1 fw-semibold transition-all ${
                    isActive
                      ? 'btn-primary text-white shadow-sm'
                      : 'btn-outline-secondary border-0 text-light opacity-75 hover-opacity-100'
                  }`}
                  style={{ fontSize: '0.82rem' }}
                >
                  {link.label}
                </Link>
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

          {/* MOBILE TOP CONTROLS (HAMBURGER / QUICK DRAWER TRIGGER) */}
          <div className="d-flex d-md-none align-items-center gap-1.5 ms-auto">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-extrabold d-inline-flex align-items-center gap-1 transition-all ${
                showDrawer
                  ? 'btn-warning text-dark shadow-sm'
                  : 'btn-outline-secondary border-opacity-40 text-light'
              }`}
              onClick={() => setShowDrawer(!showDrawer)}
              aria-label="Open mobile navigation drawer"
            >
              <span>{showDrawer ? '✕' : '☰'}</span>
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED AT SCREEN BOTTOM) */}
      <nav
        className="d-md-none fixed-bottom shadow-2xl"
        style={{
          background: 'rgba(6, 12, 28, 0.97)',
          backdropFilter: 'blur(18px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          zIndex: 1045,
          padding: '4px 6px calc(env(safe-area-inset-bottom, 0px) + 4px)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.65)',
        }}
        aria-label="Mobile bottom quick navigation"
      >
        <div className="d-flex align-items-center justify-content-around">
          {mobileQuickLinks.map((item) => {
            const isActive = pathname === item.href;
            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center justify-content-center flex-fill border-0 ${
                    showDrawer ? 'text-warning fw-extrabold' : 'text-white-50 hover-text-white'
                  }`}
                  style={{ minWidth: 54, fontSize: '0.67rem' }}
                  onClick={() => setShowDrawer(!showDrawer)}
                >
                  <span className="fs-5 lh-1 mb-1">{showDrawer ? '✕' : item.icon}</span>
                  <span className="text-truncate">{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-decoration-none p-1 d-flex flex-column align-items-center justify-content-center flex-fill position-relative ${
                  isActive ? 'text-info fw-black' : 'text-white-50 hover-text-white'
                }`}
                style={{ minWidth: 54, fontSize: '0.67rem', transition: 'all 0.15s ease' }}
                onClick={() => setShowDrawer(false)}
              >
                {isActive && (
                  <span
                    className="position-absolute top-0 start-50 translate-middle-x rounded-pill bg-info shadow"
                    style={{ width: 22, height: 3, marginTop: -4 }}
                  />
                )}
                <span className="fs-5 lh-1 mb-1">{item.icon}</span>
                <span className="text-truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* MOBILE QUICK NAVIGATION DRAWER / SHEET */}
      {showDrawer && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: 'rgba(2, 6, 16, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1060,
          }}
          onClick={() => setShowDrawer(false)}
        >
          <div
            className="position-absolute bottom-0 start-0 w-100 auction-card border-top border-secondary border-opacity-30 rounded-top-4 p-3.5 shadow-2xl"
            style={{
              maxHeight: '84vh',
              overflowY: 'auto',
              background: 'radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.16) 0%, rgba(8, 16, 34, 0.99) 100%)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-secondary border-opacity-25">
              <div>
                <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs fw-extrabold text-uppercase">
                  QUICK NAVIGATION
                </span>
                <h5 className="fs-6 fw-extrabold text-white mb-0 mt-1">
                  {tournament ? tournament.tournament_name : 'Olympic Vision Live Auction'}
                </h5>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-white rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32 }}
                onClick={() => setShowDrawer(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Links Grid */}
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
                      className={`btn w-100 text-start p-2.5 rounded-3 d-flex align-items-center gap-2 text-xs fw-bold transition-all ${
                        isActive
                          ? 'btn-info text-dark shadow-sm'
                          : 'btn-dark border border-secondary border-opacity-25 text-white hover-border-info'
                      }`}
                      onClick={() => setShowDrawer(false)}
                    >
                      <span className="fs-5 lh-1">{icon}</span>
                      <span className="text-truncate">{text}</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Admin Switch Tournament Button */}
            {tournament && isAdmin && (
              <div className="mb-3">
                <Link
                  href={`/auction?sport=${tournament.sport_id}`}
                  className="btn btn-sm btn-outline-info w-100 rounded-pill py-2 text-xs fw-bold d-flex align-items-center justify-content-center gap-1.5"
                  onClick={() => setShowDrawer(false)}
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
        </div>
      )}
    </>
  );
}
