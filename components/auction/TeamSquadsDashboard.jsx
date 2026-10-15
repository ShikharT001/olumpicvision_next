'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function TeamSquadsDashboard({ initialTeams }) {
  const [teams, setTeams] = useState(initialTeams || []);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/auction/teams');
      if (res.ok) {
        const json = await res.json();
        setTeams(json.teams || []);
      }
    } catch {
      // Ignore poll error
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(fetchTeams, 2000);
    return () => clearInterval(timer);
  }, [fetchTeams]);

  const activeTeamList = selectedTeam
    ? teams.filter((t) => t.id === selectedTeam)
    : teams;

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      {/* Page Title & Filter Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary border-opacity-25 pb-3 mb-4">
        <div>
          <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-bold text-uppercase mb-1">
            League Roster Hub
          </span>
          <h2 className="h3 fw-extrabold text-white mb-0 tracking-tight">
            Team Squads & Remaining Purse
          </h2>
        </div>

        {/* Filter by Team */}
        <div className="d-flex align-items-center gap-2">
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
                        width: 50,
                        height: 50,
                        backgroundColor: team.primary_color || '#0d6efd',
                        fontSize: '1.1rem',
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

                  <span className="badge bg-secondary bg-opacity-25 text-light px-2.5 py-1 rounded-pill text-xs">
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
                      <strong className={`fs-6 ${remainingPurse < 10000 ? 'text-danger' : 'text-success'}`}>
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
                            <div className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
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
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 text-xs fw-bold">
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
    </div>
  );
}
