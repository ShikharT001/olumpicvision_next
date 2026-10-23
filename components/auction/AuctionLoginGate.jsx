'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { authenticateAuction } from '@/app/auction/actions';

export default function AuctionLoginGate({
  tournament = null,
  tournamentTeams = [],
  allTournaments = [],
  errorMessage = '',
  returnTo = '/auction',
  initialRole = 'team',
}) {
  const [loginMode, setLoginMode] = useState(initialRole || 'team'); // 'team' | 'admin'
  const defaultTourn = tournament || (allTournaments.length === 1 ? allTournaments[0] : null);
  const [selectedTournamentId, setSelectedTournamentId] = useState(defaultTourn?.id || '');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Active tournament object
  const activeTournament = useMemo(() => {
    if (tournament) return tournament;
    if (selectedTournamentId && allTournaments.length > 0) {
      return allTournaments.find((t) => String(t.id) === String(selectedTournamentId)) || null;
    }
    if (defaultTourn) return defaultTourn;
    if (allTournaments.length === 1) return allTournaments[0];
    return null;
  }, [tournament, selectedTournamentId, allTournaments, defaultTourn]);

  // Active registered teams list strictly for the selected tournament
  const activeTeams = useMemo(() => {
    if (tournamentTeams && tournamentTeams.length > 0 && (!selectedTournamentId || String(tournament?.id) === String(selectedTournamentId))) {
      return tournamentTeams;
    }
    if (activeTournament?.teams && activeTournament.teams.length > 0) {
      return activeTournament.teams;
    }
    return [];
  }, [tournamentTeams, tournament, activeTournament, selectedTournamentId]);

  // Currently selected team object
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId || activeTeams.length === 0) return null;
    return activeTeams.find((t) => String(t.id) === String(selectedTeamId)) || null;
  }, [selectedTeamId, activeTeams]);

  // Human-readable error message translation
  const friendlyError = useMemo(() => {
    if (!errorMessage) return '';
    if (errorMessage.includes('not_registered_team')) {
      return 'Access Denied: This team is not registered by the admin for this tournament. Only officially registered teams can log in.';
    }
    if (errorMessage.includes('team_from_other_tournament')) {
      return `Access Denied: This team belongs to another tournament. Only teams officially registered by the admin for this championship are authorized.`;
    }
    if (errorMessage.includes('invalid_team_passcode')) {
      return `Access Denied: Incorrect passcode for ${selectedTeam?.team_name || 'the selected team'}. Please verify and try again.`;
    }
    if (errorMessage.includes('select_registered_team')) {
      return 'Please choose your registered team from the list below before entering your passcode.';
    }
    if (errorMessage.includes('invalid_team_credentials')) {
      return 'Access Denied: Only teams registered by the admin for an active tournament are authorized.';
    }
    return errorMessage;
  }, [errorMessage, selectedTeam]);

  // Quick select team handler (confidential — no auto-filling passwords)
  const handleSelectTeam = (team) => {
    setSelectedTeamId(team.id);
    if (team.tournament_id) {
      setSelectedTournamentId(team.tournament_id);
    }
  };

  return (
    <div
      className="auction-shell min-vh-100 d-flex flex-column align-items-center justify-content-center p-3"
      data-bs-theme="dark"
    >
      <div
        className="auction-card p-4 p-md-5 text-center shadow-2xl position-relative overflow-hidden"
        style={{
          maxWidth: 540,
          width: '100%',
          borderColor: loginMode === 'team' ? 'rgba(6, 182, 212, 0.45)' : 'rgba(245, 158, 11, 0.45)',
          background:
            loginMode === 'team'
              ? 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.12) 0%, rgba(11, 18, 33, 0.98) 100%)'
              : 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.12) 0%, rgba(11, 18, 33, 0.98) 100%)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Glow Header Icon */}
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow"
          style={{
            width: 72,
            height: 72,
            backgroundColor: loginMode === 'team' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `2px solid ${loginMode === 'team' ? '#06b6d4' : '#f59e0b'}`,
            boxShadow:
              loginMode === 'team'
                ? '0 0 25px rgba(6, 182, 212, 0.35)'
                : '0 0 25px rgba(245, 158, 11, 0.35)',
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
            {loginMode === 'team' ? '🛡️ REGISTERED FRANCHISE TEAMS ONLY' : '👑 MAIN ADMIN / ORGANIZER'}
          </span>
          <h2 className="fs-4 fw-black text-white mt-2 mb-1 tracking-tight">
            {loginMode === 'team' ? 'Registered Team Sign-In' : 'Main Admin Auction Console'}
          </h2>

          <p className="text-white-50 text-xs mt-2 mb-0 leading-relaxed px-sm-2">
            {loginMode === 'team'
              ? defaultTourn
                ? `Sign in for ${defaultTourn.tournament_name}`
                : 'Choose your registered team and enter confidential passcode.'
              : 'Sign in to access the master multi-sport auction console.'}
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
            <span>Registered Team Login</span>
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
        {friendlyError && (
          <div
            className="alert alert-danger border-0 py-2.5 px-3 small text-start mb-3 shadow-sm d-flex align-items-start gap-2"
            role="alert"
          >
            <span className="fs-5 lh-1">⚠️</span>
            <div className="flex-grow-1">
              <strong>Access Denied:</strong> {friendlyError}
            </div>
          </div>
        )}

        {/* AUTHENTICATION FORM */}
        <form action={authenticateAuction} className="vstack gap-3 text-start">
          <input
            type="hidden"
            name="returnTo"
            value={
              returnTo ||
              (activeTournament?.id
                ? `/auction/t/${activeTournament.id}/teams`
                : '/auction')
            }
          />
          <input type="hidden" name="loginMode" value={loginMode} />

          {/* Tournament ID hidden field */}
          <input
            type="hidden"
            name="tournamentId"
            value={defaultTourn?.id || selectedTournamentId || ''}
          />

          {loginMode === 'team' && (
            <>
              {/* 1. TOURNAMENT SELECTOR (COMES FIRST) */}
              <div>
                <label className="form-label text-white-50 text-xs mb-1.5 fw-semibold d-flex align-items-center justify-content-between">
                  <span>1. Championship Tournament</span>
                  <span className="badge badge-gold text-xs">Official</span>
                </label>

                {defaultTourn ? (
                  <div className="p-2.5 rounded-3 bg-dark border border-secondary border-opacity-40 text-xs fw-bold text-white d-flex align-items-center justify-content-between shadow-sm">
                    <span className="text-truncate">{defaultTourn.tournament_name}</span>
                    <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs">Volleyball</span>
                  </div>
                ) : (
                  <select
                    name="tournamentId"
                    className="form-select bg-dark text-white border-warning border-opacity-40 text-xs py-2.5 fw-semibold"
                    value={selectedTournamentId}
                    onChange={(e) => {
                      const newTId = e.target.value;
                      setSelectedTournamentId(newTId);
                      setSelectedTeamId('');
                      setPassword('');
                    }}
                    required
                  >
                    <option value="">-- Choose Tournament First --</option>
                    {allTournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tournament_name} {t.season_year ? `(${t.season_year})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 2. ACTIVE REGISTERED TEAMS (COMES SECOND) */}
              <div>
                <label className="form-label text-white-50 text-xs mb-1.5 fw-semibold d-flex align-items-center justify-content-between">
                  <span>2. Active Registered Team</span>
                  <span className="badge badge-cyan text-xs">Step 2</span>
                </label>

                {!selectedTournamentId && !defaultTourn ? (
                  <div className="p-2.5 rounded-3 bg-black bg-opacity-30 border border-secondary border-opacity-20 text-white-50 text-xs text-center">
                    👆 Please choose a tournament above first to load registered teams
                  </div>
                ) : activeTeams.length > 0 ? (
                  <>
                    <select
                      name="teamId"
                      className="form-select bg-dark text-white border-info border-opacity-40 text-xs py-2.5 fw-semibold"
                      value={selectedTeamId}
                      onChange={(e) => {
                        const tId = e.target.value;
                        setSelectedTeamId(tId);
                      }}
                      required
                    >
                      <option value="">-- Choose Your Registered Team --</option>
                      {activeTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.team_code} — {t.team_name} {t.owner_name ? `(${t.owner_name})` : ''}
                        </option>
                      ))}
                    </select>

                    <input type="hidden" name="teamName" value={selectedTeam?.team_name || ''} />
                    <input type="hidden" name="teamCode" value={selectedTeam?.team_code || ''} />
                    <input type="hidden" name="teamColor" value={selectedTeam?.primary_color || ''} />

                    {/* Selected Team Card Badge */}
                    {selectedTeam && (
                      <div
                        className="mt-2 p-2.5 rounded-3 d-flex align-items-center justify-content-between shadow-sm border"
                        style={{
                          backgroundColor: 'rgba(6, 182, 212, 0.08)',
                          borderColor: selectedTeam.primary_color || '#06b6d4',
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="rounded-circle d-inline-block shadow"
                            style={{
                              width: 14,
                              height: 14,
                              backgroundColor: selectedTeam.primary_color || '#06b6d4',
                            }}
                          />
                          <div>
                            <div className="fw-black text-white text-xs">{selectedTeam.team_name}</div>
                            <div className="text-white-50 text-xs">
                              Code: <strong>{selectedTeam.team_code}</strong>
                              {selectedTeam.owner_name && ` • Owner: ${selectedTeam.owner_name}`}
                            </div>
                          </div>
                        </div>
                        <span className="badge badge-cyan text-xs">Registered Team</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="alert alert-warning py-2 px-3 small mb-0">
                    No teams are registered by admin for this tournament yet. Please contact the administrator.
                  </div>
                )}
              </div>
            </>
          )}

          {/* 3. PASSCODE PIN INPUT (COMES THIRD) */}
          <div>
            <label
              className="form-label text-white-50 text-xs mb-1.5 fw-semibold d-flex align-items-center justify-content-between"
              htmlFor="auction-password"
            >
              <span>
                {loginMode === 'team'
                  ? '3. Team Access Passcode PIN'
                  : 'Main Admin Passcode PIN'}
              </span>
              <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs">
                {loginMode === 'team' ? 'Step 3' : 'Confidential'}
              </span>
            </label>

            <div className="input-group">
              <input
                id="auction-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={
                  loginMode === 'team'
                    ? selectedTeam
                      ? `Enter passcode for ${selectedTeam.team_name}`
                      : 'Enter team access passcode'
                    : 'Enter admin passcode'
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

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className={`btn rounded-pill py-2.5 fw-extrabold text-sm w-100 shadow mt-1 transition-all ${
              loginMode === 'team' ? 'btn-info text-dark' : 'btn-warning text-dark'
            }`}
          >
            {loginMode === 'team'
              ? '🛡️ Unlock Registered Team Auction Screens →'
              : '👑 Unlock Admin Portal →'}
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
