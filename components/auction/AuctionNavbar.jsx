'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAuction } from '@/app/auction/actions';

export default function AuctionNavbar({ role = 'team', tournament = null, team = null }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    : [
        { href: '/auction', label: '🏆 Championships' },
        { href: '/auction/teams', label: '🛡️ Squads & Purse' },
      ];

  const visibleLinks = tournamentLinks;

  return (
    <header
      className="border-bottom sticky-top"
      style={{
        borderColor: 'var(--auction-border)',
        background: 'rgba(9, 14, 26, 0.94)',
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
                style={{ maxWidth: 'clamp(120px, 34vw, 240px)' }}
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

        {/* MOBILE TOGGLER BUTTON (HAMBURGER TRIGGER ON MOBILE) */}
        <div className="d-flex d-md-none align-items-center gap-1.5 ms-auto">
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

      {/* MOBILE COLLAPSIBLE DROPDOWN NAV (EXPANDS DIRECTLY BELOW HEADER) */}
      {mobileMenuOpen && (
        <div
          className="d-md-none border-top border-secondary border-opacity-25 p-3"
          style={{
            background: 'linear-gradient(180deg, rgba(9, 14, 26, 0.98) 0%, rgba(5, 8, 18, 0.99) 100%)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.75)',
            maxHeight: '75vh',
            overflowY: 'auto',
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2.5 pb-2 border-bottom border-secondary border-opacity-20">
            <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs fw-bold text-uppercase">
              QUICK NAVIGATION
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
                    className={`btn w-100 text-start p-2.5 rounded-3 d-flex align-items-center gap-2 text-xs fw-bold transition-all ${
                      isActive
                        ? 'btn-info text-dark shadow-sm'
                        : 'auction-sub-card text-white hover-border-info'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="fs-5 lh-1 flex-shrink-0">{icon}</span>
                    <span className="text-truncate">{text}</span>
                  </Link>
                </div>
              );
            })}
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
  );
}
