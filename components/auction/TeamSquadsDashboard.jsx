'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { normalizeCategory, formatCategoryLabel, getCategoryBadgeClass } from '@/lib/sports-config';
import TopBidsLeaderboard from './TopBidsLeaderboard';
import TeamsPoolingWheel from './TeamsPoolingWheel';

export default function TeamSquadsDashboard({
  initialTeams,
  tournament = null,
  tournamentId: propTournamentId,
  initialTab = 'squads',
  isAdmin = false,
  loggedTeam = null,
  initialTeamId = null,
}) {
  const activeTournamentId = propTournamentId || tournament?.id || tournament?.slug;
  const [teams, setTeams] = useState(initialTeams || []);
  const [selectedTeam, setSelectedTeam] = useState(initialTeamId || null);
  const [activeTab, setActiveTab] = useState(initialTab || 'squads');
  const [liveNotification, setLiveNotification] = useState(null);
  const [soldModalData, setSoldModalData] = useState(null);
  const [unsoldModalData, setUnsoldModalData] = useState(null);
  const lastNotifIdRef = useRef(null);

  // Sync tab if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchLiveStateAndTeams = useCallback(async () => {
    try {
      const url = activeTournamentId
        ? `/api/auction/state?tournamentId=${encodeURIComponent(activeTournamentId)}`
        : '/api/auction/state';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.teams) {
          setTeams(json.teams);
        }
        if (json.lastNotification && json.lastNotification.id !== lastNotifIdRef.current) {
          lastNotifIdRef.current = json.lastNotification.id;
          setLiveNotification(json.lastNotification);
          if (json.lastNotification.type === 'sold') {
            const foundTeam = (json.teams || []).find(
              (t) => t.team_name === json.lastNotification.teamName || t.id === json.lastNotification.teamId
            );
            setSoldModalData({
              ...json.lastNotification,
              photo_url: json.lastNotification.photo_url || json.lastNotification.photoUrl || '',
              teamColor: foundTeam?.primary_color || '#f59e0b',
              teamCode: foundTeam?.team_code || 'WIN',
            });
          } else if (json.lastNotification.type === 'unsold') {
            setUnsoldModalData(json.lastNotification);
          }
        }
      }
    } catch {
      // Ignore poll error
    }
  }, [activeTournamentId]);

  useEffect(() => {
    fetchLiveStateAndTeams();
    const timer = setInterval(fetchLiveStateAndTeams, 1500);
    return () => clearInterval(timer);
  }, [fetchLiveStateAndTeams]);

  // Aggregate league stats
  const totalPurse = teams.reduce((acc, t) => acc + Number(t.initial_purse || 0), 0);
  const remainingPurse = teams.reduce((acc, t) => acc + Number(t.remaining_purse || 0), 0);
  const totalSpent = Math.max(0, totalPurse - remainingPurse);
  const allSoldPlayers = teams.flatMap((t) => t.squad || []);
  const totalSlotsCapacity = teams.reduce((acc, t) => acc + (t.max_squad_size || 12), 0);
  const highestBuy = allSoldPlayers.reduce((max, p) => (Number(p.sold_price || 0) > Number(max?.sold_price || 0) ? p : max), null);

  // Active focused team
  const focusedTeam = selectedTeam ? teams.find((t) => t.id === selectedTeam) : null;

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      {/* TOURNAMENT CONTEXT & IDENTIFICATION STRIP */}
      {tournament && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-3 px-md-4 rounded-3 bg-dark bg-opacity-70 border border-secondary border-opacity-25 shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <span className="fs-2">{tournament.sportConfig?.icon || '🏆'}</span>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge badge-cyan px-2.5 py-0.5 rounded-pill text-xs fw-extrabold text-uppercase">
                  {tournament.sport_name || 'Multi-Sport'}
                </span>
                <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs rounded-pill">
                  {tournament.season_year || '2026/27'}
                </span>
                {tournament.venue && (
                  <span className="text-white-50 text-xs d-none d-md-inline">
                    📍 {tournament.venue}
                  </span>
                )}
              </div>
              <h2 className="fs-5 fw-extrabold text-white mb-0">
                {tournament.tournament_name}
              </h2>
            </div>
          </div>

          {isAdmin ? (
            <div className="d-flex align-items-center gap-2 ms-auto flex-wrap">
              <Link
                href={activeTournamentId ? `/auction/t/${activeTournamentId}/stream` : '/auction/stream'}
                className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 text-xs fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                title="Watch YouTube Live Stream with real-time auction details"
              >
                <span>🎥</span>
                <span>YouTube Live</span>
              </Link>
              <Link
                href="/auction"
                className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 text-xs fw-bold d-inline-flex align-items-center gap-1.5"
                title="View all active tournaments and games"
              >
                <span>⇄</span>
                <span>Switch Tournament</span>
              </Link>
            </div>
          ) : loggedTeam ? (
            <div className="d-flex align-items-center gap-2 ms-auto">
              <span
                className="badge px-3 py-1.5 rounded-pill text-xs fw-extrabold shadow-sm d-inline-flex align-items-center gap-1.5"
                style={{
                  backgroundColor: loggedTeam.color || '#06b6d4',
                  color: '#fff',
                }}
              >
                <span>🛡️</span>
                <span>{loggedTeam.name || loggedTeam.code}</span>
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Real-time SOLD / UNSOLD Live Notification Banner */}
      {liveNotification && (
        <div
          className={`auction-notify-banner mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-lg ${
            liveNotification.type === 'unsold' ? 'is-unsold' : ''
          }`}
        >
          <div className="d-flex align-items-center gap-3">
            <span
              className={`badge rounded-pill px-3 py-1.5 text-xs fw-extrabold text-uppercase ${
                liveNotification.type === 'sold'
                  ? 'badge-gold'
                  : liveNotification.type === 'unsold'
                  ? 'bg-danger text-white'
                  : 'badge-cyan'
              }`}
            >
              {liveNotification.type === 'sold'
                ? '📢 LATEST SALE'
                : liveNotification.type === 'unsold'
                ? '🛑 UNSOLD AT HAMMER'
                : '⚠️ LATEST OUTCOME'}
            </span>
            <div>
              <h4 className="fw-extrabold text-white mb-0 fs-6">
                {liveNotification.message}
              </h4>
              <span className="text-white-50 text-xs">
                Live Broadcast Feed • {new Date(liveNotification.timestamp || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 text-xs"
            onClick={() => setLiveNotification(null)}
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRIMARY SECTION TABS: SQUADS & PURSE | TOP 10 BIDS | POOL DRAW & WHEEL   */}
      {/* ========================================================================= */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div className="d-flex flex-wrap align-items-center gap-2 p-1.5 rounded-pill bg-dark bg-opacity-70 border border-secondary border-opacity-30">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5 transition-all ${
              activeTab === 'squads' ? 'btn-primary text-white shadow' : 'text-white-50 hover-text-white'
            }`}
            onClick={() => setActiveTab('squads')}
          >
            <span>🛡️</span>
            <span>Squads & Purse</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5 transition-all ${
              activeTab === 'top_bids' ? 'badge-gold text-dark shadow fw-extrabold' : 'text-white-50 hover-text-white'
            }`}
            onClick={() => {
              setActiveTab('top_bids');
              setSelectedTeam(null);
            }}
          >
            <span>🏆</span>
            <span>Top 10 Highest Bids</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5 transition-all ${
              activeTab === 'pools' ? 'btn-info text-dark shadow fw-extrabold' : 'text-white-50 hover-text-white'
            }`}
            onClick={() => {
              setActiveTab('pools');
              setSelectedTeam(null);
            }}
          >
            <span>🎡</span>
            <span>Tournament Pool Draw & Wheel</span>
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-bold text-uppercase">
            {tournament?.sportConfig?.icon || '🏆'} {tournament?.sportConfig?.name || 'Tournament'} • {tournament?.season_year || '2026/27'}
          </span>
          {activeTab === 'pools' && (
            <span className="badge bg-info bg-opacity-20 text-info border border-info border-opacity-40 px-2.5 py-1 rounded-pill text-xs fw-bold">
              🎡 Spin Wheel Draw
            </span>
          )}
          {activeTab === 'top_bids' && (
            <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-40 px-2.5 py-1 rounded-pill text-xs fw-bold">
              🏆 Top 10 Leaderboard
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SQUADS & PURSE DASHBOARD (ALL TEAMS OR SINGLE TEAM SQUAD DRILL-DOWN) */}
      {/* ========================================================================= */}
      {activeTab === 'squads' && (
        <>
          {/* TOP HEADER & NAVIGATION */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary border-opacity-25 pb-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-bold text-uppercase">
              {tournament?.sportConfig?.icon || '🏆'} {tournament?.sportConfig?.name || 'Tournament'} • {tournament?.season_year || '2026/27'}
            </span>
            <span className="badge bg-secondary bg-opacity-30 text-white-50 px-2 py-0.5 rounded-pill text-xs">
              Live Squads & Financial Hub
            </span>
          </div>
          <h2 className="h3 fw-extrabold text-white mb-0 tracking-tight">
            {focusedTeam ? `${focusedTeam.team_name} — Squad & Purse Details` : 'Team Squads & Remaining Purse'}
          </h2>
          <p className="text-white-50 text-xs mb-0 mt-1">
            {focusedTeam
              ? `Inspecting complete roster composition, category distribution, and bidding capacity for ${focusedTeam.team_name}`
              : 'Comparative purse utilization and squad capacity across all teams. Click any team card to inspect their entire roster.'}
          </p>
        </div>

        {/* Team Filter / Switcher Buttons */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold transition-all ${
              !selectedTeam ? 'btn-primary shadow' : 'btn-outline-secondary text-light'
            }`}
            onClick={() => setSelectedTeam(null)}
          >
            All Teams Overview ({teams.length})
          </button>
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold transition-all d-flex align-items-center gap-1.5 ${
                selectedTeam === t.id ? 'btn-info text-dark shadow' : 'btn-outline-secondary text-light'
              }`}
              onClick={() => setSelectedTeam(t.id)}
            >
              <span
                className="rounded-circle d-inline-block"
                style={{ width: 8, height: 8, backgroundColor: t.primary_color || '#0d6efd' }}
              ></span>
              <span>{t.team_code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ALL TEAMS SQUADS & PURSE OVERVIEW (INITIAL DEFAULT VIEW)          */}
      {/* ========================================================================= */}
      {!focusedTeam ? (
        <>
          {/* LOGGED TEAM QUICK-ACCESS HERO BANNER */}
          {loggedTeam && (
            <div
              className="auction-card p-3 p-md-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-lg"
              style={{
                borderLeft: `6px solid ${loggedTeam.color || '#06b6d4'}`,
                background: `linear-gradient(135deg, ${loggedTeam.color || '#06b6d4'}1e 0%, rgba(10, 20, 40, 0.95) 100%)`,
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black shadow"
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: loggedTeam.color || '#06b6d4',
                    fontSize: '1.05rem',
                  }}
                >
                  {loggedTeam.code || '🛡️'}
                </span>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-0.5">
                    <span className="badge badge-cyan px-2.5 py-0.5 rounded-pill text-xs fw-black text-uppercase">
                      🛡️ YOUR FRANCHISE PORTAL
                    </span>
                    <span className="text-white-50 text-xs">Franchise Representative Logged In</span>
                  </div>
                  <h4 className="fw-extrabold text-white mb-0 fs-5">
                    {loggedTeam.name || loggedTeam.code}
                  </h4>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-info text-dark rounded-pill px-3.5 py-1.5 fw-black text-xs shadow-sm d-flex align-items-center gap-1.5"
                  onClick={() => {
                    const match = teams.find((t) => t.id === loggedTeam.id || t.team_code === loggedTeam.code);
                    if (match) setSelectedTeam(match.id);
                  }}
                >
                  <span>★</span>
                  <span>Inspect My Squad & Purse →</span>
                </button>
              </div>
            </div>
          )}

          {/* League-wide Financial Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <div className="auction-card p-3 text-center h-100 d-flex flex-column justify-content-center">
                <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-semibold" style={{ letterSpacing: '0.04em' }}>
                  Total League Purse
                </span>
                <strong className="fs-4 fw-extrabold text-warning">₹{totalPurse.toLocaleString()}</strong>
                <span className="text-white-50 text-xs mt-1">{teams.length} Franchises</span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="auction-card p-3 text-center h-100 d-flex flex-column justify-content-center">
                <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-semibold" style={{ letterSpacing: '0.04em' }}>
                  Spent in Live Bids
                </span>
                <strong className="fs-4 fw-extrabold text-info">₹{totalSpent.toLocaleString()}</strong>
                <span className="text-white-50 text-xs mt-1">
                  {totalPurse > 0 ? `${Math.round((totalSpent / totalPurse) * 100)}% Utilized` : '0%'}
                </span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="auction-card p-3 text-center h-100 d-flex flex-column justify-content-center">
                <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-semibold" style={{ letterSpacing: '0.04em' }}>
                  Roster Slots Filled
                </span>
                <strong className="fs-4 fw-extrabold text-success">
                  {allSoldPlayers.length} <span className="text-white-50 fs-6 fw-normal">/ {totalSlotsCapacity}</span>
                </strong>
                <span className="text-white-50 text-xs mt-1">
                  {totalSlotsCapacity - allSoldPlayers.length} Slots Remaining
                </span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="auction-card p-3 text-center h-100 d-flex flex-column justify-content-center">
                <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-semibold" style={{ letterSpacing: '0.04em' }}>
                  Season Record Hammer
                </span>
                <strong className="fs-5 fw-extrabold text-white text-truncate d-block">
                  {highestBuy ? `${highestBuy.full_name}` : '—'}
                </strong>
                <span className="text-warning text-xs font-monospace fw-bold mt-1">
                  {highestBuy ? `₹${Number(highestBuy.sold_price).toLocaleString()}` : 'Awaiting Bids'}
                </span>
              </div>
            </div>
          </div>

          {/* Teams Comparative Purse & Squad Overview Cards */}
          <div className="row g-4">
            {teams.map((team) => {
              const initialPurse = Number(team.initial_purse || 100000);
              const remainingPurse = Number(team.remaining_purse || 0);
              const spentPurse = Math.max(0, initialPurse - remainingPurse);
              const percentSpent = Math.min(100, Math.round((spentPurse / initialPurse) * 100));
              const squad = team.squad || [];
              const squadCount = squad.length;
              const maxSquad = team.max_squad_size || 12;
              const slotsLeft = Math.max(0, maxSquad - squadCount);

              // Calculate category counts
              const openCount = squad.filter((p) => normalizeCategory(p.player_category) === 'open').length;
              const u19Count = squad.filter((p) => normalizeCategory(p.player_category) === 'u19').length;
              const u14Count = squad.filter((p) => normalizeCategory(p.player_category) === 'u14').length;
              const iconCount = squad.filter((p) => normalizeCategory(p.player_category) === 'icon_player').length;

              // Top purchase for this team
              const teamHighest = squad.reduce(
                (max, p) => (Number(p.sold_price || 0) > Number(max?.sold_price || 0) ? p : max),
                null
              );

              const isMyTeam = loggedTeam && (loggedTeam.id === team.id || loggedTeam.code === team.team_code);

              return (
                <div key={team.id} className="col-12 col-md-6 col-xl-4">
                  <div
                    className="auction-card p-4 h-100 d-flex flex-column justify-content-between position-relative transition-all"
                    style={{
                      cursor: 'pointer',
                      borderTop: `4px solid ${team.primary_color || '#0d6efd'}`,
                      ...(isMyTeam
                        ? {
                            boxShadow: '0 0 24px rgba(6, 182, 212, 0.45)',
                            borderColor: '#06b6d4',
                            borderWidth: '2px',
                          }
                        : {}),
                    }}
                    onClick={() => setSelectedTeam(team.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedTeam(team.id);
                    }}
                  >
                    {/* Top Team Badge & Squad Slot Counter */}
                    <div>
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black shadow"
                            style={{
                              width: 52,
                              height: 52,
                              backgroundColor: team.primary_color || '#0d6efd',
                              fontSize: '1.15rem',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {team.team_code}
                          </span>
                          <div>
                            <h4 className="fw-extrabold text-white mb-0 fs-5 d-flex align-items-center gap-2">
                              <span>{team.team_name}</span>
                              {team.pool && (
                                <span
                                  className="badge rounded-pill text-xs fw-extrabold px-2 py-0.5"
                                  style={{
                                    background: team.pool.includes('A') ? 'rgba(59, 130, 246, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                                    color: team.pool.includes('A') ? '#60a5fa' : '#f87171',
                                    border: `1px solid ${team.pool.includes('A') ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                                  }}
                                >
                                  {team.pool}
                                </span>
                              )}
                              {isMyTeam && (
                                <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs fw-black">
                                  ★ YOUR TEAM
                                </span>
                              )}
                            </h4>
                            <span className="text-white-50 text-xs d-block">
                              Owner: <strong>{team.owner_name || 'Management'}</strong>
                              {team.coach_name && ` • Coach: ${team.coach_name}`}
                            </span>
                          </div>
                        </div>

                        <span className="badge bg-secondary bg-opacity-30 text-light px-2.5 py-1 rounded-pill text-xs flex-shrink-0">
                          Slots: <strong className="text-white">{squadCount}</strong> / {maxSquad}
                        </span>
                      </div>

                      {/* Purse Utilization Progress Bar */}
                      <div className="bg-dark bg-opacity-60 rounded-3 p-3 border border-secondary border-opacity-20 mb-3">
                        <div className="d-flex align-items-center justify-content-between small mb-1.5">
                          <span className="text-white-50 text-xs">Purse Utilization</span>
                          <span className="text-info text-xs font-monospace fw-bold">{percentSpent}% Spent</span>
                        </div>
                        <div className="progress bg-black" style={{ height: 9, borderRadius: 999 }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${percentSpent}%`,
                              backgroundColor: team.primary_color || '#0d6efd',
                            }}
                            aria-valuenow={percentSpent}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-2.5 pt-1 border-top border-secondary border-opacity-15">
                          <div>
                            <span className="text-white-50 text-xs d-block">Spent</span>
                            <strong className="text-info text-xs font-monospace">₹{spentPurse.toLocaleString()}</strong>
                          </div>
                          <div className="text-end">
                            <span className="text-white-50 text-xs d-block">Remaining Purse</span>
                            <strong
                              className={`fs-6 fw-extrabold font-monospace ${
                                remainingPurse < 10000 ? 'text-danger' : 'text-success'
                              }`}
                            >
                              ₹{remainingPurse.toLocaleString()}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Category Composition Badges */}
                      <div className="mb-3">
                        <span className="text-white-50 text-xs d-block mb-1.5 fw-semibold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                          Squad Composition ({squadCount} Acquired)
                        </span>
                        <div className="d-flex flex-wrap align-items-center gap-1.5">
                          {iconCount > 0 && (
                            <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs">
                              ⭐ {iconCount} Icon
                            </span>
                          )}
                          <span className="badge badge-emerald px-2 py-0.5 rounded-pill text-xs">
                            🏐 {openCount} Open
                          </span>
                          <span className="badge badge-cyan px-2 py-0.5 rounded-pill text-xs">
                            ⚡ {u19Count} U19
                          </span>
                          <span className="badge bg-purple-600 text-white px-2 py-0.5 rounded-pill text-xs">
                            🌱 {u14Count} U14
                          </span>
                          <span className="badge bg-secondary bg-opacity-25 text-white-50 px-2 py-0.5 rounded-pill text-xs ms-auto">
                            {slotsLeft} Open Slots
                          </span>
                        </div>
                      </div>

                      {/* Top Acquisition Snippet */}
                      {teamHighest && (
                        <div className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-black bg-opacity-30 border border-secondary border-opacity-15 text-xs mb-3">
                          <span className="text-white-50">Top Buy:</span>
                          <span className="text-white fw-bold text-truncate mx-2" style={{ maxWidth: '55%' }}>
                            {teamHighest.full_name}
                          </span>
                          <strong className="text-warning font-monospace">₹{Number(teamHighest.sold_price).toLocaleString()}</strong>
                        </div>
                      )}
                    </div>

                    {/* Prominent Action Button to Inspect Full Details */}
                    <button
                      type="button"
                      className="btn btn-outline-info w-100 rounded-pill py-2 text-xs fw-extrabold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeam(team.id);
                      }}
                    >
                      <span>View Entire Squad Details</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* MODE 2: PARTICULAR TEAM DETAILED VIEW (WHEN A TEAM IS CLICKED)            */
        /* ========================================================================= */
        <div>
          {/* Back & Team Switcher Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <button
              type="button"
              className="btn btn-outline-light rounded-pill px-4 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-2 shadow"
              onClick={() => setSelectedTeam(null)}
            >
              <span>← Back to All Teams Overview</span>
            </button>

            <div className="d-flex flex-wrap align-items-center gap-1.5">
              <span className="text-white-50 text-xs me-1">Switch Franchise:</span>
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold ${
                    selectedTeam === t.id ? 'btn-info text-dark shadow' : 'btn-outline-secondary text-light'
                  }`}
                  onClick={() => setSelectedTeam(t.id)}
                >
                  {t.team_code}
                </button>
              ))}
            </div>
          </div>

          {/* Focused Team Master Hero Profile */}
          {(() => {
            const initialPurse = Number(focusedTeam.initial_purse || 100000);
            const remainingPurse = Number(focusedTeam.remaining_purse || 0);
            const spentPurse = Math.max(0, initialPurse - remainingPurse);
            const percentSpent = Math.min(100, Math.round((spentPurse / initialPurse) * 100));
            const squad = focusedTeam.squad || [];
            const squadCount = squad.length;
            const maxSquad = focusedTeam.max_squad_size || 12;
            const slotsRemaining = Math.max(0, maxSquad - squadCount);

            // Minimum bid increment for this tournament/sport
            const minBid = Number(tournament?.sportConfig?.minBidIncrement || 500);

            // Calculate Max Single Bid Allowed (team must reserve minBid for all subsequent unfilled slots)
            const reserveRequired = Math.max(0, (slotsRemaining - 1) * minBid);
            const maxBidAllowed = Math.max(0, remainingPurse - reserveRequired);

            // Average spend per player
            const avgSpend = squadCount > 0 ? Math.round(spentPurse / squadCount) : 0;

            // Category counts
            const openSquad = squad.filter((p) => normalizeCategory(p.player_category) === 'open');
            const u19Squad = squad.filter((p) => normalizeCategory(p.player_category) === 'u19');
            const u14Squad = squad.filter((p) => normalizeCategory(p.player_category) === 'u14');
            const iconSquad = squad.filter((p) => normalizeCategory(p.player_category) === 'icon_player');

            // Positional Breakdown
            const positionCounts = squad.reduce((acc, p) => {
              const pos = p.playing_position || 'other';
              acc[pos] = (acc[pos] || 0) + 1;
              return acc;
            }, {});

            return (
              <div>
                {/* Hero Header Card */}
                <div
                  className="auction-card p-4 mb-4 position-relative overflow-hidden"
                  style={{
                    borderLeft: `6px solid ${focusedTeam.primary_color || '#0d6efd'}`,
                    background: `linear-gradient(135deg, ${focusedTeam.primary_color}18 0%, rgba(10, 20, 40, 0.95) 100%)`,
                  }}
                >
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-4">
                    <div className="d-flex align-items-center gap-3.5">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black shadow-lg"
                        style={{
                          width: 68,
                          height: 68,
                          backgroundColor: focusedTeam.primary_color || '#0d6efd',
                          fontSize: '1.5rem',
                          border: '3px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {focusedTeam.team_code}
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-secondary bg-opacity-40 text-light px-2.5 py-0.5 rounded-pill text-xs">
                            Franchise #{focusedTeam.team_code}
                          </span>
                          <span className="badge badge-gold px-2.5 py-0.5 rounded-pill text-xs">
                            Active Competitor
                          </span>
                          {focusedTeam.pool && (
                            <span className="badge bg-primary bg-opacity-30 text-info border border-info border-opacity-40 px-2.5 py-0.5 rounded-pill text-xs fw-extrabold">
                              🏟️ {focusedTeam.pool}
                            </span>
                          )}
                        </div>
                        <h2 className="fs-3 fw-black text-white mb-1 tracking-tight">
                          {focusedTeam.team_name}
                        </h2>
                        <div className="text-white-50 text-xs d-flex flex-wrap align-items-center gap-3">
                          <span>
                            Owner: <strong className="text-light">{focusedTeam.owner_name || 'Management'}</strong>
                          </span>
                          {focusedTeam.coach_name && (
                            <span>
                              Head Coach: <strong className="text-light">{focusedTeam.coach_name}</strong>
                            </span>
                          )}
                          <span>
                            Squad Size: <strong className="text-white">{squadCount} / {maxSquad} Players</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end ms-auto">
                      <span className="text-white-50 text-xs d-block mb-1">Available Bidding Purse</span>
                      <strong className="fs-3 fw-black text-success font-monospace">
                        ₹{remainingPurse.toLocaleString()}
                      </strong>
                      <span className="text-white-50 text-xs d-block">
                        Initial: ₹{initialPurse.toLocaleString()} ({percentSpent}% used)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Deep Financial Metrics */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-lg-3">
                    <div className="auction-card p-3.5 text-center">
                      <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-semibold">
                        Remaining Purse
                      </span>
                      <strong className="fs-4 fw-extrabold text-success font-monospace">
                        ₹{remainingPurse.toLocaleString()}
                      </strong>
                      <span className="text-white-50 text-xs d-block mt-1">Available for Bids</span>
                    </div>
                  </div>

                  <div className="col-6 col-lg-3">
                    <div className="auction-card p-3.5 text-center">
                      <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-semibold">
                        Spent on Roster
                      </span>
                      <strong className="fs-4 fw-extrabold text-info font-monospace">
                        ₹{spentPurse.toLocaleString()}
                      </strong>
                      <span className="text-white-50 text-xs d-block mt-1">{percentSpent}% of Budget</span>
                    </div>
                  </div>

                  <div className="col-6 col-lg-3">
                    <div className="auction-card p-3.5 text-center">
                      <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-semibold">
                        Max Allowed Single Bid
                      </span>
                      <strong className="fs-4 fw-extrabold text-warning font-monospace">
                        ₹{maxBidAllowed.toLocaleString()}
                      </strong>
                      <span className="text-white-50 text-xs d-block mt-1">
                        Reserves ₹{reserveRequired.toLocaleString()} for {slotsRemaining - 1} slots
                      </span>
                    </div>
                  </div>

                  <div className="col-6 col-lg-3">
                    <div className="auction-card p-3.5 text-center">
                      <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-semibold">
                        Avg Spend / Player
                      </span>
                      <strong className="fs-4 fw-extrabold text-white font-monospace">
                        ₹{avgSpend.toLocaleString()}
                      </strong>
                      <span className="text-white-50 text-xs d-block mt-1">Across {squadCount} Acquired</span>
                    </div>
                  </div>
                </div>

                {/* Category & Positional Breakdown Strips */}
                <div className="auction-card p-3.5 mb-4">
                  <div className="row g-3">
                    {/* Systematic Category Distribution */}
                    <div className="col-12 col-md-6 border-end-md border-secondary border-opacity-20 pe-md-3">
                      <span className="text-white-50 text-xs d-block mb-2 text-uppercase fw-bold" style={{ letterSpacing: '0.04em' }}>
                        Category Distribution ({squadCount} Players)
                      </span>
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="badge badge-gold px-3 py-1.5 rounded-pill text-xs fw-bold">
                          ⭐ Icon: <strong>{iconSquad.length}</strong>
                        </span>
                        <span className="badge badge-emerald px-3 py-1.5 rounded-pill text-xs fw-bold">
                          🏐 Open Category: <strong>{openSquad.length}</strong>
                        </span>
                        <span className="badge badge-cyan px-3 py-1.5 rounded-pill text-xs fw-bold">
                          ⚡ Under-19 (U19): <strong>{u19Squad.length}</strong>
                        </span>
                        <span className="badge bg-purple-600 text-white px-3 py-1.5 rounded-pill text-xs fw-bold">
                          🌱 Under-14 (U14): <strong>{u14Squad.length}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Playing Position Distribution */}
                    <div className="col-12 col-md-6 ps-md-3">
                      <span className="text-white-50 text-xs d-block mb-2 text-uppercase fw-bold" style={{ letterSpacing: '0.04em' }}>
                        Positional Balance
                      </span>
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        {Object.keys(positionCounts).length === 0 ? (
                          <span className="text-white-50 text-xs">No players acquired yet</span>
                        ) : (
                          Object.entries(positionCounts).map(([pos, count]) => (
                            <span key={pos} className="badge bg-secondary bg-opacity-30 text-light px-2.5 py-1.5 rounded-pill text-xs text-capitalize">
                              {pos.replace('_', ' ')}: <strong className="text-white">{count}</strong>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Squad Roster & Empty Slots */}
                <div className="auction-card p-4">
                  <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-3 mb-3">
                    <div>
                      <h4 className="fw-extrabold text-white mb-0 fs-5">
                        Acquired Squad Roster ({squadCount} / {maxSquad})
                      </h4>
                      <span className="text-white-50 text-xs">
                        Official player registrations contracted to {focusedTeam.team_name}
                      </span>
                    </div>
                    <span className="badge bg-info text-dark rounded-pill px-3 py-1 text-xs fw-bold">
                      {slotsRemaining} Slots Open for Hammer
                    </span>
                  </div>

                  {squadCount === 0 ? (
                    <div className="p-5 text-center rounded-3 bg-black bg-opacity-30 border border-secondary border-opacity-20 my-3">
                      <div className="fs-1 mb-2">🏐</div>
                      <h5 className="fw-bold text-white mb-1">No Players Acquired Yet</h5>
                      <p className="text-white-50 small mb-0">
                        {focusedTeam.team_name} currently has all {maxSquad} squad slots open and full ₹
                        {initialPurse.toLocaleString()} purse available.
                        <br />
                        Successful bids from the live hammer podium will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-dark table-hover align-middle mb-0">
                        <thead>
                          <tr className="text-white-50 text-xs border-secondary border-opacity-25">
                            <th scope="col" style={{ width: 50 }}>#</th>
                            <th scope="col">Athlete</th>
                            <th scope="col">Category</th>
                            <th scope="col">Position</th>
                            <th scope="col">Grade / Lot</th>
                            <th scope="col">Height / Club</th>
                            <th scope="col" className="text-end">Base Price</th>
                            <th scope="col" className="text-end">Hammer Price</th>
                            <th scope="col" className="text-end">Premium</th>
                          </tr>
                        </thead>
                        <tbody>
                          {squad.map((player, idx) => {
                            const baseP = Number(player.base_price || 1000);
                            const soldP = Number(player.sold_price || baseP);
                            const premiumPercent = baseP > 0 ? Math.round(((soldP - baseP) / baseP) * 100) : 0;
                            const badgeCls = getCategoryBadgeClass(player.player_category);

                            return (
                              <tr key={player.id} className="border-secondary border-opacity-15">
                                <td className="text-white-50 font-monospace text-xs">{idx + 1}</td>
                                <td>
                                  <div className="d-flex align-items-center gap-2.5">
                                    <div
                                      className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center flex-shrink-0 border border-secondary border-opacity-30 shadow-sm"
                                      style={{ width: 40, height: 40 }}
                                    >
                                      {player.photo_url ? (
                                        <img
                                          src={player.photo_url}
                                          alt={player.full_name}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <span className="small">🏐</span>
                                      )}
                                    </div>
                                    <div>
                                      <strong className="text-white text-sm d-block">{player.full_name}</strong>
                                      <span className="text-white-50 text-xs">{player.district || 'Maharashtra'}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge px-2.5 py-1 rounded-pill text-xs fw-bold ${badgeCls}`}>
                                    {formatCategoryLabel(player.player_category)}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-secondary bg-opacity-25 text-light text-capitalize px-2 py-0.5 rounded-pill text-xs">
                                    {player.playing_position?.replace('_', ' ')}
                                  </span>
                                </td>
                                <td>
                                  <div className="text-xs">
                                    <span className="text-light fw-bold">{player.player_grade || 'Grade A'}</span>
                                    <span className="text-white-50 d-block">Lot #{player.lot_number || 1}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="text-xs">
                                    <span className="text-light">{player.height_cm ? `${player.height_cm} cm` : '—'}</span>
                                    <span className="text-white-50 d-block text-truncate" style={{ maxWidth: 140 }}>
                                      {player.team_name || 'Individual'}
                                    </span>
                                  </div>
                                </td>
                                <td className="text-end text-white-50 font-monospace text-xs">
                                  ₹{baseP.toLocaleString()}
                                </td>
                                <td className="text-end">
                                  <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 text-xs fw-extrabold font-monospace">
                                    ₹{soldP.toLocaleString()}
                                  </span>
                                </td>
                                <td className="text-end text-xs">
                                  {premiumPercent > 0 ? (
                                    <span className="text-warning fw-bold font-monospace">+{premiumPercent}%</span>
                                  ) : (
                                    <span className="text-white-50">Base Price</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Open Unfilled Slots Preview */}
                  {slotsRemaining > 0 && (
                    <div className="mt-4 pt-3 border-top border-secondary border-opacity-20">
                      <span className="text-white-50 text-xs d-block mb-2.5 text-uppercase fw-semibold" style={{ letterSpacing: '0.04em' }}>
                        Remaining Squad Slots to Fill ({slotsRemaining} Available)
                      </span>
                      <div className="row g-2">
                        {Array.from({ length: slotsRemaining }).map((_, i) => (
                          <div key={i} className="col-6 col-sm-4 col-md-3 col-xl-2">
                            <div className="p-2.5 rounded-3 bg-black bg-opacity-20 border border-secondary border-opacity-20 border-dashed text-center">
                              <span className="text-white-50 text-xs d-block">Slot #{squadCount + i + 1}</span>
                              <span className="badge bg-secondary bg-opacity-30 text-white-50 rounded-pill text-xs mt-1">
                                Open for Bid
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TOP 10 HIGHEST BIDS LEADERBOARD                                   */}
      {/* ========================================================================= */}
      {activeTab === 'top_bids' && (
        <TopBidsLeaderboard teams={teams} tournament={tournament} />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TOURNAMENT POOL DRAW & SPIN WHEEL                                 */}
      {/* ========================================================================= */}
      {activeTab === 'pools' && (
        <TeamsPoolingWheel
          teams={teams}
          tournament={tournament}
          tournamentId={activeTournamentId}
          isAdmin={isAdmin}
          onPoolsUpdated={fetchLiveStateAndTeams}
        />
      )}

      {/* PLAYER SOLD LIVE CELEBRATION MODAL */}
      {soldModalData && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-md modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-sold-card text-white text-center p-4 shadow-2xl">
              <div className="modal-action-avatar bg-warning text-dark">
                🎉
              </div>
              <span className="badge badge-gold px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase mx-auto mb-2">
                Live Auction Sale
              </span>
              <h2 className="fs-3 fw-black text-white mb-1">
                PLAYER SOLD!
              </h2>
              <p className="text-white-50 text-xs mb-3">
                Squad roster updated in real time
              </p>

              {/* Player Card with Photo */}
              {(() => {
                const soldPhoto =
                  soldModalData.photo_url ||
                  soldModalData.photoUrl ||
                  soldModalData.photo ||
                  soldModalData.image_url ||
                  allSoldPlayers.find((p) => p.full_name === (soldModalData.playerName || soldModalData.player_name))?.photo_url ||
                  '';

                return (
                  <div className="bg-dark bg-opacity-70 rounded-3 p-3 border border-secondary border-opacity-30 mb-3 text-start">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-3 overflow-hidden border border-warning border-opacity-60 shadow-lg flex-shrink-0 d-flex align-items-center justify-content-center bg-black bg-opacity-60"
                        style={{ width: 68, height: 82 }}
                      >
                        {soldPhoto ? (
                          <img
                            src={soldPhoto}
                            alt={soldModalData.playerName || 'Player'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="text-secondary text-center p-1">
                            <span className="fs-2 d-block">👤</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex flex-wrap align-items-center gap-1.5 mb-1">
                          <span className="badge badge-cyan text-xs text-uppercase">{soldModalData.position || 'Athlete'}</span>
                          {soldModalData.category && (
                            <span className={`badge px-2 py-0.5 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(soldModalData.category)}`}>
                              {formatCategoryLabel(soldModalData.category)}
                            </span>
                          )}
                        </div>
                        <h4 className="fw-extrabold text-white mb-0 fs-5 text-truncate">
                          {soldModalData.playerName || soldModalData.player_name || 'Player'}
                        </h4>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div
                className="rounded-3 p-3 border mb-3 d-flex align-items-center justify-content-between shadow-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderColor: soldModalData.teamColor || '#f59e0b',
                }}
              >
                <div className="d-flex align-items-center gap-2.5 text-start">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black font-monospace text-xs shadow"
                    style={{
                      width: 44,
                      height: 44,
                      background: soldModalData.teamColor || '#0d6efd',
                    }}
                  >
                    {soldModalData.teamCode || 'WIN'}
                  </div>
                  <div>
                    <span className="text-white-50 text-xs d-block">Awarded To</span>
                    <strong className="text-white small fw-bold">{soldModalData.teamName || soldModalData.team_name || 'Winning Team'}</strong>
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-white-50 text-xs d-block">Hammer Price</span>
                  <strong className="text-warning fs-5 fw-black font-monospace">
                    ₹{Number(soldModalData.price || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-warning rounded-pill px-4 py-2 fw-bold text-dark w-100 shadow"
                onClick={() => setSoldModalData(null)}
              >
                View Updated Squads ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER UNSOLD LIVE MODAL */}
      {unsoldModalData && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-md modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-unsold-card text-white text-center p-4 shadow-2xl">
              <div className="modal-action-avatar bg-danger bg-opacity-20 text-danger border border-danger border-opacity-50">
                🛑
              </div>
              <span className="badge bg-danger text-white px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase mx-auto mb-2 shadow-sm">
                Hammer Passed • Unsold
              </span>
              <h2 className="fs-3 fw-black text-danger mb-1 tracking-tight">
                PLAYER UNSOLD
              </h2>
              <p className="text-white-50 text-xs mb-3">
                Returned to the unsold queue for subsequent auction rounds
              </p>

              {/* Player Card details with photo if available */}
              <div className="bg-dark bg-opacity-80 rounded-3 p-3 border border-danger border-opacity-40 mb-3 text-start">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 overflow-hidden border border-danger border-opacity-60 shadow-lg flex-shrink-0 d-flex align-items-center justify-content-center bg-black bg-opacity-60"
                    style={{ width: 68, height: 80 }}
                  >
                    {unsoldModalData.photo_url || unsoldModalData.photoUrl || unsoldModalData.playerImage || unsoldModalData.player_image ? (
                      <img
                        src={unsoldModalData.photo_url || unsoldModalData.photoUrl || unsoldModalData.playerImage || unsoldModalData.player_image}
                        alt={unsoldModalData.playerName || unsoldModalData.player_name || 'Player'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="text-danger text-center p-1">
                        <span className="fs-2 d-block">👤</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-40 text-xs text-uppercase">
                        {unsoldModalData.position || 'Athlete'}
                      </span>
                      {unsoldModalData.basePrice && (
                        <span className="text-danger font-monospace small fw-bold">
                          Base: ₹{Number(unsoldModalData.basePrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <h4 className="fw-extrabold text-white mb-1 fs-5 text-truncate">
                      {unsoldModalData.playerName || unsoldModalData.player_name || 'Player'}
                    </h4>
                    <p className="text-white-50 text-xs mb-0">
                      {unsoldModalData.message || 'Player was not claimed at base price and moved to unsold lot pool.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-danger text-white rounded-pill px-4 py-2 fw-bold text-xs w-100 shadow-sm"
                onClick={() => setUnsoldModalData(null)}
              >
                Acknowledge & Close ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
