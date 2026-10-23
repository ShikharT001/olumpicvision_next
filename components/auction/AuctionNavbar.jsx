'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAuction } from '@/app/auction/actions';

export default function AuctionNavbar({ role = 'team', tournament = null, team = null }) {
  const pathname = usePathname();
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
          // FOR REGISTERED TEAM LOGINS: Squad & Stage only
          ...(team?.id
            ? [{ href: `${basePath}/teams?teamId=${team.id}`, label: `⭐ My Squad (${team.code || 'Team'})` }]
            : []),
          { href: `${basePath}/teams`, label: '🛡️ Squads & Purse' },
          { href: `${basePath}/live`, label: '📺 Big-Screen Stage' },
        ]
    : [];

  const visibleLinks = tournamentLinks;

  return (
    <header className="border-bottom sticky-top" style={{ borderColor: 'var(--auction-border)', background: 'rgba(8, 16, 34, 0.94)', backdropFilter: 'blur(12px)', zIndex: 1040 }}>
      <div className="container-fluid px-3 px-md-4 py-2 d-flex flex-wrap align-items-center justify-content-between gap-2.5">
        {/* Brand & Breadcrumbs */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Link
            href={isTeam && tournamentId ? `${basePath}/teams` : '/auction'}
            className="text-decoration-none d-flex align-items-center gap-1.5 me-1"
          >
            <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-30 px-2 py-0.5 rounded-pill text-xs fw-bold">
              🏆 OV AUCTION
            </span>
            <span className="fw-extrabold text-white tracking-tight d-none d-sm-inline" style={{ fontSize: '0.95rem' }}>
              {isTeam ? 'FRANCHISE PORTAL' : 'MULTI-SPORT HUB'}
            </span>
          </Link>

          {tournament && (
            <>
              {isAdmin && (
                <>
                  <span className="text-secondary opacity-50 small">/</span>
                  <Link
                    href={`/auction?sport=${tournament.sport_id}`}
                    className="badge rounded-pill text-xs text-decoration-none d-inline-flex align-items-center gap-1 px-2.5 py-1 text-white border border-secondary border-opacity-30 bg-dark hover-opacity-100"
                    title={`Back to all ${tournament.sport_name} tournaments`}
                  >
                    <span>{tournament.sportConfig?.icon || '🏅'}</span>
                    <span>{tournament.sport_name}</span>
                  </Link>
                </>
              )}

              <span className="text-secondary opacity-50 small">/</span>
              <span
                className="badge badge-gold px-2.5 py-1 rounded-pill text-xs d-inline-flex align-items-center gap-1 shadow-sm text-truncate"
                style={{ maxWidth: 240 }}
                title={tournament.tournament_name}
              >
                <span className="text-truncate">{tournament.tournament_name}</span>
              </span>
            </>
          )}

          {team ? (
            <span
              className="badge px-2.5 py-1 rounded-pill text-xs fw-extrabold shadow-sm ms-1 d-inline-flex align-items-center gap-1.5"
              style={{
                backgroundColor: team.color || '#06b6d4',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
              title={`Logged in as ${team.name || team.code}`}
            >
              <span>🛡️</span>
              <span className="text-truncate" style={{ maxWidth: 170 }}>
                {team.name || team.code}
              </span>
            </span>
          ) : isAdmin ? (
            <span className="badge bg-warning text-dark px-2 py-0.5 rounded-pill text-xs fw-extrabold shadow-sm ms-1">
              👑 MAIN ADMIN
            </span>
          ) : (
            <span className="badge bg-info text-dark px-2 py-0.5 rounded-pill text-xs fw-bold shadow-sm ms-1">
              🛡️ TEAM FRANCHISE
            </span>
          )}
        </div>

        {/* Navigation Tabs & Actions */}
        <nav className="d-flex flex-wrap align-items-center gap-1.5 ms-auto">
          {/* Switch Tournament button ONLY visible to Admin */}
          {tournament && isAdmin && (
            <Link
              href={`/auction?sport=${tournament.sport_id}`}
              className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-1 text-xs fw-bold me-1 d-inline-flex align-items-center gap-1"
              title="Change tournament or explore other simultaneous championships"
            >
              <span>⇄</span>
              <span className="d-none d-md-inline">Switch Tournament</span>
            </Link>
          )}

          {!tournament && isAdmin && (
            <Link
              href="/auction"
              className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-1 text-xs fw-bold me-1 d-inline-flex align-items-center gap-1"
            >
              <span>🎮</span>
              <span>All Sports</span>
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
      </div>
    </header>
  );
}
