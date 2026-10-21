'use client';

import { useMemo } from 'react';
import { formatCategoryLabel, getCategoryBadgeClass } from '@/lib/sports-config';

export default function TopBidsLeaderboard({ teams = [], tournament = null }) {
  // Aggregate and sort all sold players across all competing franchises
  const top10Players = useMemo(() => {
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
      })
      .slice(0, 10);
  }, [teams]);

  const top1 = top10Players[0] || null;
  const top2 = top10Players[1] || null;
  const top3 = top10Players[2] || null;

  return (
    <div className="auction-top-bids-section">
      {/* Header Banner */}
      <div className="auction-card p-4 mb-4 position-relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(10, 20, 40, 0.95) 100%)',
        borderLeft: '6px solid #f59e0b',
      }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1.5">
              <span className="badge badge-gold px-3 py-1 rounded-pill text-xs fw-black text-uppercase">
                🏆 RECORD ACQUISITIONS
              </span>
              <span className="badge bg-secondary bg-opacity-35 text-white-50 px-2 py-0.5 rounded-pill text-xs">
                {tournament?.tournament_name || 'Tournament'} • Top 10 Bids
              </span>
            </div>
            <h2 className="fs-3 fw-black text-white mb-1 tracking-tight">
              Top 10 Players with Highest Bids
            </h2>
            <p className="text-white-50 text-xs mb-0">
              The official prestige leaderboard ranking the most valued player acquisitions of the auction season.
            </p>
          </div>

          <div className="text-end ms-auto">
            <span className="text-white-50 text-xs d-block mb-1">Total League Record Signings</span>
            <strong className="fs-4 fw-extrabold text-warning font-monospace">
              {top10Players.length} <span className="text-white-50 fs-6 fw-normal">/ 10 Ranks Filled</span>
            </strong>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM SPOTLIGHT (When at least 1 player is sold) */}
      {top10Players.length > 0 && (
        <div className="row g-3 mb-4 align-items-end">
          {/* Rank #2: Silver (Left) */}
          <div className="col-12 col-md-4 order-2 order-md-1">
            {top2 ? (
              <div
                className="auction-card p-3.5 text-center position-relative h-100"
                style={{
                  borderTop: '4px solid #94a3b8',
                  background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.12) 0%, rgba(15, 31, 61, 0.9) 100%)',
                }}
              >
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-30 text-white fw-black mb-2 shadow" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>
                  🥈
                </div>
                <span className="badge bg-secondary bg-opacity-50 text-light px-2.5 py-0.5 rounded-pill text-xs fw-bold text-uppercase d-block mx-auto mb-2" style={{ maxWidth: 120 }}>
                  Rank #2 Buy
                </span>
                <div className="rounded-circle overflow-hidden bg-dark mx-auto mb-2 border border-secondary border-opacity-30 shadow" style={{ width: 58, height: 58 }}>
                  {top2.photo_url ? (
                    <img src={top2.photo_url} alt={top2.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary fs-4">🏐</div>
                  )}
                </div>
                <h4 className="fw-extrabold text-white mb-1 fs-6 text-truncate" title={top2.full_name}>{top2.full_name}</h4>
                <div className="d-flex align-items-center justify-content-center gap-1.5 mb-2">
                  <span className={`badge px-2 py-0.5 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(top2.player_category)}`}>
                    {formatCategoryLabel(top2.player_category)}
                  </span>
                  <span className="badge bg-secondary bg-opacity-30 text-light px-2 py-0.5 rounded-pill text-xs text-capitalize">
                    {top2.playing_position?.replace('_', ' ')}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <span className="badge rounded-circle p-1 text-white text-xs fw-bold" style={{ backgroundColor: top2.winning_team_color, width: 22, height: 22 }}>
                    {top2.winning_team_code}
                  </span>
                  <strong className="text-white text-xs">{top2.winning_team_name}</strong>
                </div>
                <div className="p-2 rounded-2 bg-black bg-opacity-40 border border-secondary border-opacity-20">
                  <span className="text-white-50 text-xs d-block">Hammer Price</span>
                  <strong className="text-info fs-5 fw-black font-monospace">₹{Number(top2.sold_price).toLocaleString()}</strong>
                </div>
              </div>
            ) : (
              <div className="auction-card p-4 text-center border-dashed text-white-50 small h-100 d-flex flex-column justify-content-center">
                <span className="fs-3 mb-1">🥈</span>
                <strong className="text-light">Rank #2 Open</strong>
                <span>Awaiting live bids</span>
              </div>
            )}
          </div>

          {/* Rank #1: Gold Crown Record Buy (Center, Elevated) */}
          <div className="col-12 col-md-4 order-1 order-md-2">
            <div
              className="auction-card p-4 text-center position-relative shadow-2xl"
              style={{
                borderTop: '6px solid #f59e0b',
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.22) 0%, rgba(15, 31, 61, 0.98) 100%)',
                boxShadow: '0 0 50px -10px rgba(245, 158, 11, 0.45), 0 20px 40px -12px rgba(0, 0, 0, 0.8)',
                transform: 'translateY(-6px)',
              }}
            >
              <div className="position-absolute top-0 start-50 translate-middle">
                <span className="badge badge-gold px-3.5 py-1 rounded-pill text-xs fw-black text-uppercase shadow-lg d-inline-flex align-items-center gap-1.5">
                  <span>👑</span>
                  <span>RECORD BUY #1</span>
                </span>
              </div>

              <div className="rounded-circle overflow-hidden bg-dark mx-auto mb-2.5 mt-2 border-2 border-warning shadow-lg" style={{ width: 84, height: 84, border: '3px solid #f59e0b' }}>
                {top1.photo_url ? (
                  <img src={top1.photo_url} alt={top1.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-warning fs-1">👑</div>
                )}
              </div>

              <h3 className="fw-black text-white mb-1 fs-5 tracking-tight text-truncate" title={top1.full_name}>
                {top1.full_name}
              </h3>

              <div className="d-flex align-items-center justify-content-center gap-1.5 mb-2.5">
                <span className={`badge px-2.5 py-0.5 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(top1.player_category)}`}>
                  {formatCategoryLabel(top1.player_category)}
                </span>
                <span className="badge bg-secondary bg-opacity-35 text-light px-2 py-0.5 rounded-pill text-xs text-capitalize">
                  {top1.playing_position?.replace('_', ' ')}
                </span>
                <span className="badge bg-dark text-warning px-2 py-0.5 rounded-pill text-xs">
                  {top1.player_grade || 'Grade A'}
                </span>
              </div>

              {/* Winning Franchise Spotlight */}
              <div className="d-flex align-items-center justify-content-center gap-2 mb-3 py-1 px-2.5 rounded-pill bg-black bg-opacity-40 border border-secondary border-opacity-30 d-inline-flex">
                <span className="rounded-circle d-inline-flex align-items-center justify-content-center text-white text-xs fw-black" style={{ width: 24, height: 24, backgroundColor: top1.winning_team_color }}>
                  {top1.winning_team_code}
                </span>
                <strong className="text-white text-xs">{top1.winning_team_name}</strong>
              </div>

              <div className="p-3 rounded-3 bg-black bg-opacity-50 border border-warning border-opacity-30">
                <span className="text-white-50 text-xs text-uppercase fw-bold d-block mb-0.5" style={{ letterSpacing: '0.04em' }}>
                  Season Record Hammer
                </span>
                <strong className="text-warning fs-3 fw-black font-monospace d-block">
                  ₹{Number(top1.sold_price).toLocaleString()}
                </strong>
                <div className="d-flex align-items-center justify-content-between text-xs text-white-50 mt-1 pt-1 border-top border-secondary border-opacity-20">
                  <span>Base: ₹{Number(top1.base_price || 1000).toLocaleString()}</span>
                  <span className="text-success fw-bold font-monospace">
                    +{Math.round(((Number(top1.sold_price) - Number(top1.base_price || 1000)) / Number(top1.base_price || 1000)) * 100)}% Premium
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rank #3: Bronze (Right) */}
          <div className="col-12 col-md-4 order-3 order-md-3">
            {top3 ? (
              <div
                className="auction-card p-3.5 text-center position-relative h-100"
                style={{
                  borderTop: '4px solid #b45309',
                  background: 'linear-gradient(180deg, rgba(180, 83, 9, 0.14) 0%, rgba(15, 31, 61, 0.9) 100%)',
                }}
              >
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-20 text-warning fw-black mb-2 shadow" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>
                  🥉
                </div>
                <span className="badge bg-warning bg-opacity-20 text-warning px-2.5 py-0.5 rounded-pill text-xs fw-bold text-uppercase d-block mx-auto mb-2" style={{ maxWidth: 120 }}>
                  Rank #3 Buy
                </span>
                <div className="rounded-circle overflow-hidden bg-dark mx-auto mb-2 border border-secondary border-opacity-30 shadow" style={{ width: 58, height: 58 }}>
                  {top3.photo_url ? (
                    <img src={top3.photo_url} alt={top3.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary fs-4">🏐</div>
                  )}
                </div>
                <h4 className="fw-extrabold text-white mb-1 fs-6 text-truncate" title={top3.full_name}>{top3.full_name}</h4>
                <div className="d-flex align-items-center justify-content-center gap-1.5 mb-2">
                  <span className={`badge px-2 py-0.5 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(top3.player_category)}`}>
                    {formatCategoryLabel(top3.player_category)}
                  </span>
                  <span className="badge bg-secondary bg-opacity-30 text-light px-2 py-0.5 rounded-pill text-xs text-capitalize">
                    {top3.playing_position?.replace('_', ' ')}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <span className="badge rounded-circle p-1 text-white text-xs fw-bold" style={{ backgroundColor: top3.winning_team_color, width: 22, height: 22 }}>
                    {top3.winning_team_code}
                  </span>
                  <strong className="text-white text-xs">{top3.winning_team_name}</strong>
                </div>
                <div className="p-2 rounded-2 bg-black bg-opacity-40 border border-secondary border-opacity-20">
                  <span className="text-white-50 text-xs d-block">Hammer Price</span>
                  <strong className="text-warning fs-5 fw-black font-monospace">₹{Number(top3.sold_price).toLocaleString()}</strong>
                </div>
              </div>
            ) : (
              <div className="auction-card p-4 text-center border-dashed text-white-50 small h-100 d-flex flex-column justify-content-center">
                <span className="fs-3 mb-1">🥉</span>
                <strong className="text-light">Rank #3 Open</strong>
                <span>Awaiting live bids</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLETE TOP 10 LEADERBOARD TABLE */}
      <div className="auction-card p-4">
        <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-3 mb-3">
          <div>
            <h4 className="fw-extrabold text-white mb-0 fs-5">
              Top 10 Official Bidding Hall of Fame
            </h4>
            <span className="text-white-50 text-xs">
              Live ranking of the highest individual player valuations awarded across all teams
            </span>
          </div>
          <span className="badge bg-dark text-warning border border-warning border-opacity-30 rounded-pill px-3 py-1 text-xs font-monospace">
            ● LIVE LEADERBOARD
          </span>
        </div>

        {top10Players.length === 0 ? (
          <div className="p-5 text-center rounded-3 bg-black bg-opacity-30 border border-secondary border-opacity-20 my-3">
            <div className="fs-1 mb-2">🏆</div>
            <h5 className="fw-bold text-white mb-1">No Auction Bids Finalized Yet</h5>
            <p className="text-white-50 small mb-0">
              As players are auctioned and sold on the live podium, the top 10 highest purchases along with their winning franchise and hammer amounts will automatically populate this leaderboard in real time.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr className="text-white-50 text-xs border-secondary border-opacity-25">
                  <th scope="col" style={{ width: 70 }} className="text-center">Rank</th>
                  <th scope="col">Athlete</th>
                  <th scope="col">Category</th>
                  <th scope="col">Position</th>
                  <th scope="col">Winning Franchise</th>
                  <th scope="col" className="text-end">Base Price</th>
                  <th scope="col" className="text-end">Winning Bid</th>
                  <th scope="col" className="text-end">Appreciation</th>
                </tr>
              </thead>
              <tbody>
                {top10Players.map((player, idx) => {
                  const rank = idx + 1;
                  const baseP = Number(player.base_price || 1000);
                  const soldP = Number(player.sold_price || baseP);
                  const premiumPercent = baseP > 0 ? Math.round(((soldP - baseP) / baseP) * 100) : 0;
                  const badgeCls = getCategoryBadgeClass(player.player_category);

                  return (
                    <tr key={player.id || idx} className="border-secondary border-opacity-15">
                      {/* Rank Indicator */}
                      <td className="text-center">
                        {rank === 1 ? (
                          <span className="badge badge-gold rounded-pill px-2.5 py-1 text-xs fw-black shadow-sm">
                            🥇 #1
                          </span>
                        ) : rank === 2 ? (
                          <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 text-xs fw-black shadow-sm">
                            🥈 #2
                          </span>
                        ) : rank === 3 ? (
                          <span className="badge bg-warning bg-opacity-30 text-warning border border-warning border-opacity-40 rounded-pill px-2.5 py-1 text-xs fw-black shadow-sm">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="badge bg-dark text-white-50 rounded-pill px-2 py-0.5 text-xs font-monospace">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Athlete Avatar & Name */}
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center flex-shrink-0 border shadow-sm"
                            style={{
                              width: 42,
                              height: 42,
                              borderColor: rank === 1 ? '#f59e0b' : 'rgba(255,255,255,0.2)',
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
                            <strong className="text-white text-sm d-block">{player.full_name}</strong>
                            <span className="text-white-50 text-xs">{player.district || 'Maharashtra'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={`badge px-2.5 py-1 rounded-pill text-xs fw-bold ${badgeCls}`}>
                          {formatCategoryLabel(player.player_category)}
                        </span>
                      </td>

                      {/* Position */}
                      <td>
                        <span className="badge bg-secondary bg-opacity-25 text-light text-capitalize px-2 py-0.5 rounded-pill text-xs">
                          {player.playing_position?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Winning Franchise */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center text-white text-xs fw-black shadow-sm flex-shrink-0"
                            style={{
                              width: 30,
                              height: 30,
                              backgroundColor: player.winning_team_color,
                            }}
                          >
                            {player.winning_team_code}
                          </span>
                          <div>
                            <strong className="text-white text-xs d-block">{player.winning_team_name}</strong>
                            <span className="text-white-50 text-xs">Owner: {player.winning_team_owner || 'Management'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Base Price */}
                      <td className="text-end text-white-50 font-monospace text-xs">
                        ₹{baseP.toLocaleString()}
                      </td>

                      {/* Hammer Winning Price */}
                      <td className="text-end">
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 text-xs fw-black font-monospace">
                          ₹{soldP.toLocaleString()}
                        </span>
                      </td>

                      {/* Premium Above Base */}
                      <td className="text-end text-xs">
                        {premiumPercent > 0 ? (
                          <span className="badge bg-warning bg-opacity-15 text-warning border border-warning border-opacity-30 px-2 py-0.5 rounded-pill font-monospace fw-bold">
                            +{premiumPercent}%
                          </span>
                        ) : (
                          <span className="text-white-50 font-monospace">Base Price</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Placeholders for unfilled top 10 slots */}
                {Array.from({ length: Math.max(0, 10 - top10Players.length) }).map((_, i) => (
                  <tr key={`slot-${i}`} className="border-secondary border-opacity-10 opacity-40">
                    <td className="text-center text-white-50 font-monospace text-xs">#{top10Players.length + i + 1}</td>
                    <td colSpan={7} className="text-white-50 text-xs py-2.5">
                      <span className="border-dashed px-2 py-0.5 rounded">
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
