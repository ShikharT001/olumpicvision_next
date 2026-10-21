'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import Link from 'next/link';
import { normalizeCategory, formatCategoryLabel, getCategoryBadgeClass } from '@/lib/sports-config';

// Web Audio API fanfare synthesizer for live sales
function playFanfareSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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
    // Ignore audio permission blocks
  }
}

export default function AuctioneerConsole({ initialData, role = 'admin', isAdmin: propIsAdmin, tournament = null, tournamentId: propTournamentId, loggedTeam = null }) {
  const activeTournamentId = propTournamentId || tournament?.id || tournament?.slug;
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : role === 'admin';
  const [data, setData] = useState(initialData || {});
  const [liveNotification, setLiveNotification] = useState(initialData?.lastNotification || null);
  const [soldModalData, setSoldModalData] = useState(null);
  const [unsoldModalData, setUnsoldModalData] = useState(null);
  const [confirmSaleModal, setConfirmSaleModal] = useState(null);
  const [confirmUnsoldModal, setConfirmUnsoldModal] = useState(null);
  const [confirmUndoModal, setConfirmUndoModal] = useState(false);
  const [selectedIncrement, setSelectedIncrement] = useState(500);
  const [customBidInput, setCustomBidInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');
  const [playerDrawerOpen, setPlayerDrawerOpen] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [activeCategory, setActiveCategory] = useState('open');
  const [playerFilter, setPlayerFilter] = useState({ lot: '', status: '', search: '', position: '', category: '' });
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const lastNotifIdRef = useRef(initialData?.lastNotification?.id || null);
  const [, startTransition] = useTransition();

  const fetchState = useCallback(async () => {
    try {
      const url = activeTournamentId
        ? `/api/auction/state?tournamentId=${encodeURIComponent(activeTournamentId)}`
        : '/api/auction/state';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
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
            playFanfareSound();
          } else if (json.lastNotification.type === 'unsold') {
            setUnsoldModalData(json.lastNotification);
          }
        }
        setData(json);
      }
    } catch {
      // Ignore background heartbeat error
    }
  }, [activeTournamentId]);

  // 1.5s live polling heartbeat
  useEffect(() => {
    const timer = setInterval(fetchState, 1500);
    return () => clearInterval(timer);
  }, [fetchState]);

  const activePlayer = data?.activePlayer;
  const highestTeam = data?.highestTeam;
  const state = data?.state || {};
  const teams = data?.teams || [];
  const currentBid = Number(state.current_highest_bid || 0);
  const basePrice = Number(activePlayer?.base_price || 1000);
  const nextMinBid = currentBid === 0 ? basePrice : currentBid + selectedIncrement;

  // Handle Paddle Click (Bid placed for team)
  const handleTeamPaddleClick = async (team) => {
    if (!activePlayer) {
      setError('Please select a player to put on the hammer first.');
      return;
    }
    setError('');
    setActionLoading(true);

    const bidToPlace = customBidInput ? Number(customBidInput) : nextMinBid;

    try {
      const res = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, bidAmount: bidToPlace, tournamentId: activeTournamentId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to place bid');

      setCustomBidInput('');
      setActionMessage(`Bid: ₹${bidToPlace.toLocaleString()} recorded for ${team.team_name}`);
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Hammer Stage Control
  const handleHammerAdvance = async (stage) => {
    setError('');
    setActionLoading(true);
    try {
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stage', stage, tournamentId: activeTournamentId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Hammer update failed');
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Finalize Sale — Request Modal
  const requestFinalizeSale = () => {
    if (!activePlayer || !highestTeam || currentBid <= 0) {
      setError('Cannot mark as Sold without an active high bidder.');
      return;
    }
    setConfirmSaleModal({
      player: activePlayer,
      team: highestTeam,
      price: currentBid,
    });
  };

  // Finalize Sale — Execute
  const executeFinalizeSale = async () => {
    setError('');
    setActionLoading(true);
    try {
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sold', tournamentId: activeTournamentId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Sale finalization failed');

      const soldMsg = resData.message || `${activePlayer.full_name} sold to ${highestTeam.team_name} at ₹${currentBid.toLocaleString()}`;
      const notifData = resData.notification || {
        type: 'sold',
        message: soldMsg,
        playerName: activePlayer.full_name,
        teamName: highestTeam.team_name,
        price: currentBid,
        timestamp: new Date().toISOString(),
      };

      setLiveNotification(notifData);
      setSoldModalData({
        ...notifData,
        position: activePlayer.playing_position,
        category: activePlayer.player_category,
        lot: activePlayer.lot_number,
        teamColor: highestTeam.primary_color || '#f59e0b',
        teamCode: highestTeam.team_code || 'WIN',
      });
      playFanfareSound();
      setConfirmSaleModal(null);
      setActionMessage(soldMsg);
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Unsold — Request Modal
  const requestMarkUnsold = () => {
    if (!activePlayer) return;
    setConfirmUnsoldModal({
      player: activePlayer,
      basePrice: activePlayer.base_price || 1000,
    });
  };

  // Mark Unsold — Execute
  const executeMarkUnsold = async () => {
    setError('');
    setActionLoading(true);
    try {
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsold', tournamentId: activeTournamentId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to mark unsold');

      const unsoldMsg = resData.message || `${activePlayer.full_name} remained UNSOLD and moved to the unsold pool.`;
      const notifData = resData.notification || {
        type: 'unsold',
        message: unsoldMsg,
        playerName: activePlayer.full_name,
        timestamp: new Date().toISOString(),
      };

      setLiveNotification(notifData);
      setUnsoldModalData({
        ...notifData,
        position: activePlayer.playing_position,
        basePrice: activePlayer.base_price,
        lot: activePlayer.lot_number,
      });
      setConfirmUnsoldModal(null);
      setActionMessage(unsoldMsg);
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Undo Last Action — Request Modal
  const requestUndo = () => {
    setConfirmUndoModal(true);
  };

  // Undo Last Action — Execute
  const executeUndo = async () => {
    setError('');
    setActionLoading(true);
    try {
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'undo', tournamentId: activeTournamentId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Undo failed');

      setConfirmUndoModal(false);
      setActionMessage(resData.message || 'Action reverted.');
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch all players for systematic queue calculations
  const fetchPlayersList = useCallback(async () => {
    try {
      const url = activeTournamentId
        ? `/api/auction/players?tournamentId=${encodeURIComponent(activeTournamentId)}`
        : '/api/auction/players';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setAllPlayers(json.players || []);
      }
    } catch {
      // Ignore
    }
  }, [activeTournamentId]);

  // Initial and periodic player list sync
  useEffect(() => {
    fetchPlayersList();
    const pTimer = setInterval(fetchPlayersList, 3000);
    return () => clearInterval(pTimer);
  }, [fetchPlayersList]);

  // Load Players Drawer
  const openPlayerDrawer = async () => {
    setPlayerDrawerOpen(true);
    setLoadingPlayers(true);
    try {
      await fetchPlayersList();
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleSelectPlayerToHammer = async (player) => {
    setError('');
    setActionLoading(true);
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select', playerId: player.id, tournamentId: activeTournamentId }),
      });
      let resData = {};
      try {
        resData = await res.json();
      } catch {
        throw new Error('Server returned an invalid response. Please verify you are logged in as admin.');
      }
      if (!res.ok) throw new Error(resData.error || 'Failed to load player');

      setPlayerDrawerOpen(false);
      setActionMessage(`Now on hammer: ${player.full_name}`);
      fetchState();
      fetchPlayersList();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Systematic Category Definitions in canonical auction progression order
  const SYSTEMATIC_CATEGORIES = [
    { key: 'icon_player', label: 'Icon / Marquee', shortLabel: 'Icon', icon: '⭐', badgeClass: 'badge-gold' },
    { key: 'open', label: 'Open Category (Senior)', shortLabel: 'Open', icon: '🏐', badgeClass: 'badge-emerald' },
    { key: 'u19', label: 'Under-19 (U19 Youth)', shortLabel: 'U19', icon: '⚡', badgeClass: 'badge-cyan' },
    { key: 'u14', label: 'Under-14 (U14 Junior)', shortLabel: 'U14', icon: '🌱', badgeClass: 'bg-purple-600 text-white' },
    { key: 'unsold', label: 'Unsold Pool (Round 2)', shortLabel: 'Unsold Pool', icon: '⚠️', badgeClass: 'bg-warning text-dark' },
  ];

  // Compute category statistics and next sequential player per category
  const categoryStats = SYSTEMATIC_CATEGORIES.map((catDef) => {
    let pool = [];
    if (catDef.key === 'unsold') {
      pool = allPlayers.filter((p) => p.auction_status === 'unsold');
    } else {
      pool = allPlayers.filter(
        (p) => normalizeCategory(p.player_category) === catDef.key
      );
    }

    const queued = pool.filter((p) => (catDef.key === 'unsold' ? true : p.auction_status === 'queued'));
    const sold = pool.filter((p) => p.auction_status === 'sold');
    const onHammer = pool.filter((p) => p.auction_status === 'on_hammer');

    const sortedQueued = [...queued].sort((a, b) => {
      const lotA = Number(a.lot_number || 1);
      const lotB = Number(b.lot_number || 1);
      if (lotA !== lotB) return lotA - lotB;
      const orderA = Number(a.bidding_order || 0);
      const orderB = Number(b.bidding_order || 0);
      if (orderA !== orderB) return orderA - orderB;
      return String(a.full_name || '').localeCompare(String(b.full_name || ''));
    });

    return {
      ...catDef,
      totalCount: pool.length,
      queuedCount: queued.length,
      soldCount: sold.length,
      onHammerCount: onHammer.length,
      nextPlayer: sortedQueued[0] || null,
      queuedPlayers: sortedQueued,
    };
  });

  const currentCategoryInfo = categoryStats.find((c) => c.key === activeCategory) || categoryStats[1];
  const nextPlayerInActiveCategory = currentCategoryInfo?.nextPlayer;
  const currentCategoryIndex = SYSTEMATIC_CATEGORIES.findIndex((c) => c.key === activeCategory);
  const nextCategoryInSequence = SYSTEMATIC_CATEGORIES.slice(currentCategoryIndex + 1).find((c) => {
    const s = categoryStats.find((st) => st.key === c.key);
    return s && s.queuedCount > 0;
  });

  // Action to bring the next player in the systematic category queue to podium
  const handleCallNextCategoryPlayer = async (playerOverride) => {
    const targetPlayer = playerOverride || nextPlayerInActiveCategory;
    if (!targetPlayer) {
      if (nextCategoryInSequence) {
        setActiveCategory(nextCategoryInSequence.key);
      }
      return;
    }
    await handleSelectPlayerToHammer(targetPlayer);
  };

  // Filter players in drawer & compute tab counts
  const queuedCount = allPlayers.filter((p) => p.auction_status === 'queued').length;
  const unsoldCount = allPlayers.filter((p) => p.auction_status === 'unsold').length;
  const soldCount = allPlayers.filter((p) => p.auction_status === 'sold').length;
  const totalCount = allPlayers.length;

  const filteredPlayers = allPlayers
    .filter((p) => {
      if (playerFilter.status && p.auction_status !== playerFilter.status) return false;
      if (playerFilter.category) {
        if (playerFilter.category === 'unsold') {
          if (p.auction_status !== 'unsold') return false;
        } else if (normalizeCategory(p.player_category) !== playerFilter.category) {
          return false;
        }
      }
      if (playerFilter.lot && p.lot_number !== Number(playerFilter.lot)) return false;
      if (playerFilter.position && p.playing_position !== playerFilter.position) return false;
      if (playerFilter.search) {
        const term = playerFilter.search.toLowerCase();
        return (
          p.full_name?.toLowerCase().includes(term) ||
          p.playing_position?.toLowerCase().includes(term) ||
          p.player_category?.toLowerCase().includes(term) ||
          p.team_name?.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Systematic category ordering: icon -> open -> u19 -> u14 -> others
      const catOrder = { icon_player: 1, open: 2, u19: 3, u14: 4, unsold: 5 };
      const catA = catOrder[normalizeCategory(a.player_category)] || 9;
      const catB = catOrder[normalizeCategory(b.player_category)] || 9;
      if (catA !== catB) return catA - catB;

      const lotA = Number(a.lot_number || 1);
      const lotB = Number(b.lot_number || 1);
      if (lotA !== lotB) return lotA - lotB;

      const orderA = Number(a.bidding_order || 0);
      const orderB = Number(b.bidding_order || 0);
      if (orderA !== orderB) return orderA - orderB;

      return String(a.full_name || '').localeCompare(String(b.full_name || ''));
    });

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Team View-Only Live Spectator Banner */}
      {!isAdmin && (
        <div className="alert border border-info border-opacity-30 bg-info bg-opacity-10 d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-3 rounded-3 mb-3 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-info text-dark rounded-pill px-2.5 py-1 text-xs fw-extrabold">
              🛡️ TEAM SPECTATOR VIEW
            </span>
            <span className="text-white small">
              You are watching the live Auctioneer Console in real time. All bidding paddles and gavel actions are exclusively operated by the official Tournament Admin.
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-black bg-opacity-50 text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill text-xs font-monospace">
              ● LIVE SYNC (1.5s)
            </span>
            <Link href="/auction/live" className="btn btn-sm btn-outline-warning rounded-pill px-2.5 py-0.5 text-xs fw-bold">
              Stage Projector ↗
            </Link>
          </div>
        </div>
      )}

      {/* Broadcast SOLD / UNSOLD Live Notification Banner */}
      {liveNotification && (
        <div
          className={`auction-notify-banner mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-lg ${
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
              {liveNotification.type === 'sold'
                ? '🎉 PLAYER SOLD'
                : liveNotification.type === 'unsold'
                ? '⚠️ PLAYER UNSOLD'
                : 'ℹ️ NOTICE'}
            </span>
            <div>
              <h4 className="fw-extrabold text-white mb-0 fs-6">
                {liveNotification.message}
              </h4>
              <span className="text-white-50 text-xs">
                Live Broadcast Notification • {new Date(liveNotification.timestamp || Date.now()).toLocaleTimeString()}
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

      {/* Top Banner Alert / Action notification */}
      {actionMessage && (
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm py-2 px-3 small d-flex align-items-center justify-content-between mb-3" role="alert">
          <span><strong>Podium Update:</strong> {actionMessage}</span>
          <button type="button" className="btn-close py-2" onClick={() => setActionMessage('')} aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm py-2 px-3 small d-flex align-items-center justify-content-between mb-3" role="alert">
          <span><strong>Notice:</strong> {error}</span>
          <button type="button" className="btn-close py-2" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Main Grid: Left = Player & Podium Controls, Right = Team Paddle Pad */}
      <div className="row g-3">
        {/* LEFT COLUMN: ACTIVE PLAYER & GAVEL STAGE */}
        <div className="col-12 col-lg-7 col-xl-6">
          <div className="auction-card p-3 p-sm-4 h-100 d-flex flex-column">
            {/* Header / Queue selector button */}
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2.5 mb-3 border-secondary border-opacity-25">
              <div>
                <span className="badge badge-cyan px-2 py-1 rounded-pill text-xs text-uppercase fw-bold">
                  {isAdmin ? 'Podium Active' : 'Live Podium Stream'}
                </span>
                <span className="ms-2 text-white-50 text-xs">
                  {tournament?.tournament_name || 'PDVL 2026/27 Official Auction'}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-info rounded-pill px-3 py-1 fw-bold text-xs d-inline-flex align-items-center gap-1.5"
                onClick={openPlayerDrawer}
              >
                <span>{isAdmin ? 'Change Player Queue' : 'Explore Player Queue'}</span>
                <span className="badge bg-info text-dark rounded-pill">☰</span>
              </button>
            </div>

            {/* SYSTEMATIC CATEGORY SEQUENCE PIPELINE & QUICK PODIUM DISPATCH */}
            <div className="bg-black bg-opacity-40 rounded-3 p-3 border border-secondary border-opacity-25 mb-3 shadow-sm">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge badge-gold px-2.5 py-0.5 rounded-pill text-xs fw-black">
                    SEQUENCE: STEP {currentCategoryIndex + 1} / {SYSTEMATIC_CATEGORIES.length}
                  </span>
                  <span className="text-white-50 text-xs fw-bold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                    Podium Category Queue
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 text-xs">
                  <span className="text-white-50">Active Focus:</span>
                  <strong className="text-info font-monospace">
                    {currentCategoryInfo?.label} ({currentCategoryInfo?.queuedCount || 0} Ready)
                  </strong>
                </div>
              </div>

              {/* Category Pipeline Stepper Tabs */}
              <div className="d-flex flex-wrap align-items-center gap-1.5 mb-2.5">
                {categoryStats.map((cat) => {
                  const isActive = activeCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold transition-all d-flex align-items-center gap-1.5 ${
                        isActive
                          ? 'btn-info text-dark shadow'
                          : cat.queuedCount > 0
                          ? 'btn-outline-light text-light'
                          : 'btn-outline-secondary text-white-50 opacity-60'
                      }`}
                      onClick={() => setActiveCategory(cat.key)}
                      title={`Focus queue on ${cat.label} (${cat.queuedCount} players ready)`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.shortLabel}</span>
                      <span
                        className={`badge rounded-pill text-xs ${
                          isActive ? 'bg-dark text-info' : 'bg-secondary bg-opacity-40 text-white'
                        }`}
                      >
                        {cat.queuedCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Systematic Bring-to-Podium Quick Action Bar */}
              {isAdmin && (
                <div>
                  {nextPlayerInActiveCategory ? (
                    <button
                      type="button"
                      className="btn btn-warning w-100 rounded-pill py-2 px-3 fw-black text-dark text-xs d-flex align-items-center justify-content-between shadow"
                      onClick={() => handleCallNextCategoryPlayer()}
                      disabled={actionLoading}
                    >
                      <span className="d-flex align-items-center gap-2 text-truncate">
                        <span>⚡</span>
                        <span>Call Next {currentCategoryInfo?.shortLabel} Player to Podium:</span>
                        <strong className="text-dark font-monospace text-decoration-underline text-truncate">
                          {nextPlayerInActiveCategory.full_name}
                        </strong>
                      </span>
                      <span className="badge bg-dark text-warning rounded-pill px-2.5 py-1 text-xs font-monospace flex-shrink-0 ms-2">
                        {nextPlayerInActiveCategory.playing_position?.replace('_', ' ')} • Lot #{nextPlayerInActiveCategory.lot_number || 1} ➔
                      </span>
                    </button>
                  ) : nextCategoryInSequence ? (
                    <button
                      type="button"
                      className="btn btn-primary w-100 rounded-pill py-2 px-3 fw-bold text-white text-xs d-flex align-items-center justify-content-between shadow"
                      onClick={() => setActiveCategory(nextCategoryInSequence.key)}
                    >
                      <span>
                        ✓ {currentCategoryInfo?.shortLabel} Category Complete! Advance to:
                      </span>
                      <span className="badge bg-white text-primary rounded-pill px-2.5 py-1 text-xs fw-extrabold ms-2">
                        {nextCategoryInSequence.label} ({categoryStats.find((s) => s.key === nextCategoryInSequence.key)?.queuedCount || 0} Ready) ➔
                      </span>
                    </button>
                  ) : (
                    <div className="d-flex align-items-center justify-content-between text-xs text-white-50 px-3 py-1.5 bg-dark bg-opacity-50 rounded-pill border border-secondary border-opacity-20">
                      <span>✓ All registered players in {currentCategoryInfo?.shortLabel} have been auctioned.</span>
                      <span className="badge bg-success rounded-pill text-xs">Stage Complete</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active Player Card */}
            {activePlayer ? (
              <div className="row g-3 align-items-center mb-3">
                <div className="col-4 col-sm-3">
                  <div className="auction-portrait-frame shadow-sm">
                    {activePlayer.photo_url ? (
                      <img src={activePlayer.photo_url} alt={activePlayer.full_name} />
                    ) : (
                      <div className="text-secondary text-center p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                          <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-8 col-sm-9">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs">
                      {activePlayer.player_grade || 'Grade A'}
                    </span>
                    <span className={`badge px-2 py-0.5 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(activePlayer.player_category)}`}>
                      {formatCategoryLabel(activePlayer.player_category)}
                    </span>
                    <span className="text-white-50 text-xs">Lot #{activePlayer.lot_number || 1}</span>
                  </div>

                  <h3 className="h4 fw-extrabold text-white mb-1 tracking-tight">
                    {activePlayer.full_name}
                  </h3>

                  <div className="row g-2 text-xs text-white-50 mt-1">
                    <div className="col-6">
                      <span className="d-block text-secondary">Position:</span>
                      <strong className="text-white text-capitalize">{activePlayer.playing_position?.replace('_', ' ')}</strong>
                    </div>
                    <div className="col-6">
                      <span className="d-block text-secondary">Height:</span>
                      <strong className="text-white">{activePlayer.height_cm ? `${activePlayer.height_cm} cm` : '—'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="d-block text-secondary">School / Club:</span>
                      <strong className="text-white text-truncate d-block">{activePlayer.team_name || 'Individual'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="d-block text-secondary">Base Price:</span>
                      <strong className="text-warning">₹{basePrice.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center border rounded-3 border-secondary border-opacity-25 bg-black bg-opacity-20 my-auto">
                <span className="fs-1 d-block mb-2">{currentCategoryInfo?.icon || '🏐'}</span>
                <h5 className="fw-bold text-white mb-1">Hammer Podium is Empty</h5>
                <p className="text-secondary small mb-3">
                  {isAdmin ? (
                    nextPlayerInActiveCategory ? (
                      <>
                        Active queue: <strong>{currentCategoryInfo?.label}</strong>. Next in line is{' '}
                        <strong className="text-white">{nextPlayerInActiveCategory.full_name}</strong> (Base: ₹
                        {Number(nextPlayerInActiveCategory.base_price || 1000).toLocaleString()}).
                      </>
                    ) : (
                      <>All players in {currentCategoryInfo?.label} have been auctioned. Advance to the next category or explore the queue drawer.</>
                    )
                  ) : (
                    'Awaiting the auctioneer to bring the next player to the live hammer stage.'
                  )}
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {isAdmin && nextPlayerInActiveCategory && (
                    <button
                      type="button"
                      className="btn btn-warning rounded-pill px-4 py-2 fw-black text-dark text-sm shadow"
                      onClick={() => handleCallNextCategoryPlayer()}
                      disabled={actionLoading}
                    >
                      ⚡ Bring {nextPlayerInActiveCategory.full_name} to Podium Now
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-info rounded-pill px-4 py-2 fw-bold text-sm"
                    onClick={openPlayerDrawer}
                  >
                    Browse Full Queue Drawer ☰
                  </button>
                </div>
              </div>
            )}

            {/* Current Highest Bid Banner */}
            <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-20 mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-white-50 text-xs text-uppercase fw-semibold" style={{ letterSpacing: '0.06em' }}>
                  Current Highest Bid
                </span>
                {/* Gavel Stage Pill */}
                <span className={`hammer-pill hammer-stage-${state.hammer_stage || 0}`}>
                  {state.hammer_stage === 1 && 'GOING ONCE...'}
                  {state.hammer_stage === 2 && 'GOING TWICE...'}
                  {state.hammer_stage === 3 && 'SOLD!'}
                  {(!state.hammer_stage || state.hammer_stage === 0) && (currentBid > 0 ? 'PODIUM ACTIVE' : 'NO BIDS YET')}
                </span>
              </div>

              <div className="d-flex align-items-baseline justify-content-between">
                <div>
                  <span className="auction-giant-price">
                    ₹{currentBid.toLocaleString()}
                  </span>
                </div>
                <div className="text-end">
                  {highestTeam ? (
                    <div>
                      <span className="badge px-2.5 py-1 rounded-pill text-xs fw-bold" style={{ backgroundColor: highestTeam.primary_color || '#0d6efd', color: '#fff' }}>
                        {highestTeam.team_code}
                      </span>
                      <strong className="d-block text-white small mt-1">{highestTeam.team_name}</strong>
                    </div>
                  ) : (
                    <span className="text-white-50 small fst-italic">Waiting for opening bid</span>
                  )}
                </div>
              </div>
            </div>

            {/* Podium Gavel Action Bar */}
            <div className="mt-auto pt-2 border-top border-secondary border-opacity-25">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-white-50 text-xs text-uppercase fw-bold">
                  {isAdmin ? 'Gavel Stage Controls' : 'Live Gavel Status (Admin Controlled)'}
                </span>
                {!isAdmin && (
                  <span className="badge bg-secondary bg-opacity-25 text-white-50 text-xs fw-normal">
                    👁️ Spectator Mode
                  </span>
                )}
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <button
                  type="button"
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold text-xs flex-fill ${state.hammer_stage === 1 ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                  onClick={() => isAdmin && handleHammerAdvance(1)}
                  disabled={!isAdmin || !activePlayer || currentBid === 0 || actionLoading}
                  title={!isAdmin ? 'Operated by official auctioneer only' : 'Going once call'}
                >
                  ⚡ Going 1
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold text-xs flex-fill ${state.hammer_stage === 2 ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                  onClick={() => isAdmin && handleHammerAdvance(2)}
                  disabled={!isAdmin || !activePlayer || currentBid === 0 || actionLoading}
                  title={!isAdmin ? 'Operated by official auctioneer only' : 'Going twice call'}
                >
                  ⚡⚡ Going 2
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-3 px-4 py-2 fw-bold text-xs flex-fill shadow-sm ${state.hammer_stage === 3 ? 'btn-success text-white' : 'btn-outline-success'}`}
                  onClick={() => isAdmin && requestFinalizeSale()}
                  disabled={!isAdmin || !activePlayer || !highestTeam || currentBid <= 0 || actionLoading}
                  title={!isAdmin ? 'Operated by official auctioneer only' : 'Confirm player sale'}
                >
                  🔨 SOLD!
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-3 px-3 py-2 fw-bold text-xs"
                      onClick={requestMarkUnsold}
                      disabled={!activePlayer || actionLoading}
                    >
                      ✕ Unsold
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-3 px-2.5 py-2 fw-semibold text-xs"
                      onClick={requestUndo}
                      disabled={actionLoading}
                      title="Undo last action"
                    >
                      ↺ Undo
                    </button>
                  </>
                )}
              </div>
              {!isAdmin && (
                <span className="text-secondary d-block mt-2" style={{ fontSize: '0.74rem' }}>
                  🔒 Gavel calls & hammer awards are exclusively operated by the main auctioneer.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PHYSICAL PADDLE BIDDING PAD */}
        <div className="col-12 col-lg-5 col-xl-6">
          <div className="auction-card p-3 p-sm-4 h-100 d-flex flex-column">
            {/* Header / Increment selector */}
            <div className="border-bottom pb-2.5 mb-3 border-secondary border-opacity-25">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                  <span>{isAdmin ? 'Physical Paddle Attribution' : 'Live Team Purses & Paddle Status'}</span>
                </h5>
                <span className="text-white-50 text-xs">
                  Next Minimum: <strong className="text-warning">₹{nextMinBid.toLocaleString()}</strong>
                </span>
              </div>

              {/* Increment Pills */}
              {isAdmin ? (
                <div className="d-flex flex-wrap align-items-center gap-1.5">
                  {[200, 500, 1000, 2000, 5000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold transition-all ${
                        selectedIncrement === inc && !customBidInput
                          ? 'btn-info text-dark shadow-sm'
                          : 'btn-outline-secondary text-light opacity-75'
                      }`}
                      onClick={() => {
                        setSelectedIncrement(inc);
                        setCustomBidInput('');
                      }}
                    >
                      +₹{inc.toLocaleString()}
                    </button>
                  ))}

                  {/* Custom Bid Input */}
                  <div className="ms-auto d-flex align-items-center gap-1" style={{ maxWidth: 140 }}>
                    <span className="text-white-50 text-xs">₹</span>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 text-xs"
                      placeholder="Custom Bid"
                      value={customBidInput}
                      onChange={(e) => setCustomBidInput(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-between py-1 px-2.5 rounded-pill bg-black bg-opacity-30 border border-secondary border-opacity-20 text-xs">
                  <span className="text-white-50">Active Auction Increment:</span>
                  <span className="badge badge-cyan px-2.5 py-1 rounded-pill fw-bold font-monospace">
                    +₹{selectedIncrement.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Team Paddle Grid */}
            <div className="flex-grow-1 overflow-auto pe-1 mb-3" style={{ maxHeight: '420px' }}>
              <span className="text-white-50 text-xs d-block mb-2 text-uppercase fw-semibold" style={{ letterSpacing: '0.04em' }}>
                {isAdmin
                  ? 'Click team that raised physical paddle:'
                  : 'Franchise teams & live purse balances:'}
              </span>

              <div className="row g-2">
                {teams.map((team) => {
                  const isHigh = highestTeam?.id === team.id;
                  const isMyTeam = loggedTeam && (loggedTeam.id === team.id || loggedTeam.code === team.team_code);
                  const bidAmountToPlace = customBidInput ? Number(customBidInput) : nextMinBid;
                  const hasPurse = Number(team.remaining_purse) >= bidAmountToPlace;
                  const isFull = team.squad_count >= team.max_squad_size;
                  const canBid = isAdmin && hasPurse && !isFull && activePlayer && !actionLoading;

                  return (
                    <div key={team.id} className="col-12 col-sm-6">
                      <button
                        type="button"
                        className={`team-paddle-btn w-100 ${!isAdmin ? 'is-view-only' : ''} ${isHigh ? 'is-highest-bidder' : ''}`}
                        style={{
                          '--team-color': team.primary_color || '#0d6efd',
                          ...(isMyTeam
                            ? {
                                border: '2px solid #06b6d4',
                                boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
                              }
                            : {}),
                        }}
                        onClick={() => isAdmin && handleTeamPaddleClick(team)}
                        disabled={isAdmin && !canBid}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <div className="d-flex align-items-center gap-1">
                            <span
                              className="badge px-2.5 py-1 rounded-pill text-xs fw-extrabold shadow-sm"
                              style={{ backgroundColor: team.primary_color || '#0d6efd', color: '#fff' }}
                            >
                              {team.team_code}
                            </span>
                            {isMyTeam && (
                              <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs fw-black">
                                ★ YOUR TEAM
                              </span>
                            )}
                          </div>
                          <span className="badge bg-secondary bg-opacity-30 text-light text-xs font-monospace">
                            Squad: {team.squad_count || 0}/{team.max_squad_size || 12}
                          </span>
                        </div>

                        <div className="fw-bold text-white text-truncate small mb-1">
                          {team.team_name}
                        </div>

                        <div className="d-flex align-items-center justify-content-between text-xs pt-1 border-top border-secondary border-opacity-20">
                          <span className="text-white-50">Remaining Purse:</span>
                          <span className={`fw-extrabold ${Number(team.remaining_purse) < 10000 ? 'text-danger' : 'text-success'}`}>
                            ₹{Number(team.remaining_purse || 0).toLocaleString()}
                          </span>
                        </div>

                        {isAdmin ? (
                          <div className="mt-2 pt-1 border-top border-secondary border-opacity-15 d-flex align-items-center justify-content-between">
                            <span className="text-white-50 text-xs">Raise Paddle:</span>
                            <span className="badge bg-primary text-white px-2 py-0.5 rounded-pill text-xs fw-bold">
                              +₹{bidAmountToPlace.toLocaleString()} ↗
                            </span>
                          </div>
                        ) : (
                          <div className="mt-2 pt-1 border-top border-secondary border-opacity-15 d-flex align-items-center justify-content-between">
                            <span className="text-white-50 text-xs">Next Call:</span>
                            <span className="badge bg-secondary bg-opacity-35 text-white px-2 py-0.5 rounded-pill text-xs font-monospace">
                              ₹{bidAmountToPlace.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {isHigh && (
                          <div className="text-center mt-2 py-0.5 rounded-pill bg-warning-subtle text-warning fw-extrabold text-xs border border-warning-subtle">
                            ★ CURRENT HIGHEST BIDDER ★
                          </div>
                        )}

                        {!hasPurse && (
                          <div className="text-danger small mt-1.5 fw-semibold" style={{ fontSize: '0.74rem' }}>
                            ⚠️ Insufficient Purse for ₹{bidAmountToPlace.toLocaleString()}
                          </div>
                        )}
                        {isFull && (
                          <div className="text-danger small mt-1.5 fw-semibold" style={{ fontSize: '0.74rem' }}>
                            ⚠️ Squad Limit Reached ({team.max_squad_size})
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Links / Projector shortcut */}
            <div className="mt-auto pt-2 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
              <span className="text-white-50 text-xs">
                Active Teams: <strong>{teams.length}</strong>
              </span>
              <div className="d-flex align-items-center gap-2">
                <Link href="/auction/live" target="_blank" className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 text-xs fw-bold">
                  Open Stage Projector ↗
                </Link>
                <Link href="/auction/teams" target="_blank" className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 text-xs fw-bold">
                  Squads Board ↗
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PLAYER QUEUE DRAWER MODAL */}
      {playerDrawerOpen && (
        <div
          className="modal show d-block"
          data-bs-theme="dark"
          style={{ backgroundColor: 'rgba(2, 6, 16, 0.88)', backdropFilter: 'blur(10px)', zIndex: 1055 }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content auction-card border-secondary border-opacity-30 text-white shadow-2xl">
              {/* Header */}
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-20 text-info rounded-3 p-2 border border-info border-opacity-30 fs-5">
                    🏐
                  </div>
                  <div>
                    <h5 className="modal-title fw-extrabold text-white mb-0 fs-5">
                      {isAdmin ? 'Player Queue & Lot Selector' : 'Player Queue & Lot Explorer'}
                    </h5>
                    <span className="text-white-50 text-xs">
                      {isAdmin
                        ? 'Choose any registered, queued, or unsold player to bring to the live hammer stage'
                        : 'Browse all registered, queued, and unsold players in the PDVL tournament pool (View-Only)'}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Link
                    href="/auction/players"
                    className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 text-xs fw-bold"
                  >
                    {isAdmin ? 'Manage Pool ↗' : 'Browse Pool ↗'}
                  </Link>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setPlayerDrawerOpen(false)}
                    aria-label="Close"
                  ></button>
                </div>
              </div>

              <div className="modal-body p-4 auction-scroll-area">
                {/* Status Navigation Tabs with Live Counts */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-3 border-bottom border-secondary border-opacity-20">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <button
                      type="button"
                      className={`queue-filter-tab ${playerFilter.status === '' ? 'is-active' : ''}`}
                      onClick={() => setPlayerFilter((prev) => ({ ...prev, status: '' }))}
                    >
                      <span>All Players</span>
                      <span className="badge bg-secondary bg-opacity-40 rounded-pill text-xs">{totalCount}</span>
                    </button>
                    <button
                      type="button"
                      className={`queue-filter-tab ${playerFilter.status === 'queued' ? 'is-active' : ''}`}
                      onClick={() => setPlayerFilter((prev) => ({ ...prev, status: 'queued' }))}
                    >
                      <span>⭐ Queued / Ready</span>
                      <span className="badge bg-cyan text-dark rounded-pill text-xs">{queuedCount}</span>
                    </button>
                    <button
                      type="button"
                      className={`queue-filter-tab ${playerFilter.status === 'unsold' ? 'is-active' : ''}`}
                      onClick={() => setPlayerFilter((prev) => ({ ...prev, status: 'unsold' }))}
                    >
                      <span>⚠️ Unsold Pool (Round 2)</span>
                      <span className="badge bg-warning text-dark rounded-pill text-xs">{unsoldCount}</span>
                    </button>
                    <button
                      type="button"
                      className={`queue-filter-tab ${playerFilter.status === 'sold' ? 'is-active' : ''}`}
                      onClick={() => setPlayerFilter((prev) => ({ ...prev, status: 'sold' }))}
                    >
                      <span>✓ Sold</span>
                      <span className="badge bg-success rounded-pill text-xs">{soldCount}</span>
                    </button>
                  </div>

                  {activePlayer && (
                    <div className="d-none d-md-flex align-items-center gap-2 px-3 py-1 bg-dark bg-opacity-60 border border-warning border-opacity-30 rounded-pill">
                      <span className="spinner-grow spinner-grow-sm text-warning" role="status"></span>
                      <span className="text-white-50 text-xs">Currently on Podium:</span>
                      <strong className="text-warning text-xs font-monospace">{activePlayer.full_name}</strong>
                    </div>
                  )}
                </div>

                {/* Systematic Category Navigation Tabs with Category Counts */}
                <div className="d-flex flex-wrap align-items-center gap-1.5 mb-3 pb-2.5 border-bottom border-secondary border-opacity-15">
                  <span className="text-white-50 text-xs me-1 fw-bold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                    Category Filter:
                  </span>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold ${
                      playerFilter.category === '' ? 'btn-primary shadow-sm' : 'btn-outline-secondary text-light'
                    }`}
                    onClick={() => setPlayerFilter((prev) => ({ ...prev, category: '' }))}
                  >
                    All Categories ({totalCount})
                  </button>
                  {SYSTEMATIC_CATEGORIES.map((cat) => {
                    const isCatActive = playerFilter.category === cat.key;
                    const catPlayerCount = allPlayers.filter((p) => {
                      if (cat.key === 'unsold') return p.auction_status === 'unsold';
                      return normalizeCategory(p.player_category) === cat.key;
                    }).length;

                    return (
                      <button
                        key={cat.key}
                        type="button"
                        className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold d-flex align-items-center gap-1.5 ${
                          isCatActive ? 'btn-info text-dark shadow-sm' : 'btn-outline-secondary text-light'
                        }`}
                        onClick={() => setPlayerFilter((prev) => ({ ...prev, category: cat.key }))}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.shortLabel}</span>
                        <span
                          className={`badge rounded-pill text-xs ${
                            isCatActive ? 'bg-dark text-info' : 'bg-secondary bg-opacity-40 text-white'
                          }`}
                        >
                          {catPlayerCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Filter Toolbar: Search, Lot Selector, Position Selector */}
                <div className="row g-2 mb-3">
                  <div className="col-12 col-md-5">
                    <div className="input-group">
                      <span className="input-group-text bg-dark text-white-50 border-secondary border-opacity-30">🔍</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search player name, position, club..."
                        value={playerFilter.search}
                        onChange={(e) => setPlayerFilter((prev) => ({ ...prev, search: e.target.value }))}
                      />
                      {playerFilter.search && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setPlayerFilter((prev) => ({ ...prev, search: '' }))}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <select
                      className="form-select"
                      value={playerFilter.lot}
                      onChange={(e) => setPlayerFilter((prev) => ({ ...prev, lot: e.target.value }))}
                    >
                      <option value="">All Lots (Icon / Open / Youth)</option>
                      <option value="1">Lot 1: Icon Players</option>
                      <option value="2">Lot 2: Open Category</option>
                      <option value="3">Lot 3: Youth Categories</option>
                    </select>
                  </div>

                  <div className="col-6 col-md-4">
                    <select
                      className="form-select"
                      value={playerFilter.position}
                      onChange={(e) => setPlayerFilter((prev) => ({ ...prev, position: e.target.value }))}
                    >
                      <option value="">All Playing Positions</option>
                      <option value="setter">Setter</option>
                      <option value="outside_hitter">Outside Hitter</option>
                      <option value="opposite_hitter">Opposite Hitter</option>
                      <option value="middle_blocker">Middle Blocker</option>
                      <option value="libero">Libero</option>
                    </select>
                  </div>
                </div>

                {/* Loading State */}
                {loadingPlayers ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-info mb-2" role="status"></div>
                    <p className="text-white-50 small mb-0">Fetching tournament player registry...</p>
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="auction-card p-5 text-center my-3 border-dashed">
                    <div className="fs-1 mb-2">🔍</div>
                    <h5 className="fw-bold text-white mb-1">No Players Found</h5>
                    <p className="text-white-50 small mb-3">
                      {playerFilter.search || playerFilter.status || playerFilter.lot || playerFilter.position
                        ? 'No players matched the active search filters.'
                        : 'No players have been imported into the auction database yet.'}
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 text-xs"
                        onClick={() => setPlayerFilter({ lot: '', status: '', search: '', position: '' })}
                      >
                        Reset All Filters
                      </button>
                      <Link
                        href="/auction/players"
                        className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 text-xs fw-bold"
                      >
                        Import Players from PDVL ↗
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Cards Grid */
                  <div className="row g-2.5">
                    {filteredPlayers.map((p) => {
                      const isOnHammer = activePlayer?.id === p.id;
                      const isSold = p.auction_status === 'sold';
                      const isUnsold = p.auction_status === 'unsold';

                      return (
                        <div key={p.id} className="col-12 col-md-6 col-xl-4">
                          <div
                            className={`queue-item-card h-100 d-flex flex-column justify-content-between ${
                              isOnHammer ? 'is-on-hammer' : isSold ? 'is-sold' : ''
                            }`}
                          >
                            <div>
                              {/* Top row: Avatar + Name + Badges */}
                              <div className="d-flex align-items-start gap-2.5 mb-2">
                                <div
                                  className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center flex-shrink-0 border"
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderColor:
                                      p.player_grade === 'Icon'
                                        ? '#f59e0b'
                                        : p.player_grade === 'Grade A'
                                        ? '#06b6d4'
                                        : 'rgba(255,255,255,0.2)',
                                  }}
                                >
                                  {p.photo_url ? (
                                    <img
                                      src={p.photo_url}
                                      alt={p.full_name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: '1.25rem' }}>🏐</span>
                                  )}
                                </div>

                                <div className="flex-grow-1 min-w-0">
                                  <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                    <strong className="text-white text-truncate fs-6" title={p.full_name}>
                                      {p.full_name}
                                    </strong>
                                    {isOnHammer && (
                                      <span className="badge bg-warning text-dark px-2 py-0.5 rounded-pill text-xs fw-bold">
                                        PODIUM
                                      </span>
                                    )}
                                  </div>

                                  <div className="d-flex flex-wrap align-items-center gap-1.5">
                                    <span className={`badge px-2 py-0.5 rounded-pill text-xs fw-bold ${getCategoryBadgeClass(p.player_category)}`}>
                                      {formatCategoryLabel(p.player_category)}
                                    </span>
                                    <span className="badge badge-gold px-1.5 py-0.5 rounded-pill text-xs">
                                      {p.player_grade || 'Grade A'}
                                    </span>
                                    <span className="badge bg-secondary bg-opacity-30 text-light px-2 py-0.5 rounded-pill text-xs text-capitalize">
                                      {p.playing_position?.replace('_', ' ')}
                                    </span>
                                    <span className="badge bg-dark text-white-50 px-1.5 py-0.5 rounded-pill text-xs">
                                      Lot {p.lot_number || 1}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Details Strip */}
                              <div className="bg-dark bg-opacity-50 rounded-2 p-2 mb-2.5 small">
                                <div className="d-flex justify-content-between text-xs mb-1">
                                  <span className="text-white-50">Base Price:</span>
                                  <strong className="text-warning font-monospace">
                                    ₹{Number(p.base_price || 1000).toLocaleString()}
                                  </strong>
                                </div>
                                <div className="d-flex justify-content-between text-xs">
                                  <span className="text-white-50">Height / Club:</span>
                                  <span className="text-light text-truncate" style={{ maxWidth: '60%' }}>
                                    {p.height_cm ? `${p.height_cm} cm` : 'Unlisted'} • {p.team_name || 'Individual'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Button Strip */}
                            <div>
                              {isOnHammer ? (
                                <div className="btn btn-sm btn-outline-warning w-100 rounded-pill py-1.5 text-xs fw-bold disabled">
                                  🔴 Currently on Podium
                                </div>
                              ) : isSold ? (
                                <div className="d-flex align-items-center justify-content-between bg-success bg-opacity-15 border border-success border-opacity-30 rounded-pill px-3 py-1">
                                  <span className="text-success small fw-bold" style={{ fontSize: '0.78rem' }}>
                                    ✓ SOLD for ₹{Number(p.sold_price || 0).toLocaleString()}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link text-white-50 p-0 text-xs text-decoration-none"
                                      onClick={() => handleSelectPlayerToHammer(p)}
                                      title="Reload to hammer if needed"
                                    >
                                      Re-hammer ↻
                                    </button>
                                  )}
                                </div>
                              ) : isAdmin ? (
                                <button
                                  type="button"
                                  className={`btn btn-sm w-100 rounded-pill py-1.5 text-xs fw-extrabold d-flex align-items-center justify-content-center gap-1.5 shadow ${
                                    isUnsold
                                      ? 'btn-outline-warning'
                                      : 'btn-primary'
                                  }`}
                                  onClick={() => handleSelectPlayerToHammer(p)}
                                  disabled={actionLoading}
                                >
                                  <span>{isUnsold ? '⚡ Bring Back to Hammer (Round 2) →' : '⚡ Put on Hammer Now →'}</span>
                                </button>
                              ) : (
                                <div className={`badge w-100 rounded-pill py-1.5 text-xs fw-semibold ${
                                  isUnsold ? 'bg-warning bg-opacity-15 text-warning border border-warning border-opacity-30' : 'bg-secondary bg-opacity-25 text-white-50'
                                }`}>
                                  {isUnsold ? '⚠️ In Unsold Pool (Round 2)' : `⭐ Queued in Lot #${p.lot_number || 1}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-2.5 d-flex align-items-center justify-content-between">
                <span className="text-white-50 text-xs">
                  Showing <strong>{filteredPlayers.length}</strong> of <strong>{totalCount}</strong> players
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary rounded-pill px-4 py-1.5 text-xs"
                  onClick={() => setPlayerDrawerOpen(false)}
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CONFIRM SALE MODAL */}
      {confirmSaleModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-md modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-confirm-card text-white p-4 shadow-2xl">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-30 pb-2.5">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success text-white px-2.5 py-1 rounded-pill text-xs fw-extrabold">
                    HAMMER CALL
                  </span>
                  <h5 className="modal-title fw-extrabold text-white mb-0 fs-6">
                    Confirm Player Sale
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setConfirmSaleModal(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="text-center py-2">
                <div className="fs-1 mb-2">🔨</div>
                <h4 className="fw-black text-white mb-1 fs-5">Bring Down The Gavel?</h4>
                <p className="text-white-50 text-xs mb-3">
                  This will deduct the purse, award the player to the team roster, and broadcast the sale live.
                </p>

                <div className="bg-dark bg-opacity-70 rounded-3 p-3 border border-secondary border-opacity-30 text-start mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <span className="text-white-50 text-xs">Player:</span>
                    <strong className="text-white small fw-bold">{confirmSaleModal.player?.full_name}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <span className="text-white-50 text-xs">Winning Franchise:</span>
                    <strong className="text-info small fw-bold">{confirmSaleModal.team?.team_name} ({confirmSaleModal.team?.team_code})</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-white-50 text-xs">Final Hammer Amount:</span>
                    <strong className="text-warning font-monospace fs-5 fw-black">₹{Number(confirmSaleModal.price || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top border-secondary border-opacity-25">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                  onClick={() => setConfirmSaleModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success rounded-pill px-4 py-1.5 fw-bold text-xs shadow"
                  disabled={actionLoading}
                  onClick={executeFinalizeSale}
                >
                  {actionLoading ? 'Awarding Player...' : '✓ Confirm & Award Player'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM UNSOLD MODAL */}
      {confirmUnsoldModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-md modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-unsold-card text-white p-4 shadow-2xl">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-30 pb-2.5">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark px-2.5 py-1 rounded-pill text-xs fw-extrabold">
                    UNSOLD CONFIRMATION
                  </span>
                  <h5 className="modal-title fw-extrabold text-white mb-0 fs-6">
                    Mark Player Unsold
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setConfirmUnsoldModal(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="text-center py-2">
                <div className="fs-1 mb-2">⚠️</div>
                <h4 className="fw-black text-white mb-1 fs-5">Pass on {confirmUnsoldModal.player?.full_name}?</h4>
                <p className="text-white-50 text-xs mb-3">
                  This player will be cleared from the podium and redirected into the unsold lot pool for subsequent rounds.
                </p>
                <div className="bg-dark bg-opacity-70 rounded-3 p-2.5 border border-secondary border-opacity-30 text-start">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-white-50 text-xs">Starting Base Price:</span>
                    <strong className="text-warning font-monospace small">₹{Number(confirmUnsoldModal.basePrice || 1000).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-25">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                  onClick={() => setConfirmUnsoldModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-warning rounded-pill px-4 py-1.5 fw-bold text-dark text-xs shadow"
                  disabled={actionLoading}
                  onClick={executeMarkUnsold}
                >
                  {actionLoading ? 'Marking Unsold...' : '✓ Confirm Unsold'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM UNDO MODAL */}
      {confirmUndoModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-sm modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-confirm-card text-white p-4 text-center shadow-2xl">
              <div className="fs-1 mb-2">↺</div>
              <h5 className="fw-bold text-white mb-1 fs-6">Revert Last Action?</h5>
              <p className="text-white-50 text-xs mb-3">
                This will roll back the most recent auction sale or stage change.
              </p>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 text-xs"
                  onClick={() => setConfirmUndoModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger rounded-pill px-3.5 py-1.5 fw-bold text-xs shadow"
                  disabled={actionLoading}
                  onClick={executeUndo}
                >
                  {actionLoading ? 'Reverting...' : 'Yes, Revert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER SOLD CELEBRATION MODAL (Admin & Spectator Live) */}
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
                Hammer Fell • Official Sale
              </span>
              <h2 className="fs-3 fw-black text-white mb-1">
                PLAYER SOLD!
              </h2>
              <p className="text-white-50 text-xs mb-3">
                Official PDVL Live Auction Result
              </p>

              {/* Player Card */}
              <div className="bg-dark bg-opacity-70 rounded-3 p-3 border border-secondary border-opacity-30 mb-3 text-start">
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <span className="badge badge-cyan text-xs text-uppercase">{soldModalData.position || 'Volleyball Athlete'}</span>
                  {soldModalData.lot && <span className="text-white-50 text-xs">Lot #{soldModalData.lot}</span>}
                </div>
                <h4 className="fw-extrabold text-white mb-1 fs-5">
                  {soldModalData.playerName || soldModalData.player_name || 'Player'}
                </h4>
                {soldModalData.category && (
                  <div className="text-white-50 text-xs">
                    Category: <strong className="text-light text-capitalize">{soldModalData.category.replace('_', ' ')}</strong>
                  </div>
                )}
              </div>

              {/* Winning Team Banner */}
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
                Continue Live Console ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER UNSOLD NOTIFICATION MODAL (Admin & Spectator Live) */}
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
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge badge-cyan text-xs text-uppercase">{unsoldModalData.position || 'Athlete'}</span>
                  {unsoldModalData.basePrice && (
                    <span className="text-warning font-monospace small fw-bold">
                      Base: ₹{Number(unsoldModalData.basePrice).toLocaleString()}
                    </span>
                  )}
                </div>
                <h4 className="fw-extrabold text-white mb-1 fs-5">
                  {unsoldModalData.playerName || unsoldModalData.player_name || 'Player'}
                </h4>
                <p className="text-white-50 text-xs mb-0">
                  {unsoldModalData.message || 'Player was not claimed at base price and has been routed to the unsold lot pool.'}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold text-xs w-100"
                onClick={() => setUnsoldModalData(null)}
              >
                Acknowledge & Next Player ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
