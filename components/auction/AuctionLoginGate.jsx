'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authenticateAuction } from '@/app/auction/actions';

export default function AuctionLoginGate({
  errorMessage,
  returnTo = '/auction',
  initialRole = 'team',
}) {
  const [loginMode, setLoginMode] = useState(initialRole || 'team'); // 'team' | 'admin'
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="auction-shell min-vh-100 d-flex flex-column align-items-center justify-content-center p-3"
      data-bs-theme="dark"
    >
      <div
        className="auction-card p-4 p-md-5 text-center shadow-2xl position-relative overflow-hidden"
        style={{
          maxWidth: 480,
          width: '100%',
          borderColor: loginMode === 'team' ? 'rgba(6, 182, 212, 0.35)' : 'rgba(245, 158, 11, 0.35)',
          background:
            loginMode === 'team'
              ? 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.08) 0%, rgba(11, 18, 33, 0.98) 100%)'
              : 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.08) 0%, rgba(11, 18, 33, 0.98) 100%)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Glow Header Icon */}
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow"
          style={{
            width: 70,
            height: 70,
            backgroundColor: loginMode === 'team' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `2px solid ${loginMode === 'team' ? '#06b6d4' : '#f59e0b'}`,
            boxShadow:
              loginMode === 'team'
                ? '0 0 20px rgba(6, 182, 212, 0.25)'
                : '0 0 20px rgba(245, 158, 11, 0.25)',
          }}
        >
          <span className="fs-2">{loginMode === 'team' ? '🛡️' : '👑'}</span>
        </div>

        {/* Portal Badges & Title */}
        <div className="mb-3">
          <span
            className={`badge px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase ${
              loginMode === 'team' ? 'badge-cyan' : 'badge-gold'
            }`}
          >
            {loginMode === 'team' ? '🛡️ FRANCHISE TEAM PORTAL' : '👑 MAIN ADMIN / ORGANIZER'}
          </span>
          <h2 className="fs-4 fw-black text-white mt-2 mb-1 tracking-tight">
            {loginMode === 'team' ? 'Team & Franchise Sign-In' : 'Main Admin Auction Console'}
          </h2>
          <p className="text-white-50 text-xs mb-0 leading-relaxed px-sm-2">
            {loginMode === 'team'
              ? 'Live view-only access to monitor remaining purse, inspect squads, top bids, and live podium outcomes.'
              : 'Master administrator credentials to conduct gavel calls, configure tournaments, and register players.'}
          </p>
        </div>

        {/* DUAL LOGIN MODE TABS */}
        <div className="d-flex rounded-pill p-1 bg-dark bg-opacity-70 border border-secondary border-opacity-25 mb-4 shadow-sm">
          <button
            type="button"
            className={`btn btn-sm rounded-pill flex-fill py-2 text-xs fw-extrabold transition-all d-flex align-items-center justify-content-center gap-1.5 ${
              loginMode === 'team'
                ? 'btn-info text-dark shadow-sm'
                : 'text-white-50 hover-text-white'
            }`}
            onClick={() => {
              setLoginMode('team');
              setPassword('');
            }}
          >
            <span>🛡️</span>
            <span>Team Login (View-Only)</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill flex-fill py-2 text-xs fw-extrabold transition-all d-flex align-items-center justify-content-center gap-1.5 ${
              loginMode === 'admin'
                ? 'badge-gold text-dark shadow-sm'
                : 'text-white-50 hover-text-white'
            }`}
            onClick={() => {
              setLoginMode('admin');
              setPassword('');
            }}
          >
            <span>👑</span>
            <span>Admin Login</span>
          </button>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="alert alert-danger border-0 py-2.5 px-3 small text-start mb-3 shadow-sm d-flex align-items-center gap-2" role="alert">
            <span className="fs-5">⚠️</span>
            <div>
              <strong>Access Denied:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* AUTHENTICATION FORM (NO DROPDOWN - DIRECT SECURE PASSCODE) */}
        <form action={authenticateAuction} className="vstack gap-3 text-start">
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="loginMode" value={loginMode} />

          {/* PASSCODE PIN INPUT */}
          <div>
            <label
              className="form-label text-white-50 text-xs mb-1.5 fw-semibold d-flex align-items-center justify-content-between"
              htmlFor="auction-password"
            >
              <span>{loginMode === 'team' ? 'Team Access Passcode PIN' : 'Main Admin Passcode PIN'}</span>
              <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs">Confidential</span>
            </label>

            <div className="input-group">
              <input
                id="auction-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={
                  loginMode === 'team'
                    ? 'Enter team passcode (default: team)'
                    : 'Enter admin passcode (default: admin)'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control bg-dark text-white border-secondary border-opacity-50 text-xs py-2.5"
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary border-opacity-50 px-3 text-xs"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* QUICK FILL DEMO CHIPS */}
          <div className="d-flex flex-wrap align-items-center gap-1.5">
            <span className="text-white-50 text-xs me-1">Demo PINs:</span>
            {loginMode === 'team' ? (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-0.5 text-xs fw-bold"
                  onClick={() => setPassword('team')}
                >
                  ⚡ 'team'
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-0.5 text-xs fw-bold"
                  onClick={() => setPassword('pdvl2026')}
                >
                  ⚡ 'pdvl2026'
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning rounded-pill px-2.5 py-0.5 text-xs fw-bold"
                  onClick={() => setPassword('admin')}
                >
                  ⚡ 'admin'
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning rounded-pill px-2.5 py-0.5 text-xs fw-bold"
                  onClick={() => setPassword('pdvladmin2026')}
                >
                  ⚡ 'pdvladmin2026'
                </button>
              </>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className={`btn rounded-pill py-2.5 fw-extrabold text-sm w-100 shadow mt-1 transition-all ${
              loginMode === 'team'
                ? 'btn-info text-dark'
                : 'btn-warning text-dark'
            }`}
          >
            {loginMode === 'team' ? '🛡️ Unlock Franchise Portal →' : '👑 Unlock Admin Portal →'}
          </button>
        </form>

        {/* FOOTER SWITCHER LINK */}
        <div className="mt-4 pt-3 border-top border-secondary border-opacity-20 text-center text-white-50 text-xs">
          <span>Need different privileges? </span>
          <button
            type="button"
            className="btn btn-link p-0 text-info text-xs fw-bold text-decoration-none ms-1"
            onClick={() => {
              setLoginMode(loginMode === 'team' ? 'admin' : 'team');
              setPassword('');
            }}
          >
            Switch to {loginMode === 'team' ? 'Admin Login' : 'Team Login'} ⇄
          </button>
        </div>
      </div>
    </div>
  );
}
