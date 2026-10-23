'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  formatCategoryLabel,
  getCategoryBadgeClass,
  formatCurrency,
  formatPositionLabel,
} from '@/lib/sports-config';

// Synthesize celebration fanfare using standard Web Audio API
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
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + idx * 0.11 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.11);
      osc.stop(ctx.currentTime + idx * 0.11 + 0.45);
    });
  } catch {
    // Audio permissions gracefully handled
  }
}

// Synthesize physical wooden gavel strike sound on hammer call
function playGavelStrikeSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // Audio permissions gracefully handled
  }
}

// Parse any YouTube link or ID to a standard 11-char Video ID or embed URL
function extractYouTubeEmbedUrl(input, isMuted = false) {
  if (!input) return null;
  const str = String(input).trim();

  let videoId = null;

  // Direct 11-char ID (e.g. dQw4w9WgXcQ)
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    videoId = str;
  } else {
    // Match watch?v=, youtu.be/, embed/, or live/
    const match = str.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    if (match && match[1]) {
      videoId = match[1];
    }
  }

  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
  }

  if (str.includes('youtube.com/embed/')) {
    return `${str}${str.includes('?') ? '&' : '?'}autoplay=1&mute=${isMuted ? 1 : 0}&rel=0`;
  }

  return null;
}

export default function YouTubeLiveAuctionStream({
  initialData,
  tournament = null,
  tournamentId: propTournamentId,
  role = 'admin',
  isAdmin = false,
  loggedTeam = null,
}) {
  const activeTournamentId = propTournamentId || tournament?.id || tournament?.slug;
  const [data, setData] = useState(initialData || {});
  const [layoutMode, setLayoutMode] = useState('split'); // 'split' (IPL Studio L-Band) | 'theater' | 'pip' | 'obs'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Segmented tab on the right side: 'player' (Dossier) | 'purse' (Tower) | 'bids' (Stream)
  const [sidebarTab, setSidebarTab] = useState('player');
  // Broadcast floating player bug overlay over the video
  const [showVideoPlayerBug, setShowVideoPlayerBug] = useState(true);
  const [bugMinimized, setBugMinimized] = useState(false);

  // Admin in-stream quick action state
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminSelectedTeamId, setAdminSelectedTeamId] = useState('');
  const [adminActionFeedback, setAdminActionFeedback] = useState('');

  // YouTube live stream URL
  const initialUrl =
    tournament?.youtube_live_url || initialData?.youtubeLiveUrl || initialData?.tournament?.youtube_live_url || '';
  const [streamUrl, setStreamUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Notifications & celebrations
  const [soldOverlay, setSoldOverlay] = useState(null);
  const [unsoldNotification, setUnsoldNotification] = useState(null);
  const lastNotifIdRef = useRef(initialData?.lastNotification?.id || null);
  const lastHammerStageRef = useRef(initialData?.state?.hammer_stage || 0);

  const handleNewNotification = useCallback(
    (notif) => {
      if (!notif || notif.id === lastNotifIdRef.current) return;
      lastNotifIdRef.current = notif.id;

      if (notif.type === 'sold') {
        setSoldOverlay(notif);
        if (soundEnabled) playFanfareSound();
        const timer = setTimeout(() => {
          setSoldOverlay(null);
        }, 8500);
        return () => clearTimeout(timer);
      } else if (notif.type === 'unsold') {
        setUnsoldNotification(notif);
        const timer = setTimeout(() => {
          setUnsoldNotification(null);
        }, 5500);
        return () => clearTimeout(timer);
      }
    },
    [soundEnabled]
  );

  // Poll live auction state every 1 second
  const fetchLiveState = useCallback(async () => {
    try {
      const url = activeTournamentId
        ? `/api/auction/state?tournamentId=${encodeURIComponent(activeTournamentId)}`
        : '/api/auction/state';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();

        // Sound effect on gavel strike progression (Going Once -> Going Twice -> Fair Warning)
        const currentStage = json?.state?.hammer_stage || 0;
        if (currentStage > 0 && currentStage !== lastHammerStageRef.current) {
          lastHammerStageRef.current = currentStage;
          if (soundEnabled) playGavelStrikeSound();
        } else {
          lastHammerStageRef.current = currentStage;
        }

        if (json.lastNotification) {
          handleNewNotification(json.lastNotification);
        }
        setData(json);

        // Sync YouTube Live URL if updated in tournament database
        if (json.youtubeLiveUrl && json.youtubeLiveUrl !== streamUrl) {
          setStreamUrl(json.youtubeLiveUrl);
          setInputUrl(json.youtubeLiveUrl);
        }
      }
    } catch {
      // Silently retry next second
    }
  }, [activeTournamentId, handleNewNotification, soundEnabled, streamUrl]);

  useEffect(() => {
    const timer = setInterval(fetchLiveState, 1000);
    return () => clearInterval(timer);
  }, [fetchLiveState]);

  // Fullscreen toggler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  };

  // Save YouTube Live URL to tournament
  const handleSaveStreamUrl = async (e) => {
    e?.preventDefault();
    setIsSavingUrl(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/auction/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          tournamentId: activeTournamentId,
          youtube_live_url: inputUrl.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setStreamUrl(inputUrl.trim());
        setSaveMessage('✅ Live Stream URL updated successfully!');
        setTimeout(() => {
          setShowSettingsModal(false);
          setSaveMessage('');
        }, 1500);
      } else {
        setSaveMessage(`❌ ${json.error || 'Failed to update stream URL'}`);
      }
    } catch (err) {
      setSaveMessage(`❌ ${err.message || 'Network error'}`);
    } finally {
      setIsSavingUrl(false);
    }
  };

  // Resolved embed URL
  const embedUrl = useMemo(() => {
    return extractYouTubeEmbedUrl(streamUrl, isMuted);
  }, [streamUrl, isMuted]);

  // Derived state values
  const currentTourn = tournament || data?.tournament;
  const activePlayer = data?.activePlayer;
  const highestTeam = data?.highestTeam;
  const state = data?.state || {};
  const currentBid = Number(state.current_highest_bid || 0);
  const basePrice = Number(activePlayer?.base_price || 1000);
  const minIncrement = Number(currentTourn?.min_bid_increment || 500);
  const nextMinBid = currentBid > 0 ? currentBid + minIncrement : basePrice;
  const teams = data?.teams || [];
  const recentBids = data?.recentBids || [];
  const hammerStage = state.hammer_stage || 0;

  // Auto-select first team for admin quick-bidding if none selected
  useEffect(() => {
    if (!adminSelectedTeamId && teams.length > 0) {
      setAdminSelectedTeamId(teams[0].id);
    }
  }, [teams, adminSelectedTeamId]);

  // Admin Quick Bid execution right from the live stream view
  const handleAdminQuickBid = async (teamId) => {
    const targetTeamId = teamId || adminSelectedTeamId;
    if (!targetTeamId || !activePlayer) return;
    setAdminActionLoading(true);
    setAdminActionFeedback('');
    try {
      const res = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: targetTeamId,
          bidAmount: nextMinBid,
          tournamentId: activeTournamentId,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setAdminActionFeedback(`✅ Bid ₹${formatCurrency(nextMinBid)} placed!`);
        fetchLiveState();
        setTimeout(() => setAdminActionFeedback(''), 2500);
      } else {
        setAdminActionFeedback(`❌ ${json.error || 'Bid failed'}`);
      }
    } catch (err) {
      setAdminActionFeedback(`❌ ${err.message || 'Error'}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Admin Hammer Stage Progression
  const handleAdminHammerAction = async (action, stageVal = null) => {
    setAdminActionLoading(true);
    setAdminActionFeedback('');
    try {
      const payload = {
        action,
        tournamentId: activeTournamentId,
      };
      if (stageVal !== null) {
        payload.stage = stageVal;
      }
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setAdminActionFeedback(`✅ Gavel updated: ${action}`);
        fetchLiveState();
        setTimeout(() => setAdminActionFeedback(''), 2500);
      } else {
        setAdminActionFeedback(`❌ ${json.error || 'Hammer action failed'}`);
      }
    } catch (err) {
      setAdminActionFeedback(`❌ ${err.message || 'Error'}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Real IPL / Football Bidding War calculation (between top 2 competing teams)
  const biddingWar = useMemo(() => {
    if (!activePlayer || recentBids.length < 2) return null;
    const distinctTeams = [];
    for (const b of recentBids) {
      if (!distinctTeams.find((x) => String(x.team_id) === String(b.team_id))) {
        distinctTeams.push(b);
      }
      if (distinctTeams.length === 2) break;
    }
    if (distinctTeams.length === 2 && currentBid > basePrice) {
      return {
        leader: distinctTeams[0],
        challenger: distinctTeams[1],
      };
    }
    return null;
  }, [activePlayer, recentBids, currentBid, basePrice]);

  // Hammer call styling
  const hammerConfig = useMemo(() => {
    switch (hammerStage) {
      case 1:
        return {
          label: '🔨 GOING ONCE...',
          subLabel: 'First Gavel Call',
          badgeClass: 'badge-gold',
          borderGlow: 'rgba(245, 158, 11, 0.95)',
          pulseColor: '#f59e0b',
        };
      case 2:
        return {
          label: '🔨🔨 GOING TWICE...',
          subLabel: 'Second Gavel Call',
          badgeClass: 'bg-warning text-dark',
          borderGlow: 'rgba(249, 115, 22, 0.95)',
          pulseColor: '#f97316',
        };
      case 3:
        return {
          label: '🚨 FAIR WARNING! HAMMER FALLING!',
          subLabel: 'Final Call Before Sale',
          badgeClass: 'bg-danger text-white',
          borderGlow: 'rgba(239, 68, 68, 1)',
          pulseColor: '#ef4444',
        };
      default:
        return {
          label: activePlayer ? '🟢 BIDDING IN PROGRESS' : '⏳ STANDBY FOR NEXT LOT',
          subLabel: activePlayer ? 'Paddles Active' : 'Podium Ready',
          badgeClass: activePlayer ? 'badge-emerald' : 'badge-cyan',
          borderGlow: 'rgba(16, 185, 129, 0.65)',
          pulseColor: '#10b981',
        };
    }
  }, [hammerStage, activePlayer]);

  const backHubUrl = activeTournamentId ? `/auction/t/${activeTournamentId}` : '/auction';

  // Helper function to render player avatar/photo safely without image breaking errors
  const renderPlayerAvatar = (photoUrl, name, size = 88, borderColor = '#06b6d4') => {
    const initial = (name || 'P').trim().charAt(0).toUpperCase();
    return (
      <div
        className="player-portrait-halo flex-shrink-0 d-flex align-items-center justify-content-center position-relative shadow-2xl"
        style={{
          width: size,
          height: size,
          border: `2.5px solid ${borderColor}`,
          backgroundColor: '#040918',
          boxShadow: `0 0 35px ${borderColor}66`,
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name || 'Player'}
            className="w-100 h-100 object-fit-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white fw-black"
          style={{
            display: photoUrl ? 'none' : 'flex',
            background: 'linear-gradient(135deg, #1e293b 0%, #0a1128 100%)',
            fontSize: size * 0.42,
          }}
        >
          <span>{initial}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`broadcast-shell min-vh-100 d-flex flex-column ${layoutMode === 'obs' ? 'broadcast-obs-view' : ''
        }`}
      data-bs-theme="dark"
      style={{
        background:
          layoutMode === 'obs'
            ? 'transparent'
            : 'radial-gradient(ellipse at 50% 0%, #0a1128 0%, #030712 100%)',
      }}
    >
      {/* ──────────────────────────────────────────────────────────── */}
      {/* TOP BROADCAST SCOREBUG & TV HEADER (Hidden in OBS Mode)     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {layoutMode !== 'obs' && (
        <header
          className="border-bottom py-2 px-3 px-md-4 d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-2xl"
          style={{
            background: 'rgba(3, 7, 18, 0.96)',
            backdropFilter: 'blur(16px)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            zIndex: 1040,
          }}
        >
          {/* Left: TV Channel Watermark & Mega Auction Bug */}
          <div className="d-flex align-items-center gap-2.5">
            <Link
              href={backHubUrl}
              className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 text-xs text-white-50 hover-text-white d-inline-flex align-items-center gap-1"
            >
              <span>←</span>
              <span className="d-none d-sm-inline">Console Hub</span>
            </Link>

            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger shadow"
              style={{ boxShadow: '0 0 18px rgba(239,68,68,0.55)' }}
            >
              <span className="broadcast-live-dot" />
              <span className="fw-black text-white text-xs tracking-wider text-uppercase">
                LIVE MEGA AUCTION
              </span>
            </div>

            {currentTourn && (
              <div className="d-none d-md-flex align-items-center gap-2 ms-1">
                <span className="text-secondary small">|</span>
                <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold text-truncate" style={{ maxWidth: 300 }}>
                  {currentTourn.sportConfig?.icon || '🏆'} {currentTourn.tournament_name}
                </span>
                <span className="text-white-50 text-xs">
                  Season {currentTourn.season_year || '2026/27'}
                </span>
              </div>
            )}
          </div>

          {/* Right: Studio Production Controls */}
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {/* TV Layout Modes (IPL Studio vs Theater vs PiP vs OBS) */}
            <div className="btn-group btn-group-sm bg-dark rounded-pill p-0.5 border border-secondary border-opacity-30 shadow-sm">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1 text-xs fw-black ${layoutMode === 'split' ? 'btn-warning text-dark shadow-sm' : 'text-white-50'
                  }`}
                onClick={() => setLayoutMode('split')}
                title="Real Broadcast Studio: Live Shooting Video with L-Band Bid Bar & Player Dossier"
              >
                📺 Real TV Studio
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold ${layoutMode === 'theater' ? 'btn-info text-dark shadow-sm' : 'text-white-50'
                  }`}
                onClick={() => setLayoutMode('theater')}
                title="Cinema / Theater: Full Camera with Floating Broadcast HUD"
              >
                🎭 Cinema HUD
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold ${layoutMode === 'pip' ? 'btn-info text-dark shadow-sm' : 'text-white-50'
                  }`}
                onClick={() => setLayoutMode('pip')}
                title="Stage + Camera Inset"
              >
                🖼️ Stage + PiP
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold ${layoutMode === 'obs' ? 'btn-success text-dark shadow-sm' : 'text-white-50'
                  }`}
                onClick={() => setLayoutMode('obs')}
                title="OBS Studio / vMix Transparent Lower-Third Overlay"
              >
                📡 OBS Overlay
              </button>
            </div>

            {/* Toggle On-Screen Player Bug on Video */}
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold border ${showVideoPlayerBug
                ? 'btn-outline-info text-info border-info border-opacity-50'
                : 'btn-outline-secondary text-white-50 border-secondary border-opacity-30'
                }`}
              onClick={() => setShowVideoPlayerBug(!showVideoPlayerBug)}
              title={showVideoPlayerBug ? 'On-screen player graphic active' : 'On-screen player graphic hidden'}
            >
              👤 {showVideoPlayerBug ? 'Player Bug ON' : 'Player Bug OFF'}
            </button>

            {/* Sound FX Toggle (Fanfare + Gavel Strike) */}
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold border ${soundEnabled
                ? 'btn-outline-warning text-warning border-warning border-opacity-50'
                : 'btn-outline-secondary text-white-50 border-secondary border-opacity-30'
                }`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Broadcast sound effects active' : 'Sound effects muted'}
            >
              {soundEnabled ? '🔔 SFX ON' : '🔕 SFX OFF'}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              className="btn btn-sm btn-outline-light rounded-pill px-2.5 py-1 text-xs text-white"
              onClick={toggleFullscreen}
              title="Fullscreen Display for Arena LED Screens"
            >
              {isFullscreen ? '⤓ Normal' : '⛶ Fullscreen'}
            </button>

            {/* Stream Settings */}
            <button
              type="button"
              className="btn btn-sm btn-info text-dark rounded-pill px-3 py-1 text-xs fw-extrabold shadow-sm d-inline-flex align-items-center gap-1"
              onClick={() => setShowSettingsModal(true)}
              title="Configure YouTube Live Stream link"
            >
              <span>⚙️</span>
              <span className="d-none d-sm-inline">Live Stream Setup</span>
            </button>
          </div>
        </header>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CELEBRATION SPLASH BANNER (OFFICIAL TELEVISION SALE MOMENT)  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {soldOverlay && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 9999,
            background: 'radial-gradient(circle, rgba(0,0,0,0.92) 0%, rgba(3,7,18,0.99) 100%)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={() => setSoldOverlay(null)}
        >
          <div
            className="auction-card p-4 p-md-5 text-center shadow-2xl position-relative overflow-hidden"
            style={{
              maxWidth: 720,
              width: '100%',
              borderColor: 'rgba(245, 158, 11, 0.95)',
              boxShadow: '0 0 120px rgba(245, 158, 11, 0.7), 0 35px 90px rgba(0,0,0,0.98)',
              background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.3) 0%, rgba(11, 18, 33, 0.99) 100%)',
            }}
          >
            <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
              <div className="display-1">🏆</div>
              {renderPlayerAvatar(
                soldOverlay.photo_url || soldOverlay.photoUrl || activePlayer?.photo_url,
                soldOverlay.playerName || 'Player',
                110,
                '#f59e0b'
              )}
            </div>

            <span className="badge badge-gold px-4 py-2 rounded-pill text-xs fw-black tracking-widest text-uppercase mb-3 shadow-lg">
              ★ OFFICIAL TELEVISION SALE CONFIRMED ★
            </span>

            <h1 className="display-5 fw-black text-white mt-1 mb-2 tracking-tight">
              {soldOverlay.playerName || 'Player'}
            </h1>

            <div className="d-inline-flex align-items-center gap-2.5 px-4 py-2 rounded-pill bg-black bg-opacity-70 border border-warning border-opacity-60 mb-3 shadow">
              <span className="text-white-50 text-sm">ACQUIRED BY:</span>
              <strong className="text-warning fs-4 fw-black">
                {soldOverlay.teamName || 'Franchise Team'}
              </strong>
            </div>

            <div className="auction-giant-price mb-3" suppressHydrationWarning>
              ₹{formatCurrency(soldOverlay.amount || 0)}
            </div>

            <p className="text-white-50 text-xs mb-0">
              Hammer Gavel Struck • Official Roster Allocation Recorded
            </p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* UNSOLD NOTICE SPLASH BANNER                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {unsoldNotification && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
          }}
          onClick={() => setUnsoldNotification(null)}
        >
          <div
            className="auction-card p-4 text-center shadow-2xl"
            style={{ maxWidth: 500, borderColor: '#ef4444' }}
          >
            <div className="fs-1 mb-2">🔨</div>
            <span className="badge bg-danger text-white px-3 py-1 rounded-pill text-xs fw-bold text-uppercase mb-2">
              LOT DECLARED UNSOLD
            </span>
            <h3 className="fw-black text-white mb-2">{unsoldNotification.playerName || 'Player'}</h3>
            <p className="text-white-50 text-xs mb-0">
              No franchise bids placed at base price of ₹{formatCurrency(unsoldNotification.basePrice || 0)}. Player moved to Unsold Recall Pool.
            </p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN BROADCAST ARENA BY LAYOUT MODE                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <main className="flex-grow-1 p-2 p-md-3 d-flex flex-column justify-content-between">
        {/* ============================================================ */}
        {/* MODE 1: OFFICIAL IPL / TV BROADCAST (STUDIO L-BAND)          */}
        {/* ============================================================ */}
        {layoutMode === 'split' && (
          <div className="container-fluid px-1 px-md-2 flex-grow-1 d-flex flex-column">
            {/* TOP ROW: REAL CAMERA SHOOTING FEED (LEFT) + RIGHT PANEL (DOSSIER / PURSE TOWER) */}
            <div className="row g-2.5 flex-grow-1 align-items-stretch">
              {/* LEFT: THE LIVE SHOOTING CAMERA ARENA */}
              <div className="col-12 col-xl-8 col-xxl-9 d-flex flex-column">
                <div
                  className="broadcast-hud-card p-2.5 p-md-3 flex-grow-1 d-flex flex-column justify-content-between shadow-2xl position-relative overflow-hidden"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: '#040814',
                  }}
                >
                  {/* Real-world TV Broadcast Upper Strip */}
                  <div className="d-flex align-items-center justify-content-between mb-2 px-1">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-danger text-white rounded-pill text-xs fw-black px-2.5 py-1 shadow-sm d-inline-flex align-items-center gap-1.5">
                        <span className="broadcast-live-dot" />
                        <span>CAMERA 1 • MAIN STAGE &amp; PODIUM</span>
                      </span>
                      <span className="text-white-50 text-xs d-none d-sm-inline">
                        Real-time live shooting stream
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {/* Set / Category Classification Tag */}
                      <span className="badge bg-dark border border-secondary border-opacity-40 text-info px-2.5 py-1 rounded-pill text-xs fw-bold font-monospace">
                        {activePlayer?.player_category
                          ? `SET: ${formatCategoryLabel(activePlayer.player_category).toUpperCase()}`
                          : 'AUCTION LOT SET'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-0.5 text-xs fw-bold"
                        onClick={() => setIsMuted(!isMuted)}
                        title={isMuted ? 'Unmute stream' : 'Mute stream'}
                      >
                        {isMuted ? '🔇 Audio Muted' : '🔊 Live Audio'}
                      </button>
                    </div>
                  </div>

                  {/* 16:9 YouTube Camera Video Player Container with On-Screen Player Bug */}
                  <div className="broadcast-video-wrapper flex-grow-1 position-relative">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title="Live Auction Shooting Feed"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="broadcast-standby-screen">
                        <div
                          className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow"
                          style={{
                            width: 84,
                            height: 84,
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '2px solid #ef4444',
                            boxShadow: '0 0 35px rgba(239, 68, 68, 0.4)',
                          }}
                        >
                          <span className="fs-1">🎥</span>
                        </div>
                        <h3 className="fw-black text-white mb-1">
                          Live Shooting Auction Broadcast Standby
                        </h3>
                        <p className="text-white-50 text-xs mb-3" style={{ maxWidth: 480 }}>
                          The real physical live auction shooting stream will display here. Connect your YouTube Live camera link to broadcast the auctioneer, gavel calls, and franchise bidding wars.
                        </p>
                        <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-info text-dark rounded-pill px-3 py-1.5 text-xs fw-extrabold shadow"
                            onClick={() => setShowSettingsModal(true)}
                          >
                            ⚙️ Set YouTube Live Stream URL
                          </button>
                          <a
                            href="https://www.youtube.com/@OlympicVisionIndia"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 text-xs fw-bold"
                          >
                            ▶ Olympic Vision YouTube
                          </a>
                        </div>
                      </div>
                    )}

                    {/* ──────────────────────────────────────────────────────────── */}
                    {/* ON-SCREEN BROADCAST PLAYER GRAPHIC OVERLAY (ON THE VIDEO)   */}
                    {/* ──────────────────────────────────────────────────────────── */}
                    {showVideoPlayerBug && activePlayer && (
                      <div
                        className={`broadcast-player-bug ${bugMinimized ? 'broadcast-player-bug-mini' : ''
                          }`}
                        style={{
                          borderColor: highestTeam?.primary_color || '#06b6d4',
                          boxShadow: `0 15px 35px rgba(0,0,0,0.85), 0 0 25px ${highestTeam?.primary_color || '#06b6d4'}44`,
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5 border-bottom border-secondary border-opacity-30 pb-1">
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="badge bg-danger rounded-circle p-1 d-inline-block" style={{ width: 8, height: 8 }} />
                            <span className="text-xs fw-black text-uppercase text-warning tracking-wider">
                              LOT #{activePlayer.lot_number || 1} • {hammerConfig.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-white-50 text-xs text-decoration-none"
                            onClick={() => setBugMinimized(!bugMinimized)}
                            title={bugMinimized ? 'Expand Player Details' : 'Minimize Bug'}
                          >
                            {bugMinimized ? 'Expand ↗' : '—'}
                          </button>
                        </div>

                        {bugMinimized ? (
                          <div className="d-flex align-items-center gap-2">
                            {renderPlayerAvatar(activePlayer.photo_url, activePlayer.full_name, 38, highestTeam?.primary_color || '#06b6d4')}
                            <div className="min-w-0">
                              <div className="fw-black text-white text-xs text-truncate">
                                {activePlayer.full_name}
                              </div>
                              <div className="text-warning fw-black text-xs font-monospace" suppressHydrationWarning>
                                ₹{formatCurrency(currentBid > 0 ? currentBid : basePrice)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-3">
                            {renderPlayerAvatar(activePlayer.photo_url, activePlayer.full_name, 68, highestTeam?.primary_color || '#06b6d4')}
                            <div className="min-w-0 flex-grow-1">
                              <h4 className="fw-black text-white text-sm mb-0 text-truncate tracking-tight">
                                {activePlayer.full_name}
                              </h4>
                              <div className="d-flex align-items-center gap-1 text-xs text-info fw-bold">
                                <span>{formatPositionLabel(activePlayer.playing_position)}</span>
                                <span>•</span>
                                <span className="text-white-50">{activePlayer.district || 'Palghar'}</span>
                              </div>

                              <div className="d-flex align-items-center justify-content-between mt-1 pt-1 border-top border-secondary border-opacity-20 text-xs">
                                <div>
                                  <span className="text-white-50 text-xs d-block">Leading:</span>
                                  <strong className="text-white text-truncate d-inline-block" style={{ maxWidth: 120 }}>
                                    {highestTeam?.team_code || 'No Bids'}
                                  </strong>
                                </div>
                                <div className="text-end">
                                  <span className="text-white-50 text-xs d-block">Current Bid:</span>
                                  <strong className="text-warning font-monospace fs-6 fw-black" suppressHydrationWarning>
                                    ₹{formatCurrency(currentBid > 0 ? currentBid : basePrice)}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: THE IPL MULTI-TAB HUB (PLAYER DOSSIER vs PURSE TOWER vs BIDS STREAM) */}
              <div className="col-12 col-xl-4 col-xxl-3 d-flex flex-column">
                <div
                  className="broadcast-hud-card p-3 flex-grow-1 d-flex flex-column shadow-2xl"
                  style={{
                    background: 'rgba(8, 14, 28, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  {/* Segmented Tab Bar */}
                  <div className="broadcast-tabs-nav mb-3">
                    <button
                      type="button"
                      className={`broadcast-tab-btn ${sidebarTab === 'player' ? 'active tab-gold' : ''}`}
                      onClick={() => setSidebarTab('player')}
                    >
                      <span>👤</span>
                      <span>Player Dossier</span>
                    </button>
                    <button
                      type="button"
                      className={`broadcast-tab-btn ${sidebarTab === 'purse' ? 'active' : ''}`}
                      onClick={() => setSidebarTab('purse')}
                    >
                      <span>🛡️</span>
                      <span>Purse Tower</span>
                    </button>
                    <button
                      type="button"
                      className={`broadcast-tab-btn ${sidebarTab === 'bids' ? 'active' : ''}`}
                      onClick={() => setSidebarTab('bids')}
                    >
                      <span>📜</span>
                      <span>Bids ({recentBids.length})</span>
                    </button>
                  </div>

                  {/* TAB 1: ACTIVE PLAYER DOSSIER CARD WITH COMPREHENSIVE DETAILS */}
                  {sidebarTab === 'player' && (
                    <div className="flex-grow-1 d-flex flex-column justify-content-between overflow-y-auto pe-1">
                      {activePlayer ? (
                        <>
                          <div>
                            {/* Player Photo Card with Glowing Halo */}
                            <div className="d-flex flex-column align-items-center text-center p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-30 mb-2.5">
                              {renderPlayerAvatar(
                                activePlayer.photo_url,
                                activePlayer.full_name,
                                115,
                                highestTeam?.primary_color || '#06b6d4'
                              )}

                              <div className="mt-2.5">
                                <div className="d-flex align-items-center justify-content-center gap-1.5 mb-1">
                                  <span className="badge badge-gold px-2.5 py-0.5 rounded-pill text-xs fw-extrabold text-uppercase">
                                    {activePlayer.player_grade || 'Grade A'}
                                  </span>
                                  <span className={`badge px-2 py-0.5 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(activePlayer.player_category)}`}>
                                    {formatCategoryLabel(activePlayer.player_category)}
                                  </span>
                                  <span className="badge bg-secondary bg-opacity-40 text-white-50 text-xs">
                                    LOT #{activePlayer.lot_number || 1}
                                  </span>
                                </div>

                                <h4 className="fw-black text-white mb-0 tracking-tight fs-5">
                                  {activePlayer.full_name}
                                </h4>

                                <span className="text-info fw-bold text-xs d-block mt-0.5">
                                  {formatPositionLabel(activePlayer.playing_position)}
                                </span>
                              </div>
                            </div>

                            {/* Player Physical Attributes & Profile Grid */}
                            <div className="p-2.5 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20 mb-2.5">
                              <span className="text-white-50 text-xs fw-bold text-uppercase d-block mb-1.5 tracking-wider">
                                📊 Player Dossier &amp; Vitals
                              </span>
                              <div className="row g-2 text-xs">
                                <div className="col-6">
                                  <span className="text-white-50 d-block">Height:</span>
                                  <strong className="text-white fs-6">
                                    {activePlayer.height_cm ? `${activePlayer.height_cm} cm` : '182 cm'}
                                  </strong>
                                </div>
                                <div className="col-6">
                                  <span className="text-white-50 d-block">Weight:</span>
                                  <strong className="text-white fs-6">
                                    {activePlayer.weight_kg ? `${activePlayer.weight_kg} kg` : '74 kg'}
                                  </strong>
                                </div>
                                <div className="col-6">
                                  <span className="text-white-50 d-block">Home Club:</span>
                                  <strong className="text-white text-truncate d-block">
                                    {activePlayer.team_name || 'District Club'}
                                  </strong>
                                </div>
                                <div className="col-6">
                                  <span className="text-white-50 d-block">District:</span>
                                  <strong className="text-white">
                                    {activePlayer.district || 'Palghar'}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* Live Bidding Financials */}
                            <div className="p-2.5 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-20 mb-2.5">
                              <div className="d-flex align-items-center justify-content-between text-xs mb-1">
                                <span className="text-white-50">Base Price:</span>
                                <strong className="text-white" suppressHydrationWarning>
                                  ₹{formatCurrency(basePrice)}
                                </strong>
                              </div>
                              <div className="d-flex align-items-center justify-content-between text-xs mb-1">
                                <span className="text-white-50">Current Highest Bid:</span>
                                <strong className="text-warning fs-6 font-monospace fw-black" suppressHydrationWarning>
                                  ₹{formatCurrency(currentBid > 0 ? currentBid : basePrice)}
                                </strong>
                              </div>
                              <div className="d-flex align-items-center justify-content-between text-xs pt-1 border-top border-secondary border-opacity-20">
                                <span className="text-white-50">Next Minimum Raise:</span>
                                <span className="badge badge-emerald px-2 py-0.5 rounded-pill text-xs fw-black" suppressHydrationWarning>
                                  ₹{formatCurrency(nextMinBid)} (+₹{formatCurrency(minIncrement)})
                                </span>
                              </div>
                            </div>

                            {/* Leading Franchise Spotlight */}
                            <div
                              className="p-2.5 rounded-3 border transition-all"
                              style={{
                                background: highestTeam ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0,0,0,0.3)',
                                borderColor: highestTeam?.primary_color || 'rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              <span className="text-white-50 text-xs fw-bold text-uppercase d-block mb-1">
                                🛡️ Leading Franchise Paddle
                              </span>
                              {highestTeam ? (
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 min-w-0">
                                    <span
                                      className="rounded-circle d-inline-block flex-shrink-0 shadow-sm"
                                      style={{
                                        width: 22,
                                        height: 22,
                                        backgroundColor: highestTeam.primary_color || '#06b6d4',
                                        border: '2px solid #fff',
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <strong className="text-white text-xs d-block text-truncate">
                                        {highestTeam.team_name}
                                      </strong>
                                      <span className="text-white-50 text-xs">
                                        {highestTeam.team_code} {highestTeam.owner_name ? `• ${highestTeam.owner_name}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="badge bg-warning text-dark px-2 py-1 rounded-pill text-xs fw-black">
                                    LEAD
                                  </span>
                                </div>
                              ) : (
                                <div className="text-white-50 text-xs py-1">
                                  ✋ Awaiting opening paddle raise
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Admin In-Stream Quick Controls (if logged in as admin) */}
                          {isAdmin && (
                            <div className="mt-3 pt-2 border-top border-secondary border-opacity-30">
                              <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <span className="text-xs fw-black text-warning">
                                  🔨 Quick Auctioneer Controls
                                </span>
                                <Link
                                  href={`/auction/t/${activeTournamentId}/admin`}
                                  className="text-xs text-info text-decoration-none"
                                >
                                  Full Console ↗
                                </Link>
                              </div>

                              <div className="vstack gap-1.5">
                                <div className="d-flex gap-1.5">
                                  <select
                                    className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-40 text-xs py-1"
                                    value={adminSelectedTeamId}
                                    onChange={(e) => setAdminSelectedTeamId(e.target.value)}
                                  >
                                    {teams.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.team_code} - {t.team_name}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-warning text-dark fw-black px-3 text-xs shadow-sm"
                                    disabled={adminActionLoading}
                                    onClick={() => handleAdminQuickBid(adminSelectedTeamId)}
                                    title={`Place bid of ₹${formatCurrency(nextMinBid)}`}
                                  >
                                    Bid +₹{formatCurrency(minIncrement)}
                                  </button>
                                </div>

                                <div className="btn-group btn-group-sm w-100">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-warning text-xs fw-bold"
                                    disabled={adminActionLoading}
                                    onClick={() => handleAdminHammerAction('stage', 1)}
                                  >
                                    Once
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-warning text-xs fw-bold"
                                    disabled={adminActionLoading}
                                    onClick={() => handleAdminHammerAction('stage', 2)}
                                  >
                                    Twice
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger text-xs fw-bold"
                                    disabled={adminActionLoading}
                                    onClick={() => handleAdminHammerAction('stage', 3)}
                                  >
                                    Warning
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success text-dark text-xs fw-black"
                                    disabled={adminActionLoading || !highestTeam}
                                    onClick={() => handleAdminHammerAction('sold')}
                                  >
                                    SOLD 🏆
                                  </button>
                                </div>

                                {adminActionFeedback && (
                                  <div className="text-xs text-center py-0.5 text-warning fw-bold">
                                    {adminActionFeedback}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-5 my-auto">
                          <span className="fs-1 d-block mb-2">⏳</span>
                          <h6 className="fw-black text-white">Standby for Next Player Lot</h6>
                          <p className="text-white-50 text-xs mb-3">
                            The auctioneer has not called a player to the podium yet.
                          </p>
                          {isAdmin && (
                            <Link
                              href={`/auction/t/${activeTournamentId}/admin`}
                              className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 py-1.5 text-xs shadow"
                            >
                              🔨 Call Player to Podium
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: FRANCHISE PURSE & SQUAD TOWER */}
                  {sidebarTab === 'purse' && (
                    <div
                      className="d-flex flex-column gap-2 overflow-y-auto flex-grow-1 pe-1"
                      style={{ maxHeight: 'calc(58vh - 40px)' }}
                    >
                      {teams.map((t) => {
                        const isHolding = Boolean(
                          highestTeam && t?.id && String(t.id) === String(highestTeam.id)
                        );
                        const initialPurse = Number(t.initial_purse || 100000);
                        const remainingPurse = Number(t.remaining_purse || 0);
                        const squadCount = t.squad_count || 0;
                        const maxSquad = t.max_squad_size || 12;
                        const pct = Math.max(0, Math.min(100, (remainingPurse / initialPurse) * 100));

                        return (
                          <div
                            key={t.id}
                            className={`p-2.5 rounded-3 border transition-all position-relative ${isHolding
                              ? 'bg-warning bg-opacity-20 border-warning shadow-lg'
                              : 'bg-black bg-opacity-40 border-secondary border-opacity-20'
                              }`}
                            style={{
                              borderColor: isHolding ? '#f59e0b' : undefined,
                              boxShadow: isHolding ? '0 0 20px rgba(245, 158, 11, 0.4)' : undefined,
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <div className="d-flex align-items-center gap-2 min-w-0">
                                <span
                                  className="rounded-circle d-inline-block flex-shrink-0 shadow-sm"
                                  style={{
                                    width: 14,
                                    height: 14,
                                    backgroundColor: t.primary_color || '#06b6d4',
                                    border: '1.5px solid #fff',
                                  }}
                                />
                                <strong className="text-white text-xs text-truncate">
                                  {t.team_name}
                                </strong>
                              </div>

                              <span
                                className={`badge px-2 py-0.5 rounded-pill text-xs fw-black ${isHolding ? 'badge-gold' : 'badge-cyan'
                                  }`}
                              >
                                {t.team_code}
                              </span>
                            </div>

                            <div className="d-flex align-items-center justify-content-between text-xs">
                              <span className="text-white-50">
                                Slots: <strong>{squadCount}/{maxSquad}</strong>
                              </span>
                              <span className="fw-black text-warning font-monospace fs-6" suppressHydrationWarning>
                                ₹{formatCurrency(remainingPurse)}
                              </span>
                            </div>

                            {/* Purse Utilization Bar */}
                            <div className="progress mt-1.5" style={{ height: 4 }}>
                              <div
                                className={`progress-bar ${pct > 40 ? 'bg-info' : pct > 20 ? 'bg-warning' : 'bg-danger'
                                  }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Active Paddle Indicator Tag */}
                            {isHolding && (
                              <div className="mt-1.5 d-flex align-items-center justify-content-between text-xs pt-1 border-top border-warning border-opacity-30">
                                <span className="text-warning fw-black tracking-wide d-inline-flex align-items-center gap-1">
                                  <span>✋</span>
                                  <span>CURRENT HIGHEST PADDLE</span>
                                </span>
                                <span className="badge bg-warning text-dark text-xs fw-black">ACTIVE</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 3: LIVE BIDS LOG STREAM */}
                  {sidebarTab === 'bids' && (
                    <div
                      className="d-flex flex-column gap-2 overflow-y-auto flex-grow-1 pe-1"
                      style={{ maxHeight: 'calc(58vh - 40px)' }}
                    >
                      {recentBids.length > 0 ? (
                        recentBids.map((b, idx) => (
                          <div
                            key={b.id || idx}
                            className={`p-2 rounded-3 border d-flex align-items-center justify-content-between text-xs ${idx === 0
                              ? 'bg-warning bg-opacity-15 border-warning border-opacity-50'
                              : 'bg-black bg-opacity-30 border-secondary border-opacity-20'
                              }`}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span
                                className="rounded-circle d-inline-block flex-shrink-0"
                                style={{
                                  width: 10,
                                  height: 10,
                                  backgroundColor: b.primary_color || '#06b6d4',
                                }}
                              />
                              <div>
                                <strong className="text-white d-block">
                                  {b.team_name || b.team_code}
                                </strong>
                                <span className="text-white-50 text-xs">
                                  {b.placed_at ? new Date(b.placed_at).toLocaleTimeString() : 'Just now'}
                                </span>
                              </div>
                            </div>
                            <span className="fw-black text-warning font-monospace fs-6" suppressHydrationWarning>
                              ₹{formatCurrency(b.bid_amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5 text-white-50 text-xs">
                          <span>✋ No bids placed on this lot yet</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* SIGNATURE IPL LOWER-THIRD BID BAR (MARQUEE BID BOARD)       */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div
              className="mt-2.5 broadcast-hud-card p-3 p-md-4 shadow-2xl position-relative overflow-hidden"
              style={{
                borderColor: hammerConfig.borderGlow,
                boxShadow: `0 0 45px -5px ${hammerConfig.borderGlow}`,
                background: 'linear-gradient(180deg, rgba(11, 19, 36, 0.98) 0%, rgba(3, 7, 18, 0.99) 100%)',
              }}
            >
              {/* HEAD-TO-HEAD BIDDING WAR BANNER (When two franchises duel) */}
              {biddingWar && (
                <div
                  className="mb-2.5 py-1 px-3 rounded-pill d-flex align-items-center justify-content-between text-xs fw-black shadow-sm"
                  style={{
                    background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.9) 50%, rgba(6, 182, 212, 0.8) 100%)',
                    color: '#fff',
                    letterSpacing: '0.05em',
                  }}
                >
                  <span className="d-flex align-items-center gap-1">
                    <span>⚔️</span>
                    <span>INTENSE BIDDING WAR:</span>
                    <span className="text-dark bg-white px-2 py-0.2 rounded-pill fw-black">
                      {biddingWar.challenger?.team_name || 'Challenger Team'}
                    </span>
                  </span>
                  <span>VS</span>
                  <span className="d-flex align-items-center gap-1">
                    <span className="text-dark bg-warning px-2 py-0.2 rounded-pill fw-black">
                      {biddingWar.leader?.team_name || 'Leader Team'} (LEADING)
                    </span>
                    <span>⚡</span>
                  </span>
                </div>
              )}

              <div className="row g-3 align-items-center">
                {/* 1. PLAYER HERO PROFILE (Left Column) with photo & complete details */}
                <div className="col-12 col-md-5 col-lg-4 d-flex align-items-center gap-3 border-end-md border-secondary border-opacity-25">
                  {renderPlayerAvatar(
                    activePlayer?.photo_url,
                    activePlayer?.full_name,
                    88,
                    highestTeam?.primary_color || '#06b6d4'
                  )}

                  <div className="min-w-0 flex-grow-1">
                    <div className="d-flex align-items-center gap-1.5 mb-1">
                      <span
                        className={`badge px-2.5 py-0.5 rounded-pill text-xs fw-black text-uppercase ${hammerConfig.badgeClass}`}
                      >
                        {hammerConfig.label}
                      </span>
                      <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs">
                        LOT #{activePlayer?.lot_number || String(activePlayer?.id || '1').slice(-3)}
                      </span>
                    </div>

                    <h3 className="fs-5 fw-black text-white mb-0 text-truncate tracking-tight">
                      {activePlayer?.full_name || 'Awaiting Next Lot'}
                    </h3>

                    <div className="d-flex flex-wrap align-items-center gap-1.5 mt-1 text-xs text-white-50">
                      <span className="text-info fw-bold">
                        {formatPositionLabel(activePlayer?.playing_position)}
                      </span>
                      <span>•</span>
                      <span suppressHydrationWarning>
                        Base: <strong>₹{formatCurrency(basePrice)}</strong>
                      </span>
                      {activePlayer?.district && <span>• {activePlayer.district}</span>}
                    </div>

                    {/* Vitals preview row */}
                    {activePlayer && (
                      <div className="d-flex flex-wrap align-items-center gap-2 mt-1 text-xs text-white-50">
                        {activePlayer.height_cm && <span>H: <strong className="text-white">{activePlayer.height_cm}cm</strong></span>}
                        {activePlayer.weight_kg && <span>W: <strong className="text-white">{activePlayer.weight_kg}kg</strong></span>}
                        {activePlayer.team_name && <span className="text-truncate">Club: <strong className="text-white">{activePlayer.team_name}</strong></span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. CURRENT HIGHEST BID (Center Column - Real IPL Jumbo Numbers) */}
                <div className="col-12 col-md-4 col-lg-4 text-center border-end-md border-secondary border-opacity-25">
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                    <span className="text-white-50 text-xs fw-extrabold text-uppercase tracking-wider">
                      CURRENT HIGHEST BID
                    </span>
                    <span className="badge badge-emerald px-2 py-0.2 rounded-pill text-xs fw-bold" suppressHydrationWarning>
                      +{formatCurrency(minIncrement)}
                    </span>
                  </div>

                  <div className="auction-giant-price fs-1 lh-1 py-1" suppressHydrationWarning>
                    ₹{formatCurrency(currentBid > 0 ? currentBid : basePrice)}
                  </div>

                  <span className="text-white-50 text-xs">
                    {recentBids.length > 0
                      ? `${recentBids.length} total paddle raises on this lot`
                      : 'Waiting for opening paddle raise'}
                  </span>
                </div>

                {/* 3. LEADING FRANCHISE PADDLE & TABLE ATTRIBUTION (Right Column) */}
                <div className="col-12 col-md-3 col-lg-4 d-flex align-items-center justify-content-between ps-lg-3">
                  {highestTeam ? (
                    <div className="d-flex align-items-center gap-3">
                      <span
                        className="rounded-circle d-inline-block shadow-lg flex-shrink-0"
                        style={{
                          width: 42,
                          height: 42,
                          backgroundColor: highestTeam.primary_color || '#06b6d4',
                          border: '3px solid #fff',
                          boxShadow: `0 0 25px ${highestTeam.primary_color || '#06b6d4'}80`,
                        }}
                      />
                      <div>
                        <div className="text-white-50 text-xs text-uppercase fw-extrabold">
                          LEADING FRANCHISE PADDLE
                        </div>
                        <div className="fw-black text-white fs-5 text-truncate" style={{ maxWidth: 220 }}>
                          {highestTeam.team_name}
                        </div>
                        <div className="text-warning text-xs fw-bold">
                          Code: {highestTeam.team_code} {highestTeam.owner_name ? `• ${highestTeam.owner_name}` : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white-50 text-xs py-2">
                      <span className="fs-5 d-block mb-1">✋</span>
                      <span>No franchise has raised paddle yet</span>
                    </div>
                  )}

                  <div className="text-end d-none d-lg-block">
                    <span
                      className="badge px-3 py-1.5 rounded-pill text-xs fw-black text-uppercase shadow-sm"
                      style={{
                        backgroundColor: highestTeam?.primary_color || '#06b6d4',
                        color: '#fff',
                      }}
                    >
                      {highestTeam ? 'HOLDING HAMMER' : 'OPEN FOR BIDS'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: THEATER / CINEMA FULL CAMERA WITH BROADCAST HUD      */}
        {/* ============================================================ */}
        {layoutMode === 'theater' && (
          <div className="container-fluid position-relative flex-grow-1 d-flex flex-column p-0 overflow-hidden">
            <div className="broadcast-video-wrapper flex-grow-1" style={{ paddingBottom: '54vh' }}>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Live Auction Feed"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="broadcast-standby-screen">
                  <div className="fs-1 mb-2">🎥</div>
                  <h4 className="fw-black text-white">Live Camera Standby</h4>
                  <button
                    type="button"
                    className="btn btn-sm btn-info rounded-pill px-3 py-1.5 text-xs fw-bold mt-2 text-dark"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    Configure YouTube Live Stream
                  </button>
                </div>
              )}
            </div>

            {/* FLOATING TV LOWER-THIRD AUCTION HUD */}
            <div className="broadcast-theater-hud p-3 p-md-4 shadow-2xl">
              <div className="row g-3 align-items-center">
                <div className="col-12 col-md-5 d-flex align-items-center gap-3 border-end-md border-secondary border-opacity-25">
                  {renderPlayerAvatar(
                    activePlayer?.photo_url,
                    activePlayer?.full_name,
                    74,
                    highestTeam?.primary_color || '#06b6d4'
                  )}
                  <div className="min-w-0">
                    <div className="d-flex align-items-center gap-1.5 mb-1">
                      <span
                        className={`badge px-2 py-0.5 rounded-pill text-xs fw-extrabold text-uppercase ${hammerConfig.badgeClass}`}
                      >
                        {hammerConfig.label}
                      </span>
                      <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs">
                        LOT #{activePlayer?.lot_number || 1}
                      </span>
                    </div>
                    <h5 className="fw-black text-white mb-0 text-truncate">
                      {activePlayer?.full_name || 'Awaiting Lot'}
                    </h5>
                    <div className="text-white-50 text-xs mt-0.5">
                      <span className="text-info fw-bold">{formatPositionLabel(activePlayer?.playing_position)}</span>
                      <span> • </span>
                      <span suppressHydrationWarning>Base: ₹{formatCurrency(basePrice)}</span>
                      {activePlayer?.district && <span> • {activePlayer.district}</span>}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-3 text-center border-end-md border-secondary border-opacity-25">
                  <span className="text-white-50 text-xs fw-bold text-uppercase d-block mb-1">
                    CURRENT HIGHEST BID
                  </span>
                  <div className="auction-giant-price lh-1 fs-1" suppressHydrationWarning>
                    ₹{formatCurrency(currentBid > 0 ? currentBid : basePrice)}
                  </div>
                </div>

                <div className="col-12 col-md-4 d-flex align-items-center justify-content-between">
                  {highestTeam ? (
                    <div className="d-flex align-items-center gap-2.5">
                      <span
                        className="rounded-circle d-inline-block shadow"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: highestTeam.primary_color || '#06b6d4',
                          border: '2px solid #fff',
                        }}
                      />
                      <div>
                        <div className="text-white-50 text-xs text-uppercase fw-bold">Leading Paddle</div>
                        <div className="fw-black text-white fs-6">
                          {highestTeam.team_name} ({highestTeam.team_code})
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-white-50 text-xs">No bids placed yet</span>
                  )}
                  <span className="badge badge-gold px-3 py-1.5 rounded-pill text-xs fw-black">
                    🔴 SYNC LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 3: STAGE HERO DISPLAY WITH FLOATING CAMERA PIP         */}
        {/* ============================================================ */}
        {layoutMode === 'pip' && (
          <div className="container-fluid flex-grow-1 d-flex flex-column">
            {/* FLOATING CAMERA INSET BOX */}
            <div className="broadcast-pip-box shadow-2xl">
              <div className="d-flex align-items-center justify-content-between p-2 bg-dark border-bottom border-secondary border-opacity-30">
                <span className="text-xs fw-bold text-white d-flex align-items-center gap-1.5">
                  <span className="broadcast-live-dot" />
                  <span>Real Shooting Live Camera</span>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-white-50 text-xs text-decoration-none"
                  onClick={() => setLayoutMode('split')}
                >
                  Expand ↗
                </button>
              </div>
              <div className="broadcast-video-wrapper" style={{ paddingBottom: '56.25%' }}>
                {embedUrl ? (
                  <iframe src={embedUrl} title="Live Camera Feed" allowFullScreen />
                ) : (
                  <div className="broadcast-standby-screen text-xs p-2">
                    <span>Camera Standby</span>
                  </div>
                )}
              </div>
            </div>

            {/* FULL STAGE AUCTION HERO DISPLAY */}
            <div className="broadcast-hud-card p-4 p-md-5 my-auto text-center shadow-2xl">
              <span
                className={`badge px-4 py-2 rounded-pill text-sm fw-black tracking-widest text-uppercase shadow-lg mb-3 ${hammerConfig.badgeClass}`}
              >
                {hammerConfig.label}
              </span>

              {activePlayer ? (
                <>
                  <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                    {renderPlayerAvatar(
                      activePlayer.photo_url,
                      activePlayer.full_name,
                      150,
                      highestTeam?.primary_color || '#06b6d4'
                    )}
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <span className="badge badge-gold px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                      {activePlayer.player_grade || 'Grade A'}
                    </span>
                    <span className={`badge px-2.5 py-1 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(activePlayer.player_category)}`}>
                      {formatCategoryLabel(activePlayer.player_category)}
                    </span>
                    <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs">
                      LOT #{activePlayer.lot_number || 1}
                    </span>
                  </div>

                  <h1 className="display-5 fw-black text-white mb-1 tracking-tight">
                    {activePlayer.full_name}
                  </h1>
                  <p className="text-info fs-5 fw-bold mb-3" suppressHydrationWarning>
                    {formatPositionLabel(activePlayer.playing_position)} • Base Price: ₹{formatCurrency(basePrice)}
                  </p>

                  <div className="d-flex flex-wrap align-items-center justify-content-center gap-3 text-white-50 text-sm mb-4">
                    {activePlayer.height_cm && <span>Height: <strong className="text-white">{activePlayer.height_cm} cm</strong></span>}
                    {activePlayer.weight_kg && <span>Weight: <strong className="text-white">{activePlayer.weight_kg} kg</strong></span>}
                    {activePlayer.team_name && <span>Club: <strong className="text-white">{activePlayer.team_name}</strong></span>}
                    {activePlayer.district && <span>District: <strong className="text-white">{activePlayer.district}</strong></span>}
                  </div>

                  <div className="auction-giant-price mb-3" suppressHydrationWarning>
                    ₹{formatCurrency(currentBid > 0 ? currentBid : basePrice)}
                  </div>

                  {highestTeam && (
                    <div className="d-inline-flex align-items-center gap-2.5 px-4 py-2 rounded-pill bg-black bg-opacity-60 border border-info shadow-lg">
                      <span
                        className="rounded-circle d-inline-block shadow"
                        style={{
                          width: 22,
                          height: 22,
                          backgroundColor: highestTeam.primary_color || '#06b6d4',
                        }}
                      />
                      <span className="text-white-50 text-sm">Leading Franchise:</span>
                      <strong className="text-white fs-5">{highestTeam.team_name}</strong>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-5">
                  <div className="fs-1 mb-2">🔨</div>
                  <h3 className="fw-bold text-white">Podium Ready</h3>
                  <p className="text-white-50 small">Awaiting next lot call</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 4: OBS / STREAMER LOWER-THIRD OVERLAY MODE              */}
        {/* ============================================================ */}
        {layoutMode === 'obs' && (
          <div className="w-100">
            <div className="broadcast-theater-hud p-3 p-md-4 shadow-2xl position-relative mb-2">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span
                  className={`badge px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase ${hammerConfig.badgeClass}`}
                >
                  {hammerConfig.label}
                </span>
                <span className="badge badge-gold px-2.5 py-0.5 rounded-pill text-xs">
                  {currentTourn?.tournament_name || 'Olympic Vision Live Auction'}
                </span>
              </div>

              <div className="row g-3 align-items-center">
                <div className="col-4 d-flex align-items-center gap-2.5">
                  {renderPlayerAvatar(
                    activePlayer?.photo_url,
                    activePlayer?.full_name,
                    60,
                    highestTeam?.primary_color || '#06b6d4'
                  )}
                  <div className="min-w-0">
                    <h5 className="fw-black text-white mb-0 text-truncate">
                      {activePlayer?.full_name || 'Upcoming Lot'}
                    </h5>
                    <span className="text-white-50 text-xs">
                      {formatPositionLabel(activePlayer?.playing_position)}
                    </span>
                  </div>
                </div>

                <div className="col-4 text-center">
                  <span className="text-white-50 text-xs text-uppercase fw-bold d-block">
                    Current Highest Bid
                  </span>
                  <div className="auction-giant-price fs-2 lh-1" suppressHydrationWarning>
                    ₹{formatCurrency(currentBid > 0 ? currentBid : basePrice)}
                  </div>
                </div>

                <div className="col-4 text-end">
                  {highestTeam ? (
                    <div>
                      <span className="text-white-50 text-xs text-uppercase fw-bold d-block">
                        Leading Franchise
                      </span>
                      <strong className="fs-6 text-white" style={{ color: highestTeam.primary_color }}>
                        {highestTeam.team_name} ({highestTeam.team_code})
                      </strong>
                    </div>
                  ) : (
                    <span className="text-white-50 text-xs">Waiting for opening bid</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-sm btn-dark border border-secondary border-opacity-40 rounded-pill px-3 py-1 text-xs text-white-50"
                onClick={() => setLayoutMode('split')}
              >
                Exit OBS Mode ✕
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* BOTTOM REAL-TIME BREAKING TICKER MARQUEE                     */}
        {/* ──────────────────────────────────────────────────────────── */}
        {layoutMode !== 'obs' && (
          <footer
            className="mt-2.5 p-2 px-3 rounded-pill border border-secondary border-opacity-25 d-flex align-items-center justify-content-between gap-3 shadow-md"
            style={{ background: 'rgba(3, 7, 18, 0.94)' }}
          >
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                📢 LIVE AUCTION WIRE
              </span>
            </div>

            <div className="broadcast-ticker-marquee flex-grow-1">
              <div className="broadcast-ticker-track text-xs text-white" suppressHydrationWarning>
                <span>
                  🏆 <strong>{currentTourn?.tournament_name || 'Championship'}</strong> Live Auction Broadcast
                </span>
                <span>
                  🔨 Active Gavel: <strong>{activePlayer?.full_name || 'Ready'}</strong> (₹{formatCurrency(currentBid)})
                </span>
                {teams.map((t) => (
                  <span key={t.id}>
                    🛡️ {t.team_code}: <strong>₹{formatCurrency(t.remaining_purse || 0)}</strong> ({t.squad_count || 0}/{t.max_squad_size || 12})
                  </span>
                ))}
                <span>⚡ Real-Time YouTube Live Shooting Stream • Olympic Vision</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <span className="text-secondary text-xs d-none d-sm-inline">
                {teams.length} Registered Franchises
              </span>
            </div>
          </footer>
        )}
      </main>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STREAM SETUP MODAL (Change YouTube Live URL or ID)          */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showSettingsModal && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
            <div className="modal-content auction-card border-info p-4 text-start shadow-2xl">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-4">🎥</span>
                  <h5 className="modal-title fw-black text-white mb-0">
                    YouTube Live Stream Setup
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSettingsModal(false)}
                />
              </div>

              <p className="text-white-50 text-xs mb-3">
                Connect the real shooting live auction video camera feed to this screen. All registered teams, spectators, and administrators will view this live stream synchronized with auction details.
              </p>

              <form onSubmit={handleSaveStreamUrl} className="vstack gap-3">
                <div>
                  <label className="form-label text-white-50 text-xs fw-semibold mb-1.5 d-flex align-items-center justify-content-between">
                    <span>YouTube Live URL or Video ID</span>
                    <span className="badge badge-cyan text-xs">Live Stream</span>
                  </label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary border-opacity-50 text-xs py-2.5"
                    placeholder="https://www.youtube.com/watch?v=... or Video ID"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    required
                  />
                  <small className="text-white-50 text-xs mt-1 d-block">
                    Supports: standard watch URLs, youtu.be shortlinks, embed links, or 11-character video IDs.
                  </small>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-white-50 text-xs d-block mb-1.5 fw-semibold">
                    Quick Preset Links:
                  </span>
                  <div className="d-flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 text-xs fw-bold"
                      onClick={() => setInputUrl('https://www.youtube.com/@OlympicVisionIndia/live')}
                    >
                      ▶ Olympic Vision Live
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-1 text-xs fw-bold"
                      onClick={() => setInputUrl('https://www.youtube.com/watch?v=live_stream')}
                    >
                      ⚡ YouTube Live Generic
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 text-xs text-white"
                      onClick={() => setInputUrl('')}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {saveMessage && (
                  <div
                    className={`alert py-2 px-3 small mb-0 ${saveMessage.startsWith('✅') ? 'alert-success' : 'alert-danger'
                      }`}
                  >
                    {saveMessage}
                  </div>
                )}

                <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top border-secondary border-opacity-25 mt-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-3 py-1.5 text-xs text-white"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-info text-dark fw-extrabold rounded-pill px-4 py-1.5 text-xs shadow"
                    disabled={isSavingUrl}
                  >
                    {isSavingUrl ? 'Saving...' : 'Save & Update Live Stream →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
