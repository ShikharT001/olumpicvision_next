'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

export default function TeamSquadsDashboard({ initialTeams }) {
  const [teams, setTeams] = useState(initialTeams || []);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [liveNotification, setLiveNotification] = useState(null);
  const [soldModalData, setSoldModalData] = useState(null);
  const [unsoldModalData, setUnsoldModalData] = useState(null);
  const lastNotifIdRef = useRef(null);

  const fetchLiveStateAndTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/auction/state');
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
  }, []);

  useEffect(() => {
    fetchLiveStateAndTeams();
    const timer = setInterval(fetchLiveStateAndTeams, 1500);
    return () => clearInterval(timer);
  }, [fetchLiveStateAndTeams]);

  const activeTeamList = selectedTeam
    ? teams.filter((t) => t.id === selectedTeam)
    : teams;

  // Aggregate league stats
  const totalPurse = teams.reduce((acc, t) => acc + Number(t.initial_purse || 0), 0);
  const remainingPurse = teams.reduce((acc, t) => acc + Number(t.remaining_purse || 0), 0);
  const totalSpent = Math.max(0, totalPurse - remainingPurse);
  const allSoldPlayers = teams.flatMap((t) => t.squad || []);
  const highestBuy = allSoldPlayers.reduce((max, p) => (Number(p.sold_price || 0) > Number(max?.sold_price || 0) ? p : max), null);

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
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
                  ? 'bg-warning text-dark'
                  : 'badge-cyan'
              }`}
            >
              {liveNotification.type === 'sold' ? '📢 LATEST SALE' : '⚠️ LATEST OUTCOME'}
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

      {/* Page Title & Filter Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary border-opacity-25 pb-3 mb-4">
        <div>
          <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-bold text-uppercase mb-1">
            PDVL 2026/27 League Roster Hub
          </span>
          <h2 className="h3 fw-extrabold text-white mb-0 tracking-tight">
            Team Squads & Remaining Purse
          </h2>
        </div>

        {/* Filter by Team */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold ${!selectedTeam ? 'btn-primary' : 'btn-outline-secondary text-light'}`}
            onClick={() => setSelectedTeam(null)}
          >
            All Teams ({teams.length})
          </button>
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold ${selectedTeam === t.id ? 'btn-info text-dark' : 'btn-outline-secondary text-light'}`}
              onClick={() => setSelectedTeam(t.id)}
            >
              {t.team_code}
            </button>
          ))}
        </div>
      </div>

      {/* League Financial Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block mb-1">Total League Purse</span>
            <strong className="fs-4 fw-extrabold text-warning">₹{totalPurse.toLocaleString()}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block mb-1">Spent in Bids</span>
            <strong className="fs-4 fw-extrabold text-info">₹{totalSpent.toLocaleString()}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block mb-1">Players Acquired</span>
            <strong className="fs-4 fw-extrabold text-success">{allSoldPlayers.length}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block mb-1">Season Record Buy</span>
            <strong className="fs-5 fw-extrabold text-white text-truncate d-block">
              {highestBuy ? `${highestBuy.full_name} (₹${Number(highestBuy.sold_price).toLocaleString()})` : '—'}
            </strong>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="row g-4">
        {activeTeamList.map((team) => {
          const initialPurse = Number(team.initial_purse || 100000);
          const remainingPurse = Number(team.remaining_purse || 0);
          const spentPurse = Math.max(0, initialPurse - remainingPurse);
          const percentSpent = Math.min(100, Math.round((spentPurse / initialPurse) * 100));
          const squad = team.squad || [];
          const squadCount = squad.length;
          const maxSquad = team.max_squad_size || 12;

          return (
            <div key={team.id} className="col-12 col-lg-6">
              <div className="auction-card p-4 h-100 d-flex flex-column">
                {/* Team Header */}
                <div className="d-flex align-items-start justify-content-between border-bottom border-secondary border-opacity-25 pb-3 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <span
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-extrabold shadow-sm"
                      style={{
                        width: 52,
                        height: 52,
                        backgroundColor: team.primary_color || '#0d6efd',
                        fontSize: '1.15rem',
                      }}
                    >
                      {team.team_code}
                    </span>
                    <div>
                      <h4 className="fw-bold text-white mb-0">{team.team_name}</h4>
                      <span className="text-white-50 text-xs">
                        Owner: <strong>{team.owner_name || 'Management'}</strong> {team.coach_name && `• Coach: ${team.coach_name}`}
                      </span>
                    </div>
                  </div>

                  <span className="badge bg-secondary bg-opacity-30 text-light px-2.5 py-1 rounded-pill text-xs">
                    Squad: <strong className="text-white">{squadCount}</strong> / {maxSquad}
                  </span>
                </div>

                {/* Purse Progress Bar */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between small mb-1.5">
                    <span className="text-white-50 text-xs">Purse Utilization ({percentSpent}%)</span>
                    <span className="text-white-50 text-xs">
                      Total: <strong className="text-white">₹{initialPurse.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="progress bg-dark" style={{ height: 10, borderRadius: 999 }}>
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
                  <div className="d-flex align-items-center justify-content-between mt-2">
                    <div>
                      <span className="text-white-50 text-xs d-block">Spent in Bids</span>
                      <strong className="text-info fs-6">₹{spentPurse.toLocaleString()}</strong>
                    </div>
                    <div className="text-end">
                      <span className="text-white-50 text-xs d-block">Remaining Purse</span>
                      <strong className={`fs-6 fw-extrabold ${remainingPurse < 10000 ? 'text-danger' : 'text-success'}`}>
                        ₹{remainingPurse.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Squad Player List */}
                <div className="mt-auto">
                  <span className="text-white-50 text-xs d-block mb-2 text-uppercase fw-bold" style={{ letterSpacing: '0.04em' }}>
                    Acquired Players ({squadCount})
                  </span>

                  {squadCount === 0 ? (
                    <div className="p-3 text-center rounded-3 bg-black bg-opacity-20 border border-secondary border-opacity-15 text-white-50 small">
                      No players acquired yet. Bids will appear here in real time.
                    </div>
                  ) : (
                    <div className="list-group list-group-flush rounded-3 overflow-hidden border border-secondary border-opacity-20" style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {squad.map((player) => (
                        <div
                          key={player.id}
                          className="list-group-item bg-transparent text-white border-secondary border-opacity-15 p-2 d-flex align-items-center justify-content-between"
                        >
                          <div className="d-flex align-items-center gap-2.5">
                            <div className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                              {player.photo_url ? (
                                <img src={player.photo_url} alt={player.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span className="small">🏐</span>
                              )}
                            </div>
                            <div>
                              <strong className="text-white text-xs d-block">{player.full_name}</strong>
                              <span className="badge bg-secondary bg-opacity-25 text-white-50 text-xs text-capitalize">
                                {player.playing_position?.replace('_', ' ')}
                              </span>
                              {player.height_cm && <span className="text-white-50 text-xs ms-1.5">• {player.height_cm}cm</span>}
                            </div>
                          </div>

                          <div className="text-end">
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 text-xs fw-bold">
                              ₹{Number(player.sold_price || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PLAYER SOLD LIVE MODAL */}
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

              <div className="bg-dark bg-opacity-70 rounded-3 p-3 border border-secondary border-opacity-30 mb-3 text-start">
                <h4 className="fw-extrabold text-white mb-1 fs-5">
                  {soldModalData.playerName || soldModalData.player_name || 'Player'}
                </h4>
                <div className="text-white-50 text-xs">
                  Position: <span className="badge badge-cyan text-xs text-uppercase">{soldModalData.position || 'Athlete'}</span>
                </div>
              </div>

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
              <div className="modal-action-avatar bg-warning bg-opacity-20 text-warning border border-warning border-opacity-40">
                ⚠️
              </div>
              <span className="badge bg-warning text-dark px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase mx-auto mb-2">
                Hammer Passed • Unsold
              </span>
              <h2 className="fs-3 fw-black text-white mb-1">
                PLAYER UNSOLD
              </h2>
              <p className="text-white-50 text-xs mb-3">
                Returned to the unsold queue for subsequent auction rounds
              </p>

              <div className="bg-dark bg-opacity-70 rounded-3 p-3 border border-secondary border-opacity-30 mb-3 text-start">
                <h4 className="fw-extrabold text-white mb-1 fs-5">
                  {unsoldModalData.playerName || unsoldModalData.player_name || 'Player'}
                </h4>
                <p className="text-white-50 text-xs mb-0">
                  {unsoldModalData.message || 'Player was not claimed at base price and moved to unsold lot pool.'}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold text-xs w-100"
                onClick={() => setUnsoldModalData(null)}
              >
                Dismiss ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
