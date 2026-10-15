'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import Link from 'next/link';

export default function AuctioneerConsole({ initialData }) {
  const [data, setData] = useState(initialData || {});
  const [liveNotification, setLiveNotification] = useState(initialData?.lastNotification || null);
  const [selectedIncrement, setSelectedIncrement] = useState(500);
  const [customBidInput, setCustomBidInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');
  const [playerDrawerOpen, setPlayerDrawerOpen] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerFilter, setPlayerFilter] = useState({ lot: '', status: 'queued', search: '' });
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const lastNotifIdRef = useRef(initialData?.lastNotification?.id || null);
  const [, startTransition] = useTransition();

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/auction/state');
      if (res.ok) {
        const json = await res.json();
        if (json.lastNotification && json.lastNotification.id !== lastNotifIdRef.current) {
          lastNotifIdRef.current = json.lastNotification.id;
          setLiveNotification(json.lastNotification);
        }
        setData(json);
      }
    } catch {
      // Ignore background heartbeat error
    }
  }, []);

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
        body: JSON.stringify({ teamId: team.id, bidAmount: bidToPlace }),
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
        body: JSON.stringify({ action: 'stage', stage }),
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

  // Finalize Sale
  const handleFinalizeSale = async () => {
    if (!activePlayer || !highestTeam || currentBid <= 0) {
      setError('Cannot mark as Sold without an active high bidder.');
      return;
    }

    if (!window.confirm(`CONFIRM SALE:\n\nPlayer: ${activePlayer.full_name}\nWinning Team: ${highestTeam.team_name}\nSold Price: ₹${currentBid.toLocaleString()}\n\nProceed to deduct purse and award player?`)) {
      return;
    }

    setError('');
    setActionLoading(true);
    try {
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sold' }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Sale finalization failed');

      const soldMsg = resData.message || `${activePlayer.full_name} sold to ${highestTeam.team_name} at ₹${currentBid.toLocaleString()}`;
      if (resData.notification) {
        setLiveNotification(resData.notification);
      } else {
        setLiveNotification({
          type: 'sold',
          message: soldMsg,
          playerName: activePlayer.full_name,
          teamName: highestTeam.team_name,
          price: currentBid,
          timestamp: new Date().toISOString(),
        });
      }
      setActionMessage(soldMsg);
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Unsold
  const handleMarkUnsold = async () => {
    if (!activePlayer) return;

    if (!window.confirm(`Mark ${activePlayer.full_name} as UNSOLD and clear the podium?`)) {
      return;
    }

    setError('');
    setActionLoading(true);
    try {
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsold' }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to mark unsold');

      const unsoldMsg = resData.message || `${activePlayer.full_name} remained UNSOLD and moved to the unsold pool.`;
      if (resData.notification) {
        setLiveNotification(resData.notification);
      } else {
        setLiveNotification({
          type: 'unsold',
          message: unsoldMsg,
          playerName: activePlayer.full_name,
          timestamp: new Date().toISOString(),
        });
      }
      setActionMessage(unsoldMsg);
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Undo Last Action
  const handleUndo = async () => {
    if (!window.confirm('Revert the last auction action/sale?')) return;
    setError('');
    setActionLoading(true);
    try {
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'undo' }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Undo failed');

      setActionMessage(resData.message || 'Action reverted.');
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Load Players Drawer
  const openPlayerDrawer = async () => {
    setPlayerDrawerOpen(true);
    setLoadingPlayers(true);
    try {
      const res = await fetch('/api/auction/players');
      if (res.ok) {
        const json = await res.json();
        setAllPlayers(json.players || []);
      }
    } catch {
      // Ignore
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
        body: JSON.stringify({ action: 'select', playerId: player.id }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to load player');

      setPlayerDrawerOpen(false);
      setActionMessage(`Now on hammer: ${player.full_name}`);
      fetchState();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter players in drawer
  const filteredPlayers = allPlayers.filter((p) => {
    if (playerFilter.status && p.auction_status !== playerFilter.status) return false;
    if (playerFilter.lot && p.lot_number !== Number(playerFilter.lot)) return false;
    if (playerFilter.search) {
      const term = playerFilter.search.toLowerCase();
      return (
        p.full_name?.toLowerCase().includes(term) ||
        p.playing_position?.toLowerCase().includes(term) ||
        p.player_category?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
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
                <span className="badge badge-cyan px-2 py-1 rounded-pill text-xs text-uppercase fw-bold">Podium Active</span>
                <span className="ms-2 text-white-50 text-xs">PDVL 2026/27 Official Auction</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-info rounded-pill px-3 py-1 fw-bold text-xs d-inline-flex align-items-center gap-1.5"
                onClick={openPlayerDrawer}
              >
                <span>Change Player Queue</span>
                <span className="badge bg-info text-dark rounded-pill">☰</span>
              </button>
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
                    <span className="badge bg-secondary bg-opacity-25 text-light text-capitalize px-2 py-0.5 rounded-pill text-xs">
                      {activePlayer.player_category?.replace('_', ' ') || 'Palghar Open'}
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
                <span className="fs-1 d-block mb-2">🏐</span>
                <h5 className="fw-bold text-white mb-1">No Player on Hammer</h5>
                <p className="text-secondary small mb-3">Select a player from the queue to start bidding.</p>
                <button type="button" className="btn btn-primary rounded-pill px-4 py-2 fw-bold text-sm" onClick={openPlayerDrawer}>
                  Select Next Player
                </button>
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
              <span className="text-white-50 text-xs d-block mb-2 text-uppercase fw-bold">Gavel Stage Controls</span>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <button
                  type="button"
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold text-xs flex-fill ${state.hammer_stage === 1 ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                  onClick={() => handleHammerAdvance(1)}
                  disabled={!activePlayer || currentBid === 0 || actionLoading}
                >
                  ⚡ Going 1
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold text-xs flex-fill ${state.hammer_stage === 2 ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                  onClick={() => handleHammerAdvance(2)}
                  disabled={!activePlayer || currentBid === 0 || actionLoading}
                >
                  ⚡⚡ Going 2
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-success rounded-3 px-4 py-2 fw-bold text-xs flex-fill shadow-sm"
                  onClick={handleFinalizeSale}
                  disabled={!activePlayer || !highestTeam || currentBid <= 0 || actionLoading}
                >
                  🔨 SOLD!
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger rounded-3 px-3 py-2 fw-bold text-xs"
                  onClick={handleMarkUnsold}
                  disabled={!activePlayer || actionLoading}
                >
                  ✕ Unsold
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-3 px-2.5 py-2 fw-semibold text-xs"
                  onClick={handleUndo}
                  disabled={actionLoading}
                  title="Undo last action"
                >
                  ↺ Undo
                </button>
              </div>
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
                  <span>Physical Paddle Attribution</span>
                </h5>
                <span className="text-white-50 text-xs">
                  Next Minimum: <strong className="text-warning">₹{nextMinBid.toLocaleString()}</strong>
                </span>
              </div>

              {/* Increment Pills */}
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
            </div>

            {/* Team Paddle Grid: 1-Click raises bid for the team holding their paddle */}
            <div className="flex-grow-1 overflow-auto pe-1 mb-3" style={{ maxHeight: '420px' }}>
              <span className="text-white-50 text-xs d-block mb-2 text-uppercase fw-semibold" style={{ letterSpacing: '0.04em' }}>
                Click team that raised physical paddle:
              </span>

              <div className="row g-2">
                {teams.map((team) => {
                  const isHigh = highestTeam?.id === team.id;
                  const bidAmountToPlace = customBidInput ? Number(customBidInput) : nextMinBid;
                  const hasPurse = Number(team.remaining_purse) >= bidAmountToPlace;
                  const isFull = team.squad_count >= team.max_squad_size;
                  const canBid = hasPurse && !isFull && activePlayer && !actionLoading;

                  return (
                    <div key={team.id} className="col-12 col-sm-6">
                      <button
                        type="button"
                        className={`team-paddle-btn w-100 ${isHigh ? 'is-highest-bidder' : ''}`}
                        style={{ '--team-color': team.primary_color || '#0d6efd' }}
                        onClick={() => handleTeamPaddleClick(team)}
                        disabled={!canBid}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <span
                            className="badge px-2.5 py-1 rounded-pill text-xs fw-extrabold shadow-sm"
                            style={{ backgroundColor: team.primary_color || '#0d6efd', color: '#fff' }}
                          >
                            {team.team_code}
                          </span>
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

                        <div className="mt-2 pt-1 border-top border-secondary border-opacity-15 d-flex align-items-center justify-content-between">
                          <span className="text-white-50 text-xs">Raise Paddle:</span>
                          <span className="badge bg-primary text-white px-2 py-0.5 rounded-pill text-xs fw-bold">
                            +₹{bidAmountToPlace.toLocaleString()} ↗
                          </span>
                        </div>

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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content auction-card border-secondary text-white">
              <div className="modal-header border-secondary border-opacity-25">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <span>Player Queue & Lot Selector</span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setPlayerDrawerOpen(false)} aria-label="Close"></button>
              </div>

              <div className="modal-body">
                {/* Search & Filters */}
                <div className="row g-2 mb-3">
                  <div className="col-12 col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      placeholder="Search player name, position..."
                      value={playerFilter.search}
                      onChange={(e) => setPlayerFilter((prev) => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <div className="col-6 col-sm-3">
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary"
                      value={playerFilter.status}
                      onChange={(e) => setPlayerFilter((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">All Statuses</option>
                      <option value="queued">Queued / Ready</option>
                      <option value="unsold">Unsold (Round 2)</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                  <div className="col-6 col-sm-3">
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary"
                      value={playerFilter.lot}
                      onChange={(e) => setPlayerFilter((prev) => ({ ...prev, lot: e.target.value }))}
                    >
                      <option value="">All Lots</option>
                      <option value="1">Lot 1: Icon Players</option>
                      <option value="2">Lot 2: Open Category</option>
                      <option value="3">Lot 3: Youth Categories</option>
                    </select>
                  </div>
                </div>

                {loadingPlayers ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-info" role="status"></div>
                    <span className="ms-2 text-white-50 text-sm">Loading player pool...</span>
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-4 text-white-50 small">
                    No players matching filter. Check player pool or import from PDVL registrations.
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {filteredPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="list-group-item bg-transparent text-white border-secondary border-opacity-20 d-flex align-items-center justify-content-between p-2.5 hover-bg-light"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                            {p.photo_url ? (
                              <img src={p.photo_url} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span className="text-secondary small">🏐</span>
                            )}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <strong className="text-white small">{p.full_name}</strong>
                              <span className="badge badge-gold px-1.5 py-0.5 text-xs">{p.player_grade || 'Grade A'}</span>
                              <span className="badge bg-secondary bg-opacity-25 text-white-50 text-xs text-capitalize">
                                {p.playing_position?.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-white-50 text-xs">
                              Base: <strong className="text-warning">₹{Number(p.base_price || 1000).toLocaleString()}</strong> • {p.height_cm ? `${p.height_cm}cm` : 'Height unlisted'} • {p.team_name || 'Individual'}
                            </span>
                          </div>
                        </div>

                        <div>
                          {p.auction_status === 'sold' ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 text-xs">
                              SOLD for ₹{Number(p.sold_price || 0).toLocaleString()}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary rounded-pill px-3 py-1 text-xs fw-bold"
                              onClick={() => handleSelectPlayerToHammer(p)}
                            >
                              Put on Hammer →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer border-secondary border-opacity-25">
                <Link href="/auction/players" className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 text-xs fw-bold me-auto">
                  Manage Full Player Pool & Import ↗
                </Link>
                <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3 py-1.5 text-xs" onClick={() => setPlayerDrawerOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
