'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAuction } from '@/app/auction/actions';

export default function AuctionNavbar() {
  const pathname = usePathname();

  const links = [
    { href: '/auction/admin', label: '🔨 Auctioneer Console' },
    { href: '/auction/live', label: '📺 Big-Screen Live' },
    { href: '/auction/teams', label: '🛡️ Team Squads & Purse' },
    { href: '/auction/players', label: '📋 Player Pool' },
    { href: '/auction/manage-teams', label: '⚙️ Teams Setup' },
  ];

  return (
    <header className="border-bottom" style={{ borderColor: 'var(--auction-border)', background: 'rgba(10, 18, 36, 0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="container-fluid px-3 px-md-4 py-2.5 d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Brand */}
        <div className="d-flex align-items-center gap-2.5">
          <Link href="/auction" className="text-decoration-none d-flex align-items-center gap-2">
            <span className="badge badge-gold px-2 py-1 rounded-pill text-xs">PDVL 2026/27</span>
            <span className="fw-bold fs-6 text-white tracking-tight">CONFIDENTIAL AUCTION PORTAL</span>
          </Link>
        </div>

        {/* Navigation Tabs & Lock Button */}
        <nav className="d-flex flex-wrap align-items-center gap-1.5 ms-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
                  isActive
                    ? 'btn-primary text-white shadow-sm'
                    : 'btn-outline-secondary border-0 text-light opacity-75 hover-opacity-100'
                }`}
                style={{ fontSize: '0.84rem' }}
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
              🔒 Lock Portal
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
