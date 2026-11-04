'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  formatCategoryLabel,
  getCategoryBadgeClass,
  formatCurrency,
  formatPositionLabel,
} from '@/lib/sports-config';
import Top10LiveScreen from './Top10LiveScreen';
import TeamsPoolingWheel from './TeamsPoolingWheel';

// Play synthesized fanfare using standard Web Audio API (no external files)
function playFanfareSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 fanfare
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + idx * 0.11 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.11);
      osc.stop(ctx.currentTime + idx * 0.11 + 0.45);
    });
  } catch {
    // Ignore audio permission restrictions
  }
}

export default function BigScreenStage({ initialData, tournament = null, tournamentId: propTournamentId }) {
  const activeTournamentId = propTournamentId || tournament?.id || tournament?.slug;
  const [data, setData] = useState(initialData || {});
  const [soldOverlay, setSoldOverlay] = useState(null);
  const [unsoldNotification, setUnsoldNotification] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualView, setManualView] = useState(null); // null (sync with server), 'podium', 'top10', 'split'
  const [autoCycle, setAutoCycle] = useState(false);
  const lastNotifIdRef = useRef(initialData?.lastNotification?.id || null);

  const handleNewNotification = useCallback((notif) => {
    if (!notif || notif.id === lastNotifIdRef.current) return;
    lastNotifIdRef.current = notif.id;

    if (notif.type === 'sold') {
      setSoldOverlay(notif);
      playFanfareSound();
      const timer = setTimeout(() => {
        setSoldOverlay(null);
      }, 7500);
      return () => clearTimeout(timer);
    } else if (notif.type === 'unsold') {
      setUnsoldNotification(notif);
      const timer = setTimeout(() => {
        setUnsoldNotification(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const url = activeTournamentId
        ? `/api/auction/state?tournamentId=${encodeURIComponent(activeTournamentId)}`
        : '/api/auction/state';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.lastNotification) {
          handleNewNotification(json.lastNotification);
        }
        setData(json);
      }
    } catch {
      // Ignore background poll error
    }
  }, [activeTournamentId, handleNewNotification]);

  useEffect(() => {
    const timer = setInterval(fetchState, 1000);
    return () => clearInterval(timer);
  }, [fetchState]);

  // Reset manual override whenever server stage_view updates remotely from auctioneer
  const serverStageView = data?.state?.stage_view;
  const lastServerStageViewRef = useRef(serverStageView);
  useEffect(() => {
    if (serverStageView && serverStageView !== lastServerStageViewRef.current) {
      lastServerStageViewRef.current = serverStageView;
      setManualView(null);
    }
  }, [serverStageView]);

  // Auto-cycle between podium and top10 every 15 seconds if enabled
  useEffect(() => {
    if (!autoCycle) return;
    const cycleTimer = setInterval(() => {
      setManualView((prev) => (prev === 'top10' ? 'podium' : 'top10'));
    }, 15000);
    return () => clearInterval(cycleTimer);
  }, [autoCycle]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSwitchView = async (view) => {
    setManualView(view);
    try {
      await fetch('/api/auction/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_stage_view', view, tournamentId: activeTournamentId }),
      });
    } catch {
      // Local state change succeeds even if background sync errors
    }
  };

  const effectiveView = manualView || data?.state?.stage_view || 'podium';

  const activePlayer = data?.activePlayer;
  const highestTeam = data?.highestTeam;
  const state = data?.state || {};
  const currentBid = Number(state.current_highest_bid || 0);
  const basePrice = Number(activePlayer?.base_price || 1000);
  const teams = data?.teams || [];
  const currentTourn = tournament || data?.tournament;
  const backHubUrl = activeTournamentId ? `/auction/t/${activeTournamentId}` : '/auction';
  const consoleUrl = activeTournamentId ? `/auction/t/${activeTournamentId}/admin` : '/auction/admin';
  const streamUrl = activeTournamentId ? `/auction/t/${activeTournamentId}/stream` : '/auction/stream';

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column justify-content-between p-3 p-md-4 position-relative overflow-hidden">
      {/* Top Stage Header Bar — PURE BROADCAST GRAPHICS (ZERO BUTTONS / ZERO LINKS) */}
      <header className="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-25 gap-2" style={{ zIndex: 10 }}>
        <div className="d-flex align-items-center gap-3">
          <span className="badge badge-gold px-3 py-1.5 rounded-pill text-xs fw-black tracking-wide shadow-sm">
            {currentTourn?.sportConfig?.icon || '🏆'} {currentTourn?.season_year || '2026/27'}
          </span>
          <span className="fw-black fs-4 text-white tracking-tight">
            {currentTourn?.tournament_name || 'LIVE STAGE AUCTION'}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger text-white rounded-pill px-3 py-1 text-xs fw-black d-inline-flex align-items-center gap-2 shadow">
            <span className="spinner-grow spinner-grow-sm" style={{ width: 8, height: 8 }} role="status"></span>
            LIVE BROADCAST
          </span>
          <span className="badge bg-dark text-warning border border-warning border-opacity-30 rounded-pill px-2.5 py-1 text-xs font-monospace d-none d-md-inline">
            {effectiveView === 'top10' ? '🏆 TOP 10 LEADERBOARD' : effectiveView === 'pools' ? '🎰 TOURNAMENT POOL DRAW' : effectiveView === 'split' ? '⚡ SPLIT SCREEN' : '🎯 ACTIVE PODIUM'}
          </span>
        </div>
      </header>

      {/* Main Stage Display */}
      <main className="my-auto py-3 w-100" style={{ zIndex: 10 }}>
        <div key={effectiveView} className="broadcast-stage-container w-100">
          {effectiveView === 'top10' ? (
          /* FULL TOP 10 STAGE LEADERBOARD */
          <div className="w-100 animate-fadeIn">
            <Top10LiveScreen data={data} tournament={currentTourn} tournamentId={activeTournamentId} isBigScreen={true} />
          </div>
        ) : effectiveView === 'pools' ? (
          /* FULL TOURNAMENT POOL & WHEEL LOTTERY (ZERO CONTROLS BROADCAST) */
          <div className="w-100 animate-fadeIn">
            <TeamsPoolingWheel
              teams={teams}
              tournament={currentTourn}
              tournamentId={activeTournamentId}
              isAdmin={false}
              isBigScreen={true}
              state={data?.state}
            />
          </div>
        ) : effectiveView === 'split' ? (
          /* SPLIT SCREEN (Active Player Left 5-col + Top 10 Right 7-col) */
          <div className="row g-4 align-items-stretch animate-fadeIn">
            {/* Left: Active Player Card & Gavel */}
            <div className="col-12 col-xl-5 d-flex flex-column gap-3">
              <div className="auction-card p-3.5 auction-card-glow position-relative overflow-hidden flex-grow-1 text-center text-md-start">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <span className="badge bg-warning text-dark px-2.5 py-1 rounded-pill text-xs fw-black font-monospace shadow-sm border border-white border-opacity-40">
                    PLAYER #{activePlayer?.playerno || activePlayer?.lot_number || 1}
                  </span>
                  <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                    {activePlayer?.player_grade || 'Grade A'}
                  </span>
                  <span className={`badge px-2 py-0.5 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(activePlayer?.player_category)}`}>
                    {formatCategoryLabel(activePlayer?.player_category)}
                  </span>
                  <span className="ms-auto text-white-50 text-xs font-monospace">
                    Lot #{activePlayer?.lot_number || 1}
                  </span>
                </div>

                <div className="auction-portrait-frame mx-auto mb-2.5 shadow-lg position-relative" style={{ maxHeight: 240 }}>
                  {activePlayer && (
                    <div
                      className="position-absolute top-0 end-0 m-2 px-2.5 py-0.5 rounded-pill fw-black font-monospace shadow"
                      style={{
                        background: '#f59e0b',
                        color: '#000',
                        fontSize: '0.95rem',
                        border: '1.5px solid #fff',
                        zIndex: 5,
                      }}
                    >
                      #{activePlayer?.playerno || activePlayer?.lot_number || 1}
                    </div>
                  )}
                  {activePlayer?.photo_url ? (
                    <img src={activePlayer.photo_url} alt={activePlayer.full_name} />
                  ) : (
                    <div className="text-secondary text-center p-3 fs-1">🏐</div>
                  )}
                </div>

                <h2 className="fs-4 fw-extrabold text-white mb-1 tracking-tight">
                  {activePlayer ? activePlayer.full_name : 'Waiting for next player...'}
                </h2>

                {activePlayer && (
                  <div className="row g-2 pt-2 border-top border-secondary border-opacity-25 text-start text-xs">
                    <div className="col-6">
                      <span className="text-white-50 d-block">Position:</span>
                      <strong className="text-white text-capitalize">{formatPositionLabel(activePlayer.playing_position)}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-white-50 d-block">Base Price:</span>
                      <strong className="text-warning font-monospace" suppressHydrationWarning>₹{formatCurrency(basePrice)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Leading Bid Card */}
              <div className="auction-card p-3 auction-card-gold text-center position-relative">
                <div className="mb-2">
                  <span className={`hammer-pill hammer-stage-${state.hammer_stage || 0} px-3 py-1 text-xs`}>
                    {state.hammer_stage === 1 && '⚡ GOING ONCE...'}
                    {state.hammer_stage === 2 && '⚡⚡ GOING TWICE...'}
                    {state.hammer_stage === 3 && '🎉 SOLD!'}
                    {(!state.hammer_stage || state.hammer_stage === 0) && (currentBid > 0 ? 'PODIUM ACTIVE' : 'OPENING BID PENDING')}
                  </span>
                </div>

                <span className="text-white-50 text-uppercase fw-bold text-xs d-block mb-0.5">
                  Current Leading Bid
                </span>

                <div className="my-1">
                  <span className="fs-2 fw-black text-warning font-monospace" suppressHydrationWarning>
                    ₹{formatCurrency(currentBid)}
                  </span>
                </div>

                {highestTeam && (
                  <div className="p-2 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-30 d-inline-flex align-items-center gap-2 mt-2 px-3">
                    <span
                      className="badge px-2 py-1 rounded-pill text-xs fw-extrabold"
                      style={{ backgroundColor: highestTeam.primary_color || '#0d6efd', color: '#fff' }}
                    >
                      {highestTeam.team_code}
                    </span>
                    <strong className="text-white text-xs">{highestTeam.team_name}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Top 10 Screen */}
            <div className="col-12 col-xl-7">
              <Top10LiveScreen data={data} tournament={currentTourn} tournamentId={activeTournamentId} isBigScreen={true} />
            </div>
          </div>
        ) : (
          /* FULL PODIUM VIEW (Active Player Focus) */
          <div className="row g-4 align-items-center justify-content-center animate-fadeIn">
            {/* Left: Player Presentation Card */}
            <div className="col-12 col-md-5 col-xl-4 text-center text-md-start">
              <div className="auction-card p-4 auction-card-glow position-relative overflow-hidden">
                {/* Category Ribbon */}
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                  <span className="badge bg-warning text-dark px-3 py-1 rounded-pill text-xs fw-black font-monospace shadow-md border border-white border-opacity-40">
                    PLAYER NO. #{activePlayer?.playerno || activePlayer?.lot_number || 1}
                  </span>
                  <span className="badge badge-gold px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                    {activePlayer?.player_grade || 'Grade A'}
                  </span>
                  <span className={`badge px-2.5 py-1 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(activePlayer?.player_category)}`}>
                    {formatCategoryLabel(activePlayer?.player_category)}
                  </span>
                  <span className="ms-auto text-white-50 small font-monospace">
                    Lot #{activePlayer?.lot_number || 1}
                  </span>
                </div>

                {/* Portrait Frame */}
                <div className="auction-portrait-frame mx-auto mb-3 shadow-lg position-relative" style={{ maxHeight: 380 }}>
                  {activePlayer && (
                    <div
                      className="position-absolute top-0 end-0 m-3 px-3 py-1 rounded-pill fw-black font-monospace shadow-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#000',
                        fontSize: '1.35rem',
                        border: '2.5px solid #fff',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                        zIndex: 5,
                      }}
                    >
                      #{activePlayer?.playerno || activePlayer?.lot_number || 1}
                    </div>
                  )}
                  {activePlayer?.photo_url ? (
                    <img src={activePlayer.photo_url} alt={activePlayer.full_name} />
                  ) : (
                    <div className="text-secondary text-center p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Player Name */}
                <h2 className="display-6 fw-extrabold text-white mb-2 tracking-tight">
                  {activePlayer ? activePlayer.full_name : 'Waiting for next player...'}
                </h2>

                {/* Player Key Metrics */}
                {activePlayer && (
                  <div className="row g-2 pt-2 border-top border-secondary border-opacity-25 text-start small">
                    <div className="col-6">
                      <span className="text-white-50 text-xs d-block">Player Number:</span>
                      <strong className="text-warning fs-5 fw-black font-monospace">#{activePlayer?.playerno || activePlayer?.lot_number || 1}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-white-50 text-xs d-block">Position:</span>
                      <strong className="text-white text-capitalize fs-6">{formatPositionLabel(activePlayer.playing_position)}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-white-50 text-xs d-block">Height:</span>
                      <strong className="text-white fs-6">{activePlayer.height_cm ? `${activePlayer.height_cm} cm` : '—'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-white-50 text-xs d-block">Club / Team:</span>
                      <strong className="text-white text-truncate d-block">{activePlayer.team_name || 'Palghar'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-white-50 text-xs d-block">Base Price:</span>
                      <strong className="text-warning fs-6" suppressHydrationWarning>₹{formatCurrency(basePrice)}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Big Current Bid & Team Showcase */}
            <div className="col-12 col-md-7 col-xl-6">
              <div className="auction-card p-4 p-md-5 auction-card-gold text-center position-relative">
                {/* Gavel Stage Pulsing Banner */}
                <div className="mb-4">
                  <span className={`hammer-pill hammer-stage-${state.hammer_stage || 0} px-4 py-2 fs-6`}>
                    {state.hammer_stage === 1 && '⚡ GOING ONCE...'}
                    {state.hammer_stage === 2 && '⚡⚡ GOING TWICE...'}
                    {state.hammer_stage === 3 && '🎉 SOLD!'}
                    {(!state.hammer_stage || state.hammer_stage === 0) && (currentBid > 0 ? 'PODIUM ACTIVE' : 'OPENING BID PENDING')}
                  </span>
                </div>

                {/* Price Label */}
                <span className="text-white-50 text-uppercase fw-bold small d-block mb-1" style={{ letterSpacing: '0.12em' }}>
                  Current Leading Bid
                </span>

                {/* Giant Price */}
                <div className="my-2">
                  <span className="auction-giant-price" suppressHydrationWarning>
                    ₹{formatCurrency(currentBid)}
                  </span>
                </div>

                {/* Leading Team Card */}
                <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
                  {highestTeam ? (
                    <div className="p-3.5 rounded-4 bg-black bg-opacity-35 border border-secondary border-opacity-30 d-inline-flex flex-column align-items-center gap-2 px-5 shadow-sm">
                      <div className="d-flex align-items-center gap-2.5">
                        <span
                          className="badge px-3 py-1.5 rounded-pill fs-6 fw-extrabold shadow-sm"
                          style={{ backgroundColor: highestTeam.primary_color || '#0d6efd', color: '#fff' }}
                        >
                          {highestTeam.team_code}
                        </span>
                        <h3 className="h4 fw-bold text-white mb-0">{highestTeam.team_name}</h3>
                      </div>
                      {highestTeam.owner_name && (
                        <span className="text-white-50 small">Owner: {highestTeam.owner_name}</span>
                      )}
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill text-xs fw-bold">
                        HIGHEST LEAD BIDDER
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 text-white-50 fst-italic" suppressHydrationWarning>
                      Waiting for opening paddle raise at base price of ₹{formatCurrency(basePrice)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Bottom Scrolling Marquee Ticker */}
      <footer className="ticker-wrap mt-auto">
        <div className="ticker-content small fw-semibold text-white">
          <span className="text-warning">★ PALGHAR DISTRICT VOLLEYBALL LEAGUE 2026/27 OFFICIAL AUCTION ★</span>
          <span className="mx-4 text-white-50">•</span>
          <span>Active Teams: {teams.map((t) => t.team_code).join(', ')}</span>
          <span className="mx-4 text-white-50">•</span>
          <span className="text-info">{state.last_action || 'Bidding underway'}</span>
          <span className="mx-4 text-white-50">•</span>
          <span>Organized by Olympic Vision Sports & Event Management</span>
          <span className="mx-4 text-white-50">•</span>
          <span className="text-success">Official Platform by Technocyte</span>
          <span className="mx-4 text-white-50">•</span>
        </div>
      </footer>

      {/* SOLD CELEBRATION MODAL OVERLAY */}
      {soldOverlay && (
        <div className="sold-celebration-overlay">
          {/* Confetti Particles */}
          <div className="confetti-container">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="confetti-dot"
                style={{
                  left: `${(i * 3.1) % 100}%`,
                  animationDelay: `${(i * 0.15) % 2.5}s`,
                  backgroundColor: ['#f59e0b', '#06b6d4', '#10b981', '#ec4899', '#f97316', '#a855f7'][i % 6],
                  transform: `scale(${0.7 + (i % 5) * 0.15})`,
                }}
              />
            ))}
          </div>

          <div className="celebration-box">
            <div className="fs-1 mb-1">🎉 🔨 🎉</div>
            <h1 className="sold-headline-glow">
              SOLD!
            </h1>

            {/* Exact requested format: "[Player Name] sold to [Team Name] at ₹[Price]" */}
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3 p-3 my-3 rounded-4 bg-black bg-opacity-40 border border-warning border-opacity-40 text-start">
              {(soldOverlay.photoUrl || soldOverlay.photo_url) && (
                <div
                  className="rounded-3 overflow-hidden border border-warning shadow-lg flex-shrink-0"
                  style={{ width: 84, height: 102 }}
                >
                  <img
                    src={soldOverlay.photoUrl || soldOverlay.photo_url}
                    alt={soldOverlay.playerName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <h3 className="fs-3 fw-extrabold text-white mb-0 text-break leading-snug">
                <span className="text-warning">{soldOverlay.playerName}</span> sold to{' '}
                <span className="text-info">{soldOverlay.teamName}</span> at{' '}
                <span className="text-warning" suppressHydrationWarning>₹{formatCurrency(soldOverlay.price || soldOverlay.amount || 0)}</span>
              </h3>
            </div>

            {/* Visual breakdown badge row */}
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-3 mt-3 mb-4">
              <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-dark border border-secondary border-opacity-40 text-xs">
                <span className="text-white-50">Lot:</span>
                <strong className="text-white">#{soldOverlay.lotNumber || 1}</strong>
                {soldOverlay.playerGrade && (
                  <span className="badge badge-gold px-2 py-0.5 rounded-pill">{soldOverlay.playerGrade}</span>
                )}
              </div>

              <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-dark border border-secondary border-opacity-40 text-xs">
                <span
                  className="rounded-circle d-inline-block"
                  style={{ width: 12, height: 12, backgroundColor: soldOverlay.teamColor || '#0d6efd' }}
                ></span>
                <span className="text-white-50">Acquired By:</span>
                <strong className="text-white">{soldOverlay.teamName}</strong>
              </div>
            </div>

            
          </div>
        </div>
      )}

      {/* UNSOLD NOTIFICATION BANNER / MODAL */}
      {unsoldNotification && (
        <div className="unsold-overlay-card text-center shadow-2xl">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="badge bg-danger text-white px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase shadow-sm">
              🛑 HAMMER PASSED • UNSOLD
            </span>
            
          </div>
          <div className="d-flex align-items-center justify-content-center gap-3 my-2">
            {(unsoldNotification.photo_url || unsoldNotification.photoUrl || unsoldNotification.playerImage) && (
              <img
                src={unsoldNotification.photo_url || unsoldNotification.photoUrl || unsoldNotification.playerImage}
                alt={unsoldNotification.playerName || 'Player'}
                className="rounded-3 border border-danger border-opacity-60 shadow-sm object-fit-cover"
                style={{ width: 56, height: 68 }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="text-start">
              <h4 className="fw-black text-danger mb-1 fs-5">
                {unsoldNotification.playerName || 'Player Lot Unsold'}
              </h4>
              <p className="text-white-50 text-xs mb-0">
                {unsoldNotification.message}
              </p>
            </div>
          </div>
          <span className="text-white-50 text-xs d-block mt-2">
            Player lot will remain eligible for re-introduction in unsold round 2.
          </span>
        </div>
      )}
    </div>
  );
}
