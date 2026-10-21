'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activePlayer = data?.activePlayer;
  const highestTeam = data?.highestTeam;
  const state = data?.state || {};
  const currentBid = Number(state.current_highest_bid || 0);
  const basePrice = Number(activePlayer?.base_price || 1000);
  const teams = data?.teams || [];
  const currentTourn = tournament || data?.tournament;
  const backHubUrl = activeTournamentId ? `/auction/t/${activeTournamentId}` : '/auction';
  const consoleUrl = activeTournamentId ? `/auction/t/${activeTournamentId}/admin` : '/auction/admin';

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column justify-content-between p-3 p-md-4 position-relative overflow-hidden">
      {/* Top Stage Header Bar */}
      <header className="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-25" style={{ zIndex: 10 }}>
        <div className="d-flex align-items-center gap-3">
          <Link href={backHubUrl} className="text-decoration-none d-flex align-items-center gap-2">
            <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs">
              {currentTourn?.sportConfig?.icon || '🏆'} {currentTourn?.season_year || '2026/27'}
            </span>
            <span className="fw-extrabold fs-5 text-white tracking-tight">
              {currentTourn?.tournament_name || 'LIVE STAGE AUCTION'}
            </span>
          </Link>
          <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 text-xs fw-bold d-none d-sm-inline-flex align-items-center gap-1.5 shadow-sm">
            <span className="spinner-grow spinner-grow-sm" style={{ width: 8, height: 8 }} role="status"></span>
            LIVE ON STAGE
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 text-xs fw-bold d-inline-flex align-items-center gap-1.5"
            onClick={toggleFullscreen}
          >
            <span>{isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen Stage'}</span>
          </button>
          <Link href={consoleUrl} className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1.5 text-xs">
            Console ↗
          </Link>
        </div>
      </header>

      {/* Main Stage Podium */}
      <main className="my-auto py-3" style={{ zIndex: 10 }}>
        <div className="row g-4 align-items-center justify-content-center">
          {/* Left: Player Presentation Card */}
          <div className="col-12 col-md-5 col-xl-4 text-center text-md-start">
            <div className="auction-card p-4 auction-card-glow position-relative overflow-hidden">
              {/* Category Ribbon */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="badge badge-gold px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                  {activePlayer?.player_grade || 'Grade A'}
                </span>
                <span className="badge badge-cyan px-2.5 py-1 rounded-pill text-xs text-capitalize">
                  {activePlayer?.player_category?.replace('_', ' ') || 'Palghar Open'}
                </span>
                <span className="ms-auto text-white-50 small font-monospace">
                  Lot #{activePlayer?.lot_number || 1}
                </span>
              </div>

              {/* Portrait Frame */}
              <div className="auction-portrait-frame mx-auto mb-3 shadow-lg" style={{ maxHeight: 380 }}>
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
                    <span className="text-white-50 text-xs d-block">Position:</span>
                    <strong className="text-white text-capitalize fs-6">{activePlayer.playing_position?.replace('_', ' ')}</strong>
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
                    <strong className="text-warning fs-6">₹{basePrice.toLocaleString()}</strong>
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
                <span className="auction-giant-price">
                  ₹{currentBid.toLocaleString()}
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
                  <div className="p-4 text-white-50 fst-italic">
                    Waiting for opening paddle raise at base price of ₹{basePrice.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
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
            <div className="p-3 my-3 rounded-4 bg-black bg-opacity-40 border border-warning border-opacity-40">
              <h3 className="fs-3 fw-extrabold text-white mb-0 text-break leading-snug">
                <span className="text-warning">{soldOverlay.playerName}</span> sold to{' '}
                <span className="text-info">{soldOverlay.teamName}</span> at{' '}
                <span className="text-warning">₹{Number(soldOverlay.price || 0).toLocaleString()}</span>
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

            <div className="d-flex align-items-center justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-outline-warning rounded-pill px-4 py-2 text-xs fw-bold"
                onClick={() => setSoldOverlay(null)}
              >
                Continue Stage Display ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSOLD NOTIFICATION BANNER / MODAL */}
      {unsoldNotification && (
        <div className="unsold-overlay-card text-center">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="badge bg-warning text-dark px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
              ⚠️ UNSOLD NOTIFICATION
            </span>
            <button
              type="button"
              className="btn-close btn-close-white small"
              onClick={() => setUnsoldNotification(null)}
              aria-label="Close"
            ></button>
          </div>
          <h4 className="fw-bold text-white mb-2 fs-5">
            {unsoldNotification.message}
          </h4>
          <span className="text-white-50 small">
            Player lot will remain eligible for re-introduction in the unsold round.
          </span>
        </div>
      )}
    </div>
  );
}
