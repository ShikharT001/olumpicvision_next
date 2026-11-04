'use client';

import { useState, useMemo } from 'react';
import {
  formatCategoryLabel,
  getCategoryBadgeClass,
  formatCurrency,
  formatPositionLabel,
} from '@/lib/sports-config';

export default function Top10LiveScreen({
  data = {},
  tournament = null,
  tournamentId = null,
  onSwitchView = null,
  currentView = 'top10',
  isAdmin = false,
  isSplitView = false,
  isBigScreen = false,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const teams = data?.teams || [];
  const state = data?.state || {};
  const currentTourn = tournament || data?.tournament;

  // Compile all sold players across all teams
  const allSoldPlayers = useMemo(() => {
    const list = teams.flatMap((team) =>
      (team.squad || []).map((player) => ({
        ...player,
        winning_team_name: team.team_name,
        winning_team_code: team.team_code,
        winning_team_color: team.primary_color || '#0d6efd',
        winning_team_owner: team.owner_name,
        winning_team_id: team.id,
      }))
    );

    return list
      .filter((p) => p.sold_price && Number(p.sold_price) > 0)
      .sort((a, b) => {
        const priceDiff = Number(b.sold_price) - Number(a.sold_price);
        if (priceDiff !== 0) return priceDiff;
        return Number(b.base_price || 0) - Number(a.base_price || 0);
      });
  }, [teams]);

  // Filter by category if selected
  const filteredPlayers = useMemo(() => {
    if (selectedCategory === 'all') return allSoldPlayers.slice(0, 10);
    return allSoldPlayers
      .filter((p) => {
        const cat = String(p.player_category || '').toLowerCase();
        return cat.includes(selectedCategory);
      })
      .slice(0, 10);
  }, [allSoldPlayers, selectedCategory]);

  const top10 = filteredPlayers;
  const top1Price = top10.length > 0 ? Number(top10[0]?.sold_price || 0) : 0;

  return (
    <div className={`top10-live-stage-root w-100 ${isSplitView ? 'is-split-layout' : ''}`}>
      {/* ── BROADCAST TOP HEADER (Clean graphics, NO links, NO buttons on big screen) ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2.5 border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-2.5">
          <div className="p-2 rounded-circle bg-warning bg-opacity-20 border border-warning border-opacity-50 text-warning fs-4 shadow-sm">
            🏆
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-0.5">
              <span className="badge badge-gold px-2.5 py-0.5 rounded-pill text-xs fw-black text-uppercase">
                {currentTourn?.sportConfig?.icon || '🏐'} {currentTourn?.tournament_name || 'Tournament Auction'}
              </span>
              <span className="badge bg-danger text-white rounded-pill px-2.5 py-0.5 text-xs fw-bold d-inline-flex align-items-center gap-1 shadow-sm">
                <span className="spinner-grow spinner-grow-sm" style={{ width: 7, height: 7 }} role="status"></span>
                OFFICIAL TOP 10 LEADERBOARD
              </span>
              <span className="text-white-50 text-xs font-monospace">
                • {top10.length}/10 Finalized Signings
              </span>
            </div>
            <h1 className="h4 fw-black text-white mb-0 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Top 10 Highest Priced Players
            </h1>
          </div>
        </div>

        {/* If NOT big screen, show category filters or switcher */}
        {!isBigScreen && (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="d-flex align-items-center gap-1 bg-black bg-opacity-50 p-1 rounded-pill border border-secondary border-opacity-30">
              {[
                { key: 'all', label: `All (${allSoldPlayers.length})` },
                { key: 'icon', label: '⭐ Icon' },
                { key: 'open', label: '🏐 Open' },
                { key: 'u19', label: '🔥 U19' },
                { key: 'u14', label: '⚡ U14' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`btn btn-xs rounded-pill px-2.5 py-1 text-xs fw-bold transition-all ${
                    selectedCategory === cat.key
                      ? 'btn-warning text-dark shadow-sm'
                      : 'btn-outline-secondary text-light border-0'
                  }`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {onSwitchView && (
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 text-xs fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                onClick={() => onSwitchView('podium')}
                title="Return to Active Player Podium View"
              >
                <span>🎯</span>
                <span>Active Player</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── TOP 10 TABLE CARD ONLY ── */}
      <div
        className="auction-card p-3 p-md-4 shadow-2xl position-relative overflow-hidden border border-warning border-opacity-35"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(11, 18, 36, 0.99) 100%)',
          borderRadius: '16px',
        }}
      >
        {top10.length === 0 ? (
          <div className="p-5 text-center rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-20 my-4">
            <div className="fs-1 mb-2">🏆</div>
            <h4 className="fw-black text-white mb-1">No Sold Players Yet</h4>
            <p className="text-white-50 small mb-0">
              As players are knocked down by the auction hammer, the top 10 highest-priced players will dynamically populate here in real-time.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 6px' }}>
              <thead>
                <tr className="text-white-50 text-xs border-bottom border-secondary border-opacity-25 text-uppercase">
                  <th scope="col" style={{ width: 85 }} className="text-center py-2.5">Rank</th>
                  <th scope="col" className="py-2.5">Player Athlete</th>
                  <th scope="col" className="py-2.5">Category</th>
                  <th scope="col" className="py-2.5">Acquired By Franchise</th>
                  <th scope="col" style={{ minWidth: 160 }} className="py-2.5">Price vs #1 Leader</th>
                  <th scope="col" className="text-end py-2.5">Base Price</th>
                  <th scope="col" className="text-end py-2.5">Final Hammer Price</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((player, idx) => {
                  const rank = idx + 1;
                  const baseP = Number(player.base_price || 1000);
                  const soldP = Number(player.sold_price || baseP);
                  const badgeCls = getCategoryBadgeClass(player.player_category);
                  const gapToLeader = top1Price > 0 ? top1Price - soldP : 0;
                  const ratioToLeader = top1Price > 0 ? Math.round((soldP / top1Price) * 100) : 100;

                  return (
                    <tr
                      key={player.id || idx}
                      className="border-0 transition-all broadcast-table-row"
                      style={{
                        animationDelay: `${idx * 0.045}s`,
                        background:
                          rank === 1
                            ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.22) 0%, rgba(30, 41, 59, 0.65) 100%)'
                            : rank === 2
                            ? 'linear-gradient(90deg, rgba(148, 163, 184, 0.16) 0%, rgba(20, 30, 48, 0.55) 100%)'
                            : rank === 3
                            ? 'linear-gradient(90deg, rgba(180, 83, 9, 0.16) 0%, rgba(20, 30, 48, 0.55) 100%)'
                            : 'rgba(15, 23, 42, 0.5)',
                        borderLeft: `4px solid ${
                          rank === 1
                            ? '#f59e0b'
                            : rank === 2
                            ? '#94a3b8'
                            : rank === 3
                            ? '#b45309'
                            : player.winning_team_color || '#3b82f6'
                        }`,
                      }}
                    >
                      {/* Rank Column */}
                      <td className="text-center py-2.5">
                        {rank === 1 ? (
                          <span className="badge badge-gold rounded-pill px-3 py-1.5 text-xs fw-black shadow">
                            🥇 #1
                          </span>
                        ) : rank === 2 ? (
                          <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1.5 text-xs fw-black shadow">
                            🥈 #2
                          </span>
                        ) : rank === 3 ? (
                          <span className="badge bg-warning bg-opacity-30 text-warning border border-warning border-opacity-50 rounded-pill px-2.5 py-1.5 text-xs fw-black shadow">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="badge bg-dark text-white-50 rounded-pill px-2.5 py-1 text-xs font-monospace border border-secondary border-opacity-30">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Player Athlete Photo & Name */}
                      <td className="py-2.5">
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center flex-shrink-0 border shadow-sm"
                            style={{
                              width: 46,
                              height: 46,
                              borderColor: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : 'rgba(255,255,255,0.25)',
                            }}
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
                            <div className="d-flex align-items-center gap-1.5 mb-0.5">
                              <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-40 font-monospace text-xs px-2 py-0.5 fw-black">
                                #{player.playerno || player.lot_number || idx + 1}
                              </span>
                              <strong className="text-white text-sm font-sans fw-bold">{player.full_name}</strong>
                            </div>
                            <div className="d-flex align-items-center gap-1.5 text-xs text-white-50">
                              <span className="text-capitalize">{formatPositionLabel(player.playing_position)}</span>
                              <span>•</span>
                              <span>{player.team_name || 'Palghar'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5">
                        <span className={`badge px-2.5 py-1 rounded-pill text-xs fw-bold ${badgeCls}`}>
                          {formatCategoryLabel(player.player_category)}
                        </span>
                      </td>

                      {/* Winning Franchise */}
                      <td className="py-2.5">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center text-white text-xs fw-black shadow flex-shrink-0"
                            style={{
                              width: 34,
                              height: 34,
                              backgroundColor: player.winning_team_color,
                            }}
                          >
                            {player.winning_team_code}
                          </span>
                          <div>
                            <strong className="text-white text-xs d-block">{player.winning_team_name}</strong>
                            {player.winning_team_owner && (
                              <span className="text-white-50 text-xs">Owner: {player.winning_team_owner}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Delta vs Leader with Meter */}
                      <td className="py-2.5">
                        <div style={{ minWidth: 150 }}>
                          <div className="d-flex align-items-center justify-content-between text-xs mb-1">
                            {rank === 1 ? (
                              <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs fw-black">👑 Record Buy</span>
                            ) : (
                              <span className="text-danger fw-bold font-monospace">
                                -₹{formatCurrency(gapToLeader)}
                              </span>
                            )}
                            <span className="text-white-50 font-monospace text-xs">{ratioToLeader}% of #1</span>
                          </div>
                          <div className="progress" style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                            <div
                              className="progress-bar rounded-pill"
                              style={{
                                width: `${ratioToLeader}%`,
                                background: rank === 1
                                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                  : rank <= 3
                                  ? 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                                  : 'linear-gradient(90deg, #10b981, #06b6d4)',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Base Price */}
                      <td className="text-end text-white-50 font-monospace text-xs py-2.5">
                        ₹{formatCurrency(baseP)}
                      </td>

                      {/* Final Hammer Price */}
                      <td className="text-end py-2.5">
                        <span
                          className={`badge px-3 py-1.5 text-xs fw-black font-monospace shadow-sm ${
                            rank === 1
                              ? 'bg-warning text-dark border-2 border-white'
                              : rank <= 3
                              ? 'bg-info bg-opacity-25 text-info border border-info border-opacity-40'
                              : 'bg-success-subtle text-success border border-success-subtle'
                          }`}
                        >
                          ₹{formatCurrency(soldP)}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty slots placeholders up to 10 */}
                {Array.from({ length: Math.max(0, 10 - top10.length) }).map((_, i) => (
                  <tr key={`slot-${i}`} className="border-0 opacity-30">
                    <td className="text-center text-white-50 font-monospace text-xs py-2">
                      #{top10.length + i + 1}
                    </td>
                    <td colSpan={6} className="text-white-50 text-xs py-2">
                      <span className="border-dashed px-2.5 py-0.5 rounded">
                        Awaiting next live podium auction sale...
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
