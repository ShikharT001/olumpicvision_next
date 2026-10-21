'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { playTickSound, playFanfareSound, playSpinStartSound } from '@/lib/auction-audio';

export default function TeamsPoolingWheel({
  teams = [],
  tournament = null,
  tournamentId: propTournamentId,
  isAdmin = false,
  onPoolsUpdated = null,
}) {
  const activeTournamentId = propTournamentId || tournament?.id || tournament?.slug;

  // Number of pools: 2 ('Pool A', 'Pool B'), 3, or 4
  const [numPools, setNumPools] = useState(2);
  const poolNames = useMemo(() => {
    const letters = ['A', 'B', 'C', 'D'];
    return letters.slice(0, numPools).map((l) => `Pool ${l}`);
  }, [numPools]);

  // Initial pools mapping: { 'Pool A': [team1, ...], 'Pool B': [team2, ...] }
  const [pools, setPools] = useState(() => {
    const initial = {};
    const letters = ['A', 'B', 'C', 'D'];
    letters.forEach((l) => {
      initial[`Pool ${l}`] = [];
    });
    // If teams have existing pool tags from backend
    teams.forEach((t) => {
      if (t.pool && initial[t.pool]) {
        initial[t.pool].push(t);
      }
    });
    return initial;
  });

  // Calculate drawn teams and remaining teams
  const drawnTeamIds = useMemo(() => {
    return Object.values(pools).flatMap((arr) => arr.map((t) => t.id));
  }, [pools]);

  const remainingTeams = useMemo(() => {
    return teams.filter((t) => !drawnTeamIds.includes(t.id));
  }, [teams, drawnTeamIds]);

  // Determine next target pool in systematic round-robin sequence (Pool A -> Pool B -> Pool A...)
  const targetPoolName = useMemo(() => {
    const drawnCount = drawnTeamIds.length;
    return poolNames[drawnCount % poolNames.length];
  }, [drawnTeamIds, poolNames]);

  // Wheel animation state
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [drawOutcomeModal, setDrawOutcomeModal] = useState(null);
  const [savingStatus, setSavingStatus] = useState(''); // 'saving' | 'saved' | 'error'
  const [saveMessage, setSaveMessage] = useState('');

  // Ticker sound timer ref
  const tickIntervalRef = useRef(null);

  // Stop sound ticker on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  // Spin the wheel
  const handleSpinWheel = useCallback(() => {
    if (isSpinning || remainingTeams.length === 0) return;

    setIsSpinning(true);
    playSpinStartSound();

    const n = remainingTeams.length;
    const sliceAngle = 360 / n;

    // Pick a random winner among remaining teams
    const winningIndex = Math.floor(Math.random() * n);
    const winningTeam = remainingTeams[winningIndex];

    // The arrow is at the top (angle = 270 deg or 0 deg depending on coordinate system).
    // In our SVG, slice 0 starts at angle 0.
    // If pointer is at Top (270 deg), the slice that aligns with 270 deg after rotation `R` is:
    // (270 - R) % 360 in slice range [i * sliceAngle, (i+1) * sliceAngle].
    // Target slice midpoint angle in wheel coordinate:
    const sliceMid = (winningIndex + 0.5) * sliceAngle;
    // We want the wheel rotation R such that (270 - R) = sliceMid (mod 360), so R = 270 - sliceMid.
    // Plus random small jitter (-12 to +12 deg) inside the slice:
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.6);
    const targetBaseRotation = (270 - (sliceMid + jitter) + 360) % 360;

    // Add 6 to 9 full spins for suspense
    const extraSpins = (6 + Math.floor(Math.random() * 3)) * 360;
    const currentNormalized = wheelRotation % 360;
    const delta = (targetBaseRotation - currentNormalized + 360) % 360 + extraSpins;
    const finalRotation = wheelRotation + delta;

    setWheelRotation(finalRotation);

    // Audio click ticker that decelerates
    let tickCount = 0;
    const totalTicks = 45;
    const startTime = Date.now();
    const duration = 3800;

    const playTicksLoop = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) return;

      playTickSound(500 + Math.random() * 120);
      tickCount++;

      // Ease out delay
      const progress = elapsed / duration;
      const nextDelay = Math.max(35, Math.min(280, 40 + progress * progress * 320));
      setTimeout(playTicksLoop, nextDelay);
    };
    playTicksLoop();

    // Wheel stop trigger
    setTimeout(() => {
      setIsSpinning(false);
      playFanfareSound();

      // Allocate team to the current target pool in systematic round-robin order
      const assignedPool = targetPoolName;
      setPools((prev) => ({
        ...prev,
        [assignedPool]: [...(prev[assignedPool] || []), winningTeam],
      }));

      // Show celebration modal
      setDrawOutcomeModal({
        team: winningTeam,
        pool: assignedPool,
      });
    }, duration + 50);
  }, [isSpinning, remainingTeams, wheelRotation, targetPoolName]);

  // Remove a team from a pool (returns them back to the wheel)
  const handleRemoveTeamFromPool = (poolName, teamId) => {
    setPools((prev) => ({
      ...prev,
      [poolName]: prev[poolName].filter((t) => t.id !== teamId),
    }));
  };

  // Reset entire draw
  const handleResetDraw = () => {
    if (confirm('Are you sure you want to reset all pools and return all teams to the spin wheel?')) {
      const empty = {};
      poolNames.forEach((p) => {
        empty[p] = [];
      });
      setPools(empty);
      setSaveMessage('Pool draw reset. All teams returned to wheel.');
    }
  };

  // Quick auto-draw all remaining teams systematically
  const handleAutoDrawAll = () => {
    if (remainingTeams.length === 0) return;
    const shuffled = [...remainingTeams].sort(() => Math.random() - 0.5);
    const updated = { ...pools };
    let currIndex = drawnTeamIds.length;

    shuffled.forEach((team) => {
      const pName = poolNames[currIndex % poolNames.length];
      updated[pName] = [...(updated[pName] || []), team];
      currIndex++;
    });

    setPools(updated);
    playFanfareSound();
    setSaveMessage('All remaining teams have been automatically drawn into pools!');
  };

  // Save official pool draw to backend API
  const handleSavePools = async () => {
    setSavingStatus('saving');
    setSaveMessage('');
    try {
      const res = await fetch('/api/auction/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_pools',
          tournamentId: activeTournamentId,
          pools,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save pools');

      setSavingStatus('saved');
      setSaveMessage('✓ Official pool allocations saved successfully!');
      if (onPoolsUpdated) onPoolsUpdated(pools);
      setTimeout(() => setSavingStatus(''), 4000);
    } catch (err) {
      setSavingStatus('error');
      setSaveMessage(err.message || 'Error saving pools');
    }
  };

  // SVG Geometry Constants
  const size = 480;
  const center = size / 2;
  const radius = 220;
  const hubRadius = 52;
  const n = remainingTeams.length;
  const sliceAngle = n > 0 ? 360 / n : 0;

  return (
    <div className="tournament-pools-container">
      {/* Top Banner */}
      <div
        className="auction-card p-4 mb-4 position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(10, 20, 40, 0.96) 100%)',
          borderLeft: '6px solid #06b6d4',
        }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1.5">
              <span className="badge badge-cyan px-3 py-1 rounded-pill text-xs fw-black text-uppercase">
                🎡 TOURNAMENT DRAW SYSTEM
              </span>
              <span className="badge bg-secondary bg-opacity-35 text-white-50 px-2 py-0.5 rounded-pill text-xs">
                {tournament?.tournament_name || 'Tournament'} • Group Stage Pools
              </span>
            </div>
            <h2 className="fs-3 fw-black text-white mb-1 tracking-tight">
              Interactive Team Pooling & Spin Wheel Draw
            </h2>
            <p className="text-white-50 text-xs mb-0">
              Spin the circular pie-chart wheel to systematically assign competing franchises into Pool A, Pool B, and beyond in a live televised lottery draw.
            </p>
          </div>

          {/* Target Pool Callout */}
          <div className="text-end ms-auto">
            {remainingTeams.length > 0 ? (
              <div className="p-2.5 rounded-3 bg-black bg-opacity-50 border border-info border-opacity-30">
                <span className="text-white-50 text-xs d-block mb-1 text-uppercase fw-bold" style={{ letterSpacing: '0.04em' }}>
                  Next Spin Draws For:
                </span>
                <strong className="fs-4 fw-black text-info font-monospace d-flex align-items-center justify-content-end gap-1.5">
                  <span>🎯</span>
                  <span>{targetPoolName}</span>
                </strong>
                <span className="text-white-50 text-xs">
                  {remainingTeams.length} Franchises remaining on wheel
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-3 bg-success bg-opacity-20 border border-success border-opacity-40">
                <span className="badge bg-success rounded-pill px-3 py-1 text-xs fw-black text-uppercase">
                  ✓ DRAW COMPLETE
                </span>
                <span className="text-white text-xs d-block mt-1 font-monospace fw-bold">
                  All {teams.length} teams assigned
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="auction-card p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Pool Configuration Tabs */}
        <div className="d-flex align-items-center gap-2">
          <span className="text-white-50 text-xs fw-bold text-uppercase" style={{ letterSpacing: '0.04em' }}>
            Pool Format:
          </span>
          {[2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold ${
                numPools === num ? 'btn-info text-dark shadow-sm' : 'btn-outline-secondary text-light'
              }`}
              onClick={() => {
                if (!isSpinning && (drawnTeamIds.length === 0 || confirm('Changing pool count will reconfigure groups. Proceed?'))) {
                  setNumPools(num);
                }
              }}
              disabled={isSpinning}
            >
              {num} Pools ({num === 2 ? 'A & B' : num === 3 ? 'A, B & C' : 'A, B, C & D'})
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
          {remainingTeams.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 text-xs fw-bold"
              onClick={handleAutoDrawAll}
              disabled={isSpinning}
            >
              ⚡ Auto-Draw All
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 text-xs fw-bold"
            onClick={handleResetDraw}
            disabled={isSpinning || drawnTeamIds.length === 0}
          >
            ↺ Reset Draw
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-4 py-1 text-xs fw-black ${
                savingStatus === 'saved' ? 'btn-success' : 'btn-warning text-dark'
              }`}
              onClick={handleSavePools}
              disabled={isSpinning || savingStatus === 'saving'}
            >
              {savingStatus === 'saving' ? 'Saving...' : savingStatus === 'saved' ? '✓ Saved' : '💾 Save Official Draw'}
            </button>
          )}
        </div>
      </div>

      {saveMessage && (
        <div
          className={`alert ${
            savingStatus === 'error' ? 'alert-danger' : 'alert-success'
          } alert-dismissible fade show border-0 shadow-sm py-2 px-3 small d-flex align-items-center justify-content-between mb-3`}
        >
          <span>{saveMessage}</span>
          <button type="button" className="btn-close py-2" onClick={() => setSaveMessage('')} aria-label="Close"></button>
        </div>
      )}

      {/* Main Wheel & Group Boards Row */}
      <div className="row g-4 align-items-start">
        {/* LEFT COLUMN: THE CIRCULAR PIE CHART SPIN WHEEL */}
        <div className="col-12 col-lg-6 col-xl-5 text-center">
          <div className="auction-card p-4 position-relative d-flex flex-column align-items-center justify-content-center shadow-2xl">
            <div className="d-flex align-items-center justify-content-between w-100 mb-2">
              <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                Interactive Lottery Wheel
              </span>
              <span className="text-white-50 text-xs font-monospace">
                Click wheel or center to spin
              </span>
            </div>

            {/* WHEEL SVG STAGE */}
            <div
              className="position-relative my-2"
              style={{
                width: size,
                maxWidth: '100%',
                aspectRatio: '1/1',
                filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.7))',
                cursor: remainingTeams.length > 0 && !isSpinning ? 'pointer' : 'default',
              }}
              onClick={handleSpinWheel}
            >
              {/* Outer Metallic Bezel Ring */}
              <svg
                viewBox={`0 0 ${size} ${size}`}
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
              >
                <defs>
                  {/* Chrome Bezel Shadow */}
                  <filter id="bezel-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.8" />
                  </filter>
                  <radialGradient id="hub-metallic" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#e2e8f0" />
                    <stop offset="70%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </radialGradient>
                  <linearGradient id="arrow-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="40%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                </defs>

                {/* Outer Bezel */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius + 12}
                  fill="#0a1428"
                  stroke="#334155"
                  strokeWidth="8"
                  filter="url(#bezel-shadow)"
                />

                {/* Decorative Rivets on Rim */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 360) / 24;
                  const rad = (angle * Math.PI) / 180;
                  const rx = center + (radius + 12) * Math.cos(rad);
                  const ry = center + (radius + 12) * Math.sin(rad);
                  return (
                    <circle
                      key={`rivet-${i}`}
                      cx={rx}
                      cy={ry}
                      r="3"
                      fill="#e2e8f0"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* ROTATING SLICES GROUP */}
                <g
                  style={{
                    transformOrigin: `${center}px ${center}px`,
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning
                      ? 'transform 3.8s cubic-bezier(0.12, 0.8, 0.32, 1)'
                      : 'none',
                  }}
                >
                  {remainingTeams.length === 0 ? (
                    // Wheel Complete Trophy State
                    <g>
                      <circle cx={center} cy={center} r={radius} fill="#0f1f3d" stroke="#f59e0b" strokeWidth="4" />
                      <text
                        x={center}
                        y={center - 20}
                        textAnchor="middle"
                        fill="#f59e0b"
                        fontSize="20"
                        fontWeight="900"
                        letterSpacing="1"
                      >
                        ALL TEAMS DRAWN!
                      </text>
                      <text
                        x={center}
                        y={center + 15}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="13"
                      >
                        Pools finalized successfully
                      </text>
                    </g>
                  ) : (
                    // Pie Chart Slices for each remaining team
                    remainingTeams.map((team, idx) => {
                      const startAngle = idx * sliceAngle;
                      const endAngle = (idx + 1) * sliceAngle;
                      const midAngle = startAngle + sliceAngle / 2;

                      // Trigonometric coordinates for wedge arc
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      const x1 = center + radius * Math.cos(startRad);
                      const y1 = center + radius * Math.sin(startRad);
                      const x2 = center + radius * Math.cos(endRad);
                      const y2 = center + radius * Math.sin(endRad);

                      const largeArc = sliceAngle > 180 ? 1 : 0;
                      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                      return (
                        <g key={team.id}>
                          {/* Segment Wedge */}
                          <path
                            d={pathData}
                            fill={team.primary_color || '#0d6efd'}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            strokeOpacity="0.4"
                          />

                          {/* Radial Team Text along wedge mid-angle */}
                          <g
                            transform={`rotate(${midAngle}, ${center}, ${center}) translate(${center + radius * 0.62}, ${center})`}
                          >
                            <text
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#ffffff"
                              fontSize={n > 8 ? '10' : n > 6 ? '11.5' : '13'}
                              fontWeight="900"
                              style={{
                                textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
                                letterSpacing: '0.04em',
                                userSelect: 'none',
                              }}
                            >
                              {team.team_code} • {team.team_name.length > 14 ? team.team_name.slice(0, 13) + '…' : team.team_name}
                            </text>
                          </g>
                        </g>
                      );
                    })
                  )}
                </g>

                {/* CENTER HUB & DIRECTION ARROW (FIXED IN CENTER POINTING UPWARD/TOWARDS TOP EDGE) */}
                {/* Center needle / arrow that points towards top slice */}
                <g filter="url(#bezel-shadow)">
                  {/* Central Arrow Pointing directly North towards top perimeter */}
                  <path
                    d={`M ${center - 14} ${center - 32} 
                        L ${center} ${center - 68} 
                        L ${center + 14} ${center - 32} 
                        Z`}
                    fill="url(#arrow-gold)"
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter="drop-shadow(0 0 8px rgba(245, 158, 11, 0.9))"
                  />
                  {/* Needle Counter-tail */}
                  <path
                    d={`M ${center - 8} ${center + 30} 
                        L ${center} ${center + 46} 
                        L ${center + 8} ${center + 30} 
                        Z`}
                    fill="#334155"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                  {/* Center Metallic Hub Body */}
                  <circle
                    cx={center}
                    cy={center}
                    r={hubRadius}
                    fill="url(#hub-metallic)"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    filter="drop-shadow(0 4px 12px rgba(0,0,0,0.7))"
                  />
                  <circle
                    cx={center}
                    cy={center}
                    r={hubRadius - 6}
                    fill="#0f172a"
                  />

                  {/* Center Hub Interactive Action Label */}
                  <text
                    x={center}
                    y={center - 8}
                    textAnchor="middle"
                    fill={isSpinning ? '#06b6d4' : '#f59e0b'}
                    fontSize="13"
                    fontWeight="900"
                    letterSpacing="1"
                    style={{ userSelect: 'none' }}
                  >
                    {isSpinning ? 'SPINNING' : remainingTeams.length === 0 ? 'DRAW' : 'SPIN'}
                  </text>
                  <text
                    x={center}
                    y={center + 12}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="800"
                    style={{ userSelect: 'none' }}
                  >
                    {isSpinning ? '...' : remainingTeams.length === 0 ? 'DONE' : `FOR ${targetPoolName.toUpperCase()}`}
                  </text>
                </g>
              </svg>
            </div>

            {/* One-Click Spin Action Button below wheel */}
            <div className="w-100 mt-3">
              <button
                type="button"
                className={`btn btn-lg w-100 rounded-pill py-2.5 fw-black text-sm d-flex align-items-center justify-content-center gap-2 shadow-lg transition-all ${
                  isSpinning
                    ? 'btn-secondary disabled'
                    : remainingTeams.length === 0
                    ? 'btn-outline-success disabled'
                    : 'btn-warning text-dark'
                }`}
                onClick={handleSpinWheel}
                disabled={isSpinning || remainingTeams.length === 0}
              >
                <span>{isSpinning ? '⏳' : '🎯'}</span>
                <span>
                  {isSpinning
                    ? 'Wheel in Motion...'
                    : remainingTeams.length === 0
                    ? 'All Teams Assigned to Pools'
                    : `SPIN WHEEL FOR ${targetPoolName.toUpperCase()} ➔`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GROUP STAGE POOLS BOARDS */}
        <div className="col-12 col-lg-6 col-xl-7">
          <div className="row g-3">
            {poolNames.map((poolName, poolIdx) => {
              const assigned = pools[poolName] || [];
              const isTargetNext = targetPoolName === poolName && remainingTeams.length > 0;
              const poolThemeColor =
                poolIdx === 0 ? '#10b981' : poolIdx === 1 ? '#f59e0b' : poolIdx === 2 ? '#06b6d4' : '#8b5cf6';

              return (
                <div key={poolName} className={numPools > 2 ? 'col-12 col-md-6' : 'col-12'}>
                  <div
                    className={`auction-card p-3.5 h-100 transition-all ${
                      isTargetNext ? 'auction-card-glow' : ''
                    }`}
                    style={{
                      borderLeft: `5px solid ${poolThemeColor}`,
                    }}
                  >
                    {/* Pool Card Header */}
                    <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2.5 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge rounded-pill px-3 py-1 text-xs fw-black text-uppercase shadow-sm"
                          style={{ backgroundColor: poolThemeColor, color: '#0b1120' }}
                        >
                          {poolName}
                        </span>
                        <strong className="text-white small">Group Stage Roster</strong>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {isTargetNext && (
                          <span className="badge bg-info text-dark rounded-pill px-2.5 py-0.5 text-xs fw-extrabold animate-pulse">
                            ● NEXT IN DRAW
                          </span>
                        )}
                        <span className="badge bg-secondary bg-opacity-35 text-white-50 rounded-pill text-xs font-monospace">
                          {assigned.length} Teams
                        </span>
                      </div>
                    </div>

                    {/* Assigned Teams in this Pool */}
                    {assigned.length === 0 ? (
                      <div className="p-4 text-center rounded-3 bg-black bg-opacity-25 border border-secondary border-opacity-20 text-white-50 text-xs">
                        <span>Awaiting first team spin for {poolName}...</span>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush rounded-3 overflow-hidden border border-secondary border-opacity-20">
                        {assigned.map((team, tIdx) => (
                          <div
                            key={team.id}
                            className="list-group-item bg-dark bg-opacity-50 text-white border-secondary border-opacity-15 p-2.5 d-flex align-items-center justify-content-between"
                          >
                            <div className="d-flex align-items-center gap-2.5">
                              {/* Seed Tag (A1, A2, etc.) */}
                              <span
                                className="badge rounded-pill text-xs fw-black font-monospace px-2 py-1"
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  color: poolThemeColor,
                                  border: `1px solid ${poolThemeColor}66`,
                                }}
                              >
                                {poolName.replace('Pool ', '')}{tIdx + 1}
                              </span>

                              {/* Team Emblem Badge */}
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white text-xs fw-black shadow-sm"
                                style={{
                                  width: 34,
                                  height: 34,
                                  backgroundColor: team.primary_color || '#0d6efd',
                                }}
                              >
                                {team.team_code}
                              </div>

                              <div>
                                <strong className="text-white text-xs d-block">{team.team_name}</strong>
                                <span className="text-white-50 text-xs">
                                  Owner: {team.owner_name || 'Management'}
                                </span>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-secondary bg-opacity-30 text-light text-xs font-monospace">
                                Squad: {team.squad?.length || team.squad_count || 0}
                              </span>

                              {/* Return team back to wheel button */}
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-white-50 p-0 text-xs text-decoration-none hover-text-danger"
                                onClick={() => handleRemoveTeamFromPool(poolName, team.id)}
                                title="Remove team from pool and return to spin wheel"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pending slot placeholder for remaining draw */}
                    {remainingTeams.length > 0 && (
                      <div className="mt-2.5 p-2 rounded-2 border border-secondary border-opacity-20 border-dashed text-center text-white-50 text-xs bg-black bg-opacity-15">
                        <span>
                          Slot {poolName.replace('Pool ', '')}{assigned.length + 1}: Open for lottery draw
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DRAW OUTCOME CELEBRATION MODAL */}
      {drawOutcomeModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-md modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card text-white text-center p-4 shadow-2xl position-relative overflow-hidden">
              <div
                className="modal-action-avatar text-white shadow-lg mx-auto mb-2"
                style={{
                  backgroundColor: drawOutcomeModal.team.primary_color || '#0d6efd',
                  fontSize: '1.75rem',
                }}
              >
                🎉
              </div>

              <span className="badge badge-gold px-3 py-1 rounded-pill text-xs fw-black text-uppercase mx-auto mb-2">
                Official Lottery Spin Result
              </span>

              <h2 className="fs-3 fw-black text-white mb-1">
                TEAM DRAWN!
              </h2>
              <p className="text-white-50 text-xs mb-3">
                Assigned to tournament group stage
              </p>

              {/* Franchise Profile Card */}
              <div
                className="rounded-3 p-3 border mb-3 d-flex align-items-center justify-content-between shadow-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderColor: drawOutcomeModal.team.primary_color || '#f59e0b',
                }}
              >
                <div className="d-flex align-items-center gap-3 text-start">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black font-monospace text-sm shadow"
                    style={{
                      width: 48,
                      height: 48,
                      background: drawOutcomeModal.team.primary_color || '#0d6efd',
                    }}
                  >
                    {drawOutcomeModal.team.team_code}
                  </div>
                  <div>
                    <h4 className="fw-black text-white mb-0 fs-5">{drawOutcomeModal.team.team_name}</h4>
                    <span className="text-white-50 text-xs">
                      Owner: {drawOutcomeModal.team.owner_name || 'Management'}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-white-50 text-xs d-block">Drawn Into</span>
                  <span
                    className="badge rounded-pill px-3 py-1.5 text-xs fw-black text-uppercase"
                    style={{
                      backgroundColor:
                        drawOutcomeModal.pool === 'Pool A'
                          ? '#10b981'
                          : drawOutcomeModal.pool === 'Pool B'
                          ? '#f59e0b'
                          : '#06b6d4',
                      color: '#0b1120',
                    }}
                  >
                    {drawOutcomeModal.pool}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-warning rounded-pill px-4 py-2 fw-black text-dark w-100 shadow"
                onClick={() => setDrawOutcomeModal(null)}
              >
                Continue Pool Draw ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
