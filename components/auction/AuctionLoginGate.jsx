'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authenticateAuction } from '@/app/auction/actions';

// Fallback default teams if API is not yet loaded
const DEFAULT_TEAMS = [
  { id: 'team-vb-1', team_name: 'Palghar Smashers', team_code: 'PSM', primary_color: '#f59e0b', owner_name: 'Sunil Patil' },
  { id: 'team-vb-2', team_name: 'Boisar Blasters', team_code: 'BBL', primary_color: '#06b6d4', owner_name: 'Mahesh Tare' },
  { id: 'team-vb-3', team_name: 'Dahanu Spikers', team_code: 'DSP', primary_color: '#10b981', owner_name: 'Ketan Vaze' },
  { id: 'team-vb-4', team_name: 'Manor Aces', team_code: 'MAC', primary_color: '#8b5cf6', owner_name: 'Sachin Jadhav' },
  { id: 'team-vb-5', team_name: 'Tarapur Warriors', team_code: 'TWR', primary_color: '#ef4444', owner_name: 'Vikram Thakur' },
  { id: 'team-vb-6', team_name: 'Virar Kings', team_code: 'VKG', primary_color: '#ec4899', owner_name: 'Anand Mishra' },
];

export default function AuctionLoginGate({
  errorMessage,
  returnTo = '/auction',
  initialRole = 'team',
  initialTeams = null,
}) {
  const [loginMode, setLoginMode] = useState(initialRole || 'team'); // 'team' | 'admin'
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [teams, setTeams] = useState(initialTeams || DEFAULT_TEAMS);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Fetch live tournament teams to populate franchise dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadTeams() {
      try {
        setLoadingTeams(true);
        const res = await fetch('/api/auction/teams');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.teams && json.teams.length > 0) {
            setTeams(json.teams);
          }
        }
      } catch {
        // Fallback to initial teams
      } finally {
        if (isMounted) setLoadingTeams(false);
      }
    }
    loadTeams();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || null;

  return (
    <div
      className="auction-shell min-vh-100 d-flex flex-column align-items-center justify-content-center p-3"
      data-bs-theme="dark"
    >
      <div
        className="auction-card p-4 p-sm-5 text-center shadow-2xl position-relative overflow-hidden"
        style={{
          maxWidth: 520,
          width: '100%',
          borderColor: loginMode === 'team' ? 'rgba(6, 182, 212, 0.45)' : 'rgba(245, 158, 11, 0.45)',
          background:
            loginMode === 'team'
              ? 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.12) 0%, rgba(10, 20, 40, 0.96) 100%)'
              : 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.12) 0%, rgba(10, 20, 40, 0.96) 100%)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Glow Header Icon */}
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-lg"
          style={{
            width: 76,
            height: 76,
            backgroundColor: loginMode === 'team' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `2px solid ${loginMode === 'team' ? '#06b6d4' : '#f59e0b'}`,
            boxShadow:
              loginMode === 'team'
                ? '0 0 24px rgba(6, 182, 212, 0.35)'
                : '0 0 24px rgba(245, 158, 11, 0.35)',
          }}
        >
          <span className="fs-1">{loginMode === 'team' ? '🛡️' : '👑'}</span>
        </div>

        {/* Portal Badges & Title */}
        <div className="mb-3">
          <span
            className={`badge px-3 py-1 rounded-pill text-xs fw-black text-uppercase ${
              loginMode === 'team' ? 'badge-cyan' : 'badge-gold'
            }`}
          >
            {loginMode === 'team' ? '🛡️ FRANCHISE TEAM PORTAL' : '👑 MAIN ADMIN / ORGANIZER'}
          </span>
          <h2 className="fs-3 fw-black text-white mt-2 mb-1 tracking-tight">
            {loginMode === 'team' ? 'Team & Franchise Sign-In' : 'Main Admin Auction Console'}
          </h2>
          <p className="text-white-50 text-xs mb-0 leading-relaxed px-sm-2">
            {loginMode === 'team'
              ? 'Authorized portal for Team Owners, Coaches & Franchise Representatives with live view-only access to monitor remaining purse, inspect squads, and track podium bidding.'
              : 'Master auctioneer credentials unlock full gavel controls, sport creation, tournament setup, and player management.'}
          </p>
        </div>

        {/* DUAL LOGIN MODE TABS */}
        <div className="d-flex rounded-pill p-1 bg-dark bg-opacity-80 border border-secondary border-opacity-35 mb-4 shadow-sm">
          <button
            type="button"
            className={`btn btn-sm rounded-pill flex-fill py-2 text-xs fw-extrabold transition-all d-flex align-items-center justify-content-center gap-2 ${
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
            <span>Team Login</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill flex-fill py-2 text-xs fw-extrabold transition-all d-flex align-items-center justify-content-center gap-2 ${
              loginMode === 'admin'
                ? 'badge-gold text-dark shadow-sm'
                : 'text-white-50 hover-text-white'
            }`}
            onClick={() => {
              setLoginMode('admin');
              setPassword('');
              setSelectedTeamId('');
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

        {/* AUTHENTICATION FORM */}
        <form action={authenticateAuction} className="vstack gap-3 text-start">
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="loginMode" value={loginMode} />

          {/* Hidden metadata for team login */}
          {loginMode === 'team' && selectedTeam && (
            <>
              <input type="hidden" name="teamId" value={selectedTeam.id} />
              <input type="hidden" name="teamName" value={selectedTeam.team_name} />
              <input type="hidden" name="teamCode" value={selectedTeam.team_code} />
              <input type="hidden" name="teamColor" value={selectedTeam.primary_color || '#0d6efd'} />
            </>
          )}

          {/* TEAM MODE STEP 1: SELECT FRANCHISE */}
          {loginMode === 'team' && (
            <div>
              <label
                className="form-label text-white-50 text-xs mb-1.5 fw-semibold d-flex align-items-center justify-content-between"
                htmlFor="team-select"
              >
                <span>Select Your Competing Franchise:</span>
                <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs">
                  {teams.length} Teams
                </span>
              </label>

              <select
                id="team-select"
                className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-40 py-2 text-xs"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="">-- General Team Access (All Teams Overview) --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.team_code} — {t.team_name} {t.owner_name ? `(${t.owner_name})` : ''}
                  </option>
                ))}
              </select>

              {/* Selected Franchise Card Preview */}
              {selectedTeam && (
                <div
                  className="mt-2.5 p-2.5 rounded-3 bg-black bg-opacity-40 border d-flex align-items-center gap-2.5"
                  style={{ borderColor: selectedTeam.primary_color || '#06b6d4' }}
                >
                  <span
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black flex-shrink-0"
                    style={{
                      width: 38,
                      height: 38,
                      backgroundColor: selectedTeam.primary_color || '#06b6d4',
                      fontSize: '0.85rem',
                    }}
                  >
                    {selectedTeam.team_code}
                  </span>
                  <div className="text-truncate">
                    <strong className="text-white text-xs d-block text-truncate">
                      {selectedTeam.team_name}
                    </strong>
                    <span className="text-white-50 text-xs d-block text-truncate">
                      Franchise Owner: {selectedTeam.owner_name || 'Management'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* QUICK DEMO FILL CHIPS */}
          <div className="d-flex flex-wrap align-items-center gap-1.5">
            <span className="text-white-50 text-xs me-1">Demo Quick-Fill:</span>
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
            className={`btn rounded-pill py-2.5 fw-extrabold text-sm w-100 shadow-lg mt-1 transition-all ${
              loginMode === 'team'
                ? 'btn-info text-dark hover-shadow-cyan'
                : 'btn-warning text-dark hover-shadow-gold'
            }`}
          >
            {loginMode === 'team' ? '🛡️ Unlock Franchise Portal →' : '👑 Unlock Admin Portal →'}
          </button>
        </form>

        {/* FOOTER SWITCHER LINK */}
        <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 text-center text-white-50 text-xs">
          <span>Need different privileges? </span>
          <button
            type="button"
            className="btn btn-link p-0 text-info text-xs fw-bold text-decoration-none"
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
