'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
        <div className="d-flex align-items-center gap-3">
          <Link href="/" className="btn btn-sm btn-outline-light rounded-pill px-2.5 py-1 text-xs text-white-50 d-inline-flex align-items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
            </svg>
            <span>Olympic Vision</span>
          </Link>
          <div className="vr bg-secondary opacity-50 my-1 d-none d-sm-block"></div>
          <Link href="/auction" className="text-decoration-none d-flex align-items-center gap-2">
            <span className="badge badge-gold px-2 py-1 rounded-pill text-xs">PDVL 2026/27</span>
            <span className="fw-bold fs-6 text-white tracking-tight">LIVE AUCTION HUB</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="d-flex flex-wrap align-items-center gap-1.5">
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
        </nav>
      </div>
    </header>
  );
}
