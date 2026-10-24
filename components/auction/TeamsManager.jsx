'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { formatRupees, formatCategoryLabel, getCategoryBadgeClass } from '@/lib/sports-config';

const PRESET_COLORS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Blaze Orange', hex: '#ea580c' },
  { name: 'Cyber Purple', hex: '#7c3aed' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Neon Cyan', hex: '#0891b2' },
  { name: 'Hot Pink', hex: '#db2777' },
];

const QUICK_PURSES = [
  { label: '₹50,000', value: 50000 },
  { label: '₹1.0 Lakh', value: 100000 },
  { label: '₹1.5 Lakh', value: 150000 },
  { label: '₹2.0 Lakh', value: 200000 },
  { label: '₹5.0 Lakh', value: 500000 },
];

export default function TeamsManager({ initialTeams, tournament = null, tournamentId: propTournamentId }) {
  const activeTournamentId = propTournamentId || tournament?.id || tournament?.slug;
  const [teams, setTeams] = useState(initialTeams || []);
  const [selectedTeamId, setSelectedTeamId] = useState(null); // null = "All Teams"
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalError, setModalError] = useState('');
  const [teamRegisteredModal, setTeamRegisteredModal] = useState(null);
  const [teamUpdatedModal, setTeamUpdatedModal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Status Change Modal State for acquired players
  const [statusModalPlayer, setStatusModalPlayer] = useState(null);
  const [statusFormData, setStatusFormData] = useState({
    status: 'unsold',
    sold_price: 0,
  });

  const defaultPurse = tournament?.default_purse ? Number(tournament.default_purse) : 100000;
  const defaultMinSquad = tournament?.min_squad_size ? Number(tournament.min_squad_size) : 8;
  const defaultMaxSquad = tournament?.max_squad_size ? Number(tournament.max_squad_size) : 12;

  const [formData, setFormData] = useState({
    team_name: '',
    team_code: '',
    logo_url: '',
    owner_name: '',
    coach_name: '',
    initial_purse: defaultPurse,
    min_squad_size: defaultMinSquad,
    max_squad_size: defaultMaxSquad,
    primary_color: '#0d6efd',
    pool_group: '',
  });

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeTournamentId
        ? `/api/auction/teams?tournamentId=${encodeURIComponent(activeTournamentId)}`
        : '/api/auction/teams';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setTeams(json.teams || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [activeTournamentId]);

  const openAddModal = () => {
    setModalMessage('');
    setModalError('');
    setShowMobilePreview(false);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setModalMessage('');
    setModalError('');
    setShowAddModal(false);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalMessage('');
    setError('');
    setMessage('');

    if (!formData.team_name?.trim()) {
      setModalError('Please enter a Franchise / Team Name.');
      return;
    }
    if (!formData.team_code?.trim()) {
      setModalError('Please enter a Short Code (e.g. PSP).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auction/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tournamentId: activeTournamentId }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned an invalid response. Please verify admin privileges.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create team');

      const savedName = formData.team_name;
      const savedCode = formData.team_code;
      const savedPurse = Number(formData.initial_purse || defaultPurse).toLocaleString();
      const savedColor = formData.primary_color || '#0d6efd';

      setModalMessage(`✓ Team "${savedName}" (${savedCode}) registered successfully with purse ₹${savedPurse}!`);
      setMessage(`Team "${savedName}" (${savedCode}) added to tournament roster.`);

      setTeamRegisteredModal({
        team_name: savedName,
        team_code: savedCode,
        initial_purse: savedPurse,
        primary_color: savedColor,
        owner_name: formData.owner_name,
        coach_name: formData.coach_name,
        min_squad_size: formData.min_squad_size || defaultMinSquad,
        max_squad_size: formData.max_squad_size || defaultMaxSquad,
      });

      setFormData({
        team_name: '',
        team_code: '',
        logo_url: '',
        owner_name: '',
        coach_name: '',
        initial_purse: defaultPurse,
        min_squad_size: defaultMinSquad,
        max_squad_size: defaultMaxSquad,
        primary_color: '#0d6efd',
        pool_group: '',
      });
      fetchTeams();
    } catch (err) {
      setModalError(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;
    try {
      const res = await fetch('/api/auction/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          teamId: editingTeam.id,
          tournamentId: activeTournamentId,
          ...editingTeam,
        }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned an invalid response.');
      }
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setTeamUpdatedModal({
        team_name: editingTeam.team_name,
        team_code: editingTeam.team_code,
        remaining_purse: Number(editingTeam.remaining_purse || 0).toLocaleString(),
      });
      setMessage(`Updated ${editingTeam.team_name} details.`);
      setEditingTeam(null);
      fetchTeams();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!confirm(`Are you sure you want to remove team "${teamName}" from this tournament?`)) return;
    try {
      const res = await fetch('/api/auction/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', teamId, tournamentId: activeTournamentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove team');

      setMessage(`Team "${teamName}" removed successfully.`);
      if (selectedTeamId === teamId) setSelectedTeamId(null);
      fetchTeams();
    } catch (err) {
      setError(err.message);
    }
  };

  // Seed default teams for this tournament
  const handleSeedDefaultTeams = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auction/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_defaults', tournamentId: activeTournamentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to seed default teams');

      setMessage(`Successfully initialized ${data.teams?.length || 4} standard franchise teams for this tournament.`);
      fetchTeams();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // MARK A SOLD PLAYER AS UNSOLD (REFUNDS TEAM PURSE)
  const handleMarkPlayerUnsold = async (player, team) => {
    const soldPrice = Number(player.sold_price || 0);
    const confirmMsg = `Move "${player.full_name}" to the unsold pool?\n\n₹${soldPrice.toLocaleString()} will be automatically refunded back to ${team.team_name}'s remaining purse.`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_unsold',
          playerId: player.id,
          tournamentId: activeTournamentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark player unsold');

      setMessage(`✓ ${player.full_name} moved to unsold pool. ₹${soldPrice.toLocaleString()} refunded to ${team.team_name}.`);
      fetchTeams();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OPEN STATUS CHANGE MODAL
  const openStatusModal = (player) => {
    setStatusModalPlayer(player);
    setStatusFormData({
      status: player.auction_status || 'unsold',
      sold_price: player.sold_price || player.base_price || 1000,
    });
  };

  // EXECUTE STATUS CHANGE
  const handleExecuteStatusChange = async (e) => {
    e.preventDefault();
    if (!statusModalPlayer) return;

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_status',
          playerId: statusModalPlayer.id,
          tournamentId: activeTournamentId,
          data: {
            status: statusFormData.status,
            sold_price: Number(statusFormData.sold_price) || 0,
            sold_to_team_id: selectedTeamId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change player status');

      setMessage(`✓ Updated status of ${statusModalPlayer.full_name} to "${statusFormData.status.toUpperCase()}".`);
      setStatusModalPlayer(null);
      fetchTeams();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate league numbers
  const totalPurse = teams.reduce((acc, t) => acc + Number(t.initial_purse || 0), 0);
  const totalRemaining = teams.reduce((acc, t) => acc + Number(t.remaining_purse || 0), 0);
  const totalSpent = Math.max(0, totalPurse - totalRemaining);
  const allSoldPlayers = teams.flatMap((t) => (t.squad || []).filter((p) => p.auction_status === 'sold'));

  // Currently focused team from aside navigation
  const focusedTeam = selectedTeamId ? teams.find((t) => t.id === selectedTeamId) : null;
  const focusedSquad = focusedTeam ? (focusedTeam.squad || []).filter((p) => p.auction_status === 'sold') : [];

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      {/* Alert Notices */}
      {message && (
        <div className="alert alert-success alert-dismissible fade show border-0 py-2.5 px-3 small d-flex align-items-center justify-content-between mb-3 shadow-sm" role="alert">
          <span><strong>Success:</strong> {message}</span>
          <button type="button" className="btn-close py-2" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show border-0 py-2.5 px-3 small d-flex align-items-center justify-content-between mb-3 shadow-sm" role="alert">
          <span><strong>Error:</strong> {error}</span>
          <button type="button" className="btn-close py-2" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Header Bar */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 border-bottom border-secondary border-opacity-25 pb-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-bold text-uppercase">
              {tournament?.sportConfig?.icon || '🏆'} {tournament?.sport_name || 'Tournament'}
            </span>
            <span className="badge bg-secondary bg-opacity-30 text-white-50 px-2 py-0.5 rounded-pill text-xs">
              {tournament?.season_year || '2026/27'}
            </span>
            {tournament?.venue && (
              <span className="text-white-50 text-xs d-none d-md-inline">
                📍 {tournament.venue}
              </span>
            )}
          </div>
          <h2 className="h3 fw-extrabold text-white mb-0 tracking-tight">
            {tournament ? `${tournament.tournament_name} — Teams & Squads` : 'Franchise Teams & Roster Management'}
          </h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5 shadow-sm"
            onClick={openAddModal}
          >
            <span>➕ Add New Team</span>
          </button>
          <Link
            href={activeTournamentId ? `/auction/t/${activeTournamentId}/admin` : '/auction/admin'}
            className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 fw-bold text-xs"
          >
            Open Podium ↗
          </Link>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: ASIDE LINKS (LEFT) + MAIN ROSTER VIEW (RIGHT) */}
      <div className="row g-4">
        {/* ========================================================================= */}
        {/* ASIDE NAVIGATION: TOURNAMENT TEAMS LOGO LINKS (1st ITEM: ALL TEAMS)       */}
        {/* ========================================================================= */}
        <aside className="col-12 col-lg-3 col-xl-2">
          <div
            className="auction-card p-2.5 p-md-3 shadow-lg position-sticky"
            style={{ top: '80px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}
          >
            <div className="d-flex align-items-center justify-content-between px-2 pb-2 mb-2 border-bottom border-secondary border-opacity-25">
              <span className="text-white-50 text-xs fw-extrabold text-uppercase tracking-wider">
                Franchise Teams
              </span>
              <span className="badge bg-secondary bg-opacity-40 text-light px-2 py-0.5 rounded-pill text-xs">
                {teams.length}
              </span>
            </div>

            <div className="vstack gap-1.5">
              {/* 1st ITEM: ALL TEAMS OVERVIEW LINK */}
              <button
                type="button"
                className={`btn btn-sm text-start w-100 p-2.5 rounded-3 d-flex align-items-center justify-content-between transition-all border ${
                  selectedTeamId === null
                    ? 'btn-primary border-primary shadow text-white fw-extrabold'
                    : 'bg-dark bg-opacity-50 text-white-50 border-secondary border-opacity-25 hover-bg-secondary'
                }`}
                onClick={() => setSelectedTeamId(null)}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <span
                    className="rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: selectedTeamId === null ? '#ffffff22' : 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      fontSize: '1rem',
                    }}
                  >
                    🌟
                  </span>
                  <div>
                    <strong className="d-block text-white text-xs lh-sm">All Teams</strong>
                    <span className="text-white-50 text-xs" style={{ fontSize: '0.72rem' }}>
                      Overview &amp; Budgets
                    </span>
                  </div>
                </div>
                <span className="badge bg-black bg-opacity-40 text-light rounded-pill px-2 py-0.5 text-xs">
                  {teams.length}
                </span>
              </button>

              <div className="border-top border-secondary border-opacity-20 my-1"></div>

              {/* LIST OF TEAMS WITH LOGO / EMBLEM & REMAINING PURSE */}
              {teams.length === 0 ? (
                <div className="p-3 text-center text-white-50 text-xs">
                  <span>No teams created yet. Click &quot;+ Add New Team&quot; above.</span>
                </div>
              ) : (
                teams.map((t) => {
                  const isSelected = selectedTeamId === t.id;
                  const squadCount = (t.squad || []).filter((p) => p.auction_status === 'sold').length;
                  const teamColor = t.primary_color || '#0d6efd';

                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`btn btn-sm text-start w-100 p-2 rounded-3 d-flex align-items-center justify-content-between transition-all border ${
                        isSelected
                          ? 'border-2 text-white fw-bold shadow-md'
                          : 'bg-dark bg-opacity-40 text-white-50 border-secondary border-opacity-20 hover-bg-secondary'
                      }`}
                      style={{
                        borderColor: isSelected ? teamColor : undefined,
                        backgroundColor: isSelected ? `${teamColor}22` : undefined,
                      }}
                      onClick={() => setSelectedTeamId(t.id)}
                    >
                      <div className="d-flex align-items-center gap-2 min-w-0">
                        {/* TEAM LOGO / EMBLEM */}
                        {t.logo_url ? (
                          <img
                            src={t.logo_url}
                            alt={t.team_code}
                            className="rounded-circle flex-shrink-0 border border-secondary border-opacity-40 shadow-sm"
                            style={{ width: 32, height: 32, objectFit: 'cover' }}
                          />
                        ) : (
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black shadow-sm flex-shrink-0"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: teamColor,
                              fontSize: '0.75rem',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {t.team_code}
                          </span>
                        )}

                        <div className="text-truncate">
                          <strong className="d-block text-white text-xs text-truncate lh-sm" title={t.team_name}>
                            {t.team_name}
                          </strong>
                          <span className="text-white-50 font-monospace text-xs" style={{ fontSize: '0.70rem' }}>
                            ₹{Number(t.remaining_purse || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* SQUAD COUNT BADGE */}
                      <span
                        className={`badge rounded-pill px-1.5 py-0.5 text-xs flex-shrink-0 ${
                          squadCount > 0 ? 'bg-success text-white' : 'bg-secondary bg-opacity-30 text-white-50'
                        }`}
                        title={`${squadCount} players purchased`}
                        style={{ fontSize: '0.70rem' }}
                      >
                        {squadCount}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

      {/* Teams Table */}
      <div className="auction-card overflow-hidden">
        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0 align-middle small">
            <thead className="table-dark text-white-50 text-uppercase text-xs border-secondary border-opacity-25">
              <tr>
                <th scope="col" style={{ width: 60 }}>Code</th>
                <th scope="col">Team Name</th>
                <th scope="col">Owner & Coach</th>
                <th scope="col">Allocated Purse</th>
                <th scope="col">Remaining Purse</th>
                <th scope="col">Squad Capacity</th>
                <th scope="col">Color</th>
                <th scope="col" className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-white-50">
                    No teams configured yet. Click &quot;Add New Team&quot; above to create the first team.
                  </td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team.id} className="border-secondary border-opacity-20">
                    <td>
                      <span
                        className="badge px-2.5 py-1 rounded-pill text-xs fw-extrabold"
                        style={{ backgroundColor: team.primary_color || '#0d6efd', color: '#fff' }}
                      >
                        {team.team_code}
                      </span>
                    </td>
                    <td>
                      <strong className="text-white d-block">{team.team_name}</strong>
                    </td>
                    <td>
                      <span className="text-white d-block">{team.owner_name || 'Management'}</span>
                      {team.coach_name && <span className="text-white-50 text-xs">Coach: {team.coach_name}</span>}
                    </td>
                    <td>
                      <strong className="text-warning font-monospace">
                        ₹{Number(team.initial_purse || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <strong className={`font-monospace ${Number(team.remaining_purse) < 10000 ? 'text-danger' : 'text-success'}`}>
                        ₹{Number(team.remaining_purse || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-25 text-light px-2 py-1 rounded-pill">
                        {team.squad_count || 0} / {team.max_squad_size || 12}
                      </span>
                    </td>
                    <td>
                      <span
                        className="d-inline-block rounded-circle border border-white"
                        style={{ width: 18, height: 18, backgroundColor: team.primary_color || '#0d6efd' }}
                      ></span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 text-xs"
                        onClick={() => setEditingTeam({ ...team })}
                      >
                        ✏️ Edit Purse
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TEAM MODAL */}
      {showAddModal && (
        <div
          className="modal show d-block"
          data-bs-theme="dark"
          style={{ backgroundColor: 'rgba(2, 6, 16, 0.88)', backdropFilter: 'blur(10px)', zIndex: 1055 }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content auction-card border-secondary border-opacity-30 text-white shadow-2xl">
              <form onSubmit={handleExecuteStatusChange}>
                <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge badge-cyan px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                      Status Control
                    </span>
                    <h5 className="modal-title fw-extrabold text-white mb-0 fs-6">
                      Modify Player Status
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setStatusModalPlayer(null)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-25 mb-3 d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center flex-shrink-0 border border-secondary"
                      style={{ width: 44, height: 44 }}
                    >
                      {statusModalPlayer.photo_url ? (
                        <img
                          src={statusModalPlayer.photo_url}
                          alt={statusModalPlayer.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div>
                      <strong className="text-white d-block">{statusModalPlayer.full_name}</strong>
                      <span className="text-white-50 text-xs">
                        Current Hammer Price: ₹{Number(statusModalPlayer.sold_price || statusModalPlayer.base_price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-light small fw-bold mb-1">
                      New Auction Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary"
                      value={statusFormData.status}
                      onChange={(e) => setStatusFormData((prev) => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      <option value="unsold">🛑 Unsold Pool (Round 2 — Refunds Team Purse)</option>
                      <option value="queued">⏳ Queued (Back to Initial Bidding Queue — Refunds Purse)</option>
                      <option value="on_hammer">🔨 On Hammer (Directly onto Auction Podium)</option>
                      <option value="sold">✓ Sold (Keep Sold / Adjust Sold Price)</option>
                    </select>
                  </div>

                  {statusFormData.status === 'sold' && (
                    <div className="mb-3">
                      <label className="form-label text-light small fw-bold mb-1">
                        Adjust Sold / Hammer Price (₹)
                      </label>
                      <input
                        type="number"
                        step="500"
                        min="500"
                        className="form-control form-control-sm bg-dark text-white border-secondary font-monospace"
                        value={statusFormData.sold_price}
                        onChange={(e) => setStatusFormData((prev) => ({ ...prev, sold_price: e.target.value }))}
                        required
                      />
                      <span className="text-white-50 text-xs d-block mt-1">
                        The team&apos;s remaining purse will automatically adjust for any difference.
                      </span>
                    </div>
                  )}

                  <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 text-white-50 text-xs border border-secondary border-opacity-15">
                    ℹ️ Changing status to &quot;Unsold&quot; or &quot;Queued&quot; will instantly restore ₹
                    {Number(statusModalPlayer.sold_price || 0).toLocaleString()} back to the team&apos;s bidding budget.
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-2.5 d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 text-xs"
                    onClick={() => setStatusModalPlayer(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 text-xs fw-bold shadow-sm"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Apply Status Change'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD TEAM                                                           */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered mx-auto"
            style={{
              maxWidth: 'min(820px, calc(100vw - 16px))',
              width: 'calc(100vw - 16px)',
              margin: 'auto',
              maxHeight: 'calc(100dvh - 16px)',
              display: 'flex',
            }}
          >
            <form
              onSubmit={handleCreateTeam}
              className="modal-content auction-card auction-modal-shell text-white shadow-2xl"
            >
              <div className="modal-header flex-shrink-0 px-3 px-sm-4 py-2.5 py-sm-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                    Setup Franchise
                  </span>
                  <h5 className="modal-title fw-extrabold text-white mb-0 fs-6 fs-sm-5">
                    Add New Tournament Team
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeAddModal}
                  aria-label="Close"
                ></button>
              </div>

                <div className="modal-body p-4 auction-scroll-area">
                  {modalMessage && (
                    <div className="alert alert-success border-0 bg-success bg-opacity-20 text-success d-flex align-items-center justify-content-between py-2 px-3 rounded-3 small shadow-sm mb-3" role="alert">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-5">🎉</span>
                        <strong className="text-white small">{modalMessage}</strong>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        onClick={() => setModalMessage('')}
                        aria-label="Close"
                      ></button>
                    </div>
                  )}

                  {modalError && (
                    <div className="alert alert-danger border-0 bg-danger bg-opacity-20 text-danger d-flex align-items-center justify-content-between py-2 px-3 rounded-3 small shadow-sm mb-3" role="alert">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-5">⚠️</span>
                        <strong className="text-white small">{modalError}</strong>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        onClick={() => setModalError('')}
                        aria-label="Close"
                      ></button>
                    </div>
                  )}

                  <div className="row g-4">
                    <div className="col-12 col-md-7 border-end-md border-secondary border-opacity-20 pe-md-4">
                      <div className="row g-2 mb-3">
                        <div className="col-12 col-sm-8">
                          <label className="form-label text-light small fw-bold mb-1">
                            Team / Franchise Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Coastal Strikers FC"
                            required
                            value={formData.team_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, team_name: e.target.value }))}
                          />
                        </div>
                        <div className="col-12 col-sm-4">
                          <label className="form-label text-light small fw-bold mb-1">
                            Short Code <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            className="form-control text-uppercase font-monospace fw-bold"
                            placeholder="CSF"
                            required
                            value={formData.team_code}
                            onChange={(e) => setFormData((prev) => ({ ...prev, team_code: e.target.value.toUpperCase() }))}
                          />
                        </div>
                      </div>

                      {/* Logo URL */}
                      <div className="mb-3">
                        <label className="form-label text-light small fw-bold mb-1">
                          Team Logo URL
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://.../logo.png (optional)"
                          value={formData.logo_url}
                          onChange={(e) => setFormData((prev) => ({ ...prev, logo_url: e.target.value }))}
                        />
                      </div>

                      {/* Primary Franchise Color Swatches */}
                      <div className="mb-3">
                        <label className="form-label text-light small fw-bold mb-1.5 d-flex align-items-center justify-content-between">
                          <span>Franchise Color Palette</span>
                          <span className="badge bg-secondary bg-opacity-30 text-white-50 font-monospace text-xs">
                            {formData.primary_color}
                          </span>
                        </label>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              className={`rounded-circle border-0 transition-all ${
                                formData.primary_color === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover-opacity-100'
                              }`}
                              style={{ width: 28, height: 28, backgroundColor: c.hex }}
                              onClick={() => setFormData((prev) => ({ ...prev, primary_color: c.hex }))}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Owner & Coach */}
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label text-light small fw-bold mb-1">Franchise Owner</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Owner name"
                            value={formData.owner_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, owner_name: e.target.value }))}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-light small fw-bold mb-1">Head Coach</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Coach name"
                            value={formData.coach_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, coach_name: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Pool Group */}
                      <div className="mb-3">
                        <label className="form-label text-light small fw-bold mb-1">Tournament Pool / Group</label>
                        <select
                          className="form-select form-select-sm bg-dark text-white border-secondary"
                          value={formData.pool_group}
                          onChange={(e) => setFormData((prev) => ({ ...prev, pool_group: e.target.value }))}
                        >
                          <option value="">Unassigned (Open)</option>
                          <option value="Pool A">Pool A</option>
                          <option value="Pool B">Pool B</option>
                          <option value="Pool C">Pool C</option>
                          <option value="Pool D">Pool D</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Column: Financial Setup */}
                    <div className="col-12 col-md-5 ps-md-3">
                      <div className="mb-3">
                        <label className="form-label text-light small fw-bold mb-1">
                          Starting Purse / Budget (₹) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          step="1000"
                          min="10000"
                          className="form-control text-warning font-monospace fw-bold fs-5"
                          required
                          value={formData.initial_purse}
                          onChange={(e) => setFormData((prev) => ({ ...prev, initial_purse: e.target.value }))}
                        />
                        <div className="d-flex flex-wrap gap-1.5 mt-2">
                          {QUICK_PURSES.map((qp) => (
                            <button
                              key={qp.value}
                              type="button"
                              className="btn btn-xs btn-outline-secondary rounded-pill py-0.5 px-2 text-xs"
                              onClick={() => setFormData((prev) => ({ ...prev, initial_purse: qp.value }))}
                            >
                              {qp.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Squad Size Bounds */}
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label text-light small fw-bold mb-1">Min Squad</label>
                          <input
                            type="number"
                            min="4"
                            max="25"
                            className="form-control"
                            value={formData.min_squad_size}
                            onChange={(e) => setFormData((prev) => ({ ...prev, min_squad_size: e.target.value }))}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-light small fw-bold mb-1">Max Squad</label>
                          <input
                            type="number"
                            min="4"
                            max="25"
                            className="form-control"
                            value={formData.max_squad_size}
                            onChange={(e) => setFormData((prev) => ({ ...prev, max_squad_size: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Live Card Preview */}
                      <div className="p-3 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-20 text-center mt-3">
                        <span className="text-white-50 text-xs text-uppercase d-block mb-2">Team Emblem Preview</span>
                        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black shadow"
                            style={{
                              width: 52,
                              height: 52,
                              backgroundColor: formData.primary_color || '#0d6efd',
                              fontSize: '1.1rem',
                            }}
                          >
                            {formData.team_code || '???'}
                          </span>
                        </div>
                        <strong className="text-white d-block">{formData.team_name || 'Team Name'}</strong>
                        <span className="text-warning font-monospace text-xs">
                          ₹{Number(formData.initial_purse || defaultPurse).toLocaleString()} Purse
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <span className="text-white-50 text-xs">
                    Tournament ID: <strong className="text-light">{activeTournamentId}</strong>
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 text-xs"
                      onClick={closeAddModal}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 text-xs fw-bold shadow-sm"
                      disabled={loading}
                    >
                      {loading ? 'Creating Team...' : '+ Confirm Add Team'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TEAM PURSE & DETAILS                                          */}
      {/* ========================================================================= */}
      {editingTeam && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content auction-card border-secondary border-opacity-30 text-white shadow-2xl">
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{ width: 28, height: 28, backgroundColor: editingTeam.primary_color || '#0d6efd', fontSize: '0.75rem' }}
                  >
                    {editingTeam.team_code}
                  </span>
                  <h5 className="modal-title fw-extrabold text-white mb-0 fs-6">
                    Edit {editingTeam.team_name}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingTeam(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label text-light small fw-bold mb-1">Franchise Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingTeam.team_name}
                    onChange={(e) => setEditingTeam((prev) => ({ ...prev, team_name: e.target.value }))}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold mb-1">Team Logo URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={editingTeam.logo_url || ''}
                    onChange={(e) => setEditingTeam((prev) => ({ ...prev, logo_url: e.target.value }))}
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Owner</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTeam.owner_name || ''}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, owner_name: e.target.value }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Coach</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTeam.coach_name || ''}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, coach_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Initial Purse (₹)</label>
                    <input
                      type="number"
                      step="1000"
                      className="form-control font-monospace"
                      value={editingTeam.initial_purse || 0}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, initial_purse: e.target.value }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Remaining Purse (₹)</label>
                    <input
                      type="number"
                      step="1000"
                      className="form-control font-monospace text-success fw-bold"
                      value={editingTeam.remaining_purse || 0}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, remaining_purse: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold mb-1">Franchise Color</label>
                  <div className="d-flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`rounded-circle border-0 transition-all ${
                          editingTeam.primary_color === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover-opacity-100'
                        }`}
                        style={{ width: 28, height: 28, backgroundColor: c.hex }}
                        onClick={() => setEditingTeam((prev) => ({ ...prev, primary_color: c.hex }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-2.5 d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 text-xs"
                  onClick={() => setEditingTeam(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 text-xs fw-bold shadow-sm"
                  onClick={handleUpdateTeam}
                  style={{ minHeight: '38px' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CELEBRATION MODAL: TEAM REGISTERED                                        */}
      {/* ========================================================================= */}
      {teamRegisteredModal && (
        <div
          className="modal show d-block"
          data-bs-theme="dark"
          style={{ backgroundColor: 'rgba(2, 6, 16, 0.88)', backdropFilter: 'blur(10px)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content auction-card border-secondary border-opacity-30 text-white text-center p-4 shadow-2xl">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-black shadow mx-auto mb-3"
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: teamRegisteredModal.primary_color || '#0d6efd',
                  fontSize: '1.4rem',
                }}
              >
                {teamRegisteredModal.team_code}
              </div>
              <span className="badge badge-gold px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase mx-auto mb-2">
                Franchise Confirmed
              </span>
              <h4 className="fw-black text-white mb-1">{teamRegisteredModal.team_name}</h4>
              <p className="text-white-50 text-xs mb-3">
                Team added to tournament roster with allocated purse ₹{teamRegisteredModal.initial_purse}.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-4 py-2 text-xs fw-bold mx-auto shadow-sm"
                onClick={() => setTeamRegisteredModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CELEBRATION MODAL: TEAM UPDATED                                           */}
      {/* ========================================================================= */}
      {teamUpdatedModal && (
        <div
          className="modal show d-block"
          data-bs-theme="dark"
          style={{ backgroundColor: 'rgba(2, 6, 16, 0.88)', backdropFilter: 'blur(10px)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content auction-card border-secondary border-opacity-30 text-white text-center p-4 shadow-2xl">
              <div className="fs-1 mb-2">✓</div>
              <h5 className="fw-black text-white mb-1">Team Details Updated</h5>
              <p className="text-white-50 text-xs mb-3">
                Updated {teamUpdatedModal.team_name} ({teamUpdatedModal.team_code}). Current remaining purse is ₹{teamUpdatedModal.remaining_purse}.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 text-xs fw-bold mx-auto shadow-sm"
                onClick={() => setTeamUpdatedModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
