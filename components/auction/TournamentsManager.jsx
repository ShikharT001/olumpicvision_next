'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TournamentsManager({ sport, initialTournaments = [], role = 'team', isAdmin = false }) {
  const [tournaments, setTournaments] = useState(initialTournaments || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [form, setForm] = useState({
    tournament_name: '',
    season_year: '2026/27',
    venue: '',
    default_purse: sport?.defaultPurse || 100000,
    min_bid_increment: sport?.minBidIncrement || 500,
    min_squad_size: sport?.minSquadSize || 8,
    max_squad_size: sport?.maxSquadSize || 15,
    status: 'active',
  });

  const openAddModal = () => {
    if (!isAdmin) return;
    setActionError('');
    setActionSuccess('');
    setForm({
      tournament_name: '',
      season_year: '2026/27',
      venue: '',
      default_purse: sport?.defaultPurse || 100000,
      min_bid_increment: sport?.minBidIncrement || 500,
      min_squad_size: sport?.minSquadSize || 8,
      max_squad_size: sport?.maxSquadSize || 15,
      status: 'active',
    });
    setShowAddModal(true);
  };

  const openEditModal = (tourn) => {
    if (!isAdmin) return;
    setActionError('');
    setActionSuccess('');
    setEditingTournament(tourn);
    setForm({
      tournament_name: tourn.tournament_name || '',
      season_year: tourn.season_year || '2026/27',
      venue: tourn.venue || '',
      default_purse: tourn.default_purse || sport?.defaultPurse || 100000,
      min_bid_increment: tourn.min_bid_increment || sport?.minBidIncrement || 500,
      min_squad_size: tourn.min_squad_size || sport?.minSquadSize || 8,
      max_squad_size: tourn.max_squad_size || sport?.maxSquadSize || 15,
      status: tourn.status || 'active',
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setActionError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auction/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          sport_id: sport.id,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create tournament');

      setTournaments((prev) => [data.tournament, ...prev]);
      setShowAddModal(false);
      setActionSuccess(`Tournament "${form.tournament_name}" created successfully!`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isAdmin || !editingTournament) return;
    setActionError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auction/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          tournamentId: editingTournament.id,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update tournament');

      setTournaments((prev) =>
        prev.map((t) => (t.id === editingTournament.id ? { ...t, ...data.tournament } : t))
      );
      setEditingTournament(null);
      setActionSuccess(`Tournament "${form.tournament_name}" updated successfully!`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete tournament "${name}" and all its teams and players? This action cannot be undone.`)) {
      return;
    }
    setActionError('');
    setDeletingId(id);
    try {
      const res = await fetch('/api/auction/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', tournamentId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete tournament');

      setTournaments((prev) => prev.filter((t) => t.id !== id));
      setActionSuccess(`Tournament "${name}" deleted successfully.`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const totalTeams = tournaments.reduce((acc, t) => acc + (t.teams_count || 0), 0);
  const totalPlayers = tournaments.reduce((acc, t) => acc + (t.players_count || 0), 0);

  return (
    <div className="container py-4 py-md-5">
      {/* Top Breadcrumb & Navigation */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <Link
          href="/auction"
          className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 text-white d-inline-flex align-items-center gap-2 text-decoration-none"
        >
          <span>←</span>
          <span>Back to All Games &amp; Sports</span>
        </Link>

        {isAdmin && (
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-warning rounded-pill px-4 py-2 fw-bold text-dark d-inline-flex align-items-center gap-2 shadow-sm"
          >
            <span>➕</span>
            <span>Add New {sport.name} Tournament</span>
          </button>
        )}
      </div>

      {/* Sport Title & Stats Header */}
      <div className="auction-card p-4 p-md-5 mb-5 position-relative overflow-hidden">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-4">
          <div className="d-flex align-items-center gap-3.5">
            <div
              className="sport-icon-box mb-0 shadow-lg"
              style={{ width: 78, height: 78, fontSize: '2.8rem' }}
            >
              {sport.icon}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className={`badge rounded-pill px-2.5 py-0.5 text-xs fw-extrabold ${sport.badgeClass || 'badge-cyan'}`}>
                  SPORT CATEGORY
                </span>
                <span className="text-secondary small">• Official Tournaments Hub</span>
              </div>
              <h1 className="h2 fw-extrabold text-white mb-1 tracking-tight">
                {sport.name} Championships &amp; Leagues
              </h1>
              <p className="text-secondary small mb-0 leading-relaxed" style={{ maxWidth: 620 }}>
                {sport.description}
              </p>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-3 ms-md-auto">
            <div className="px-3.5 py-2.5 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-30 text-center">
              <span className="text-secondary text-xs d-block">Tournaments</span>
              <strong className="fs-4 fw-bold text-warning">{tournaments.length}</strong>
            </div>
            <div className="px-3.5 py-2.5 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-30 text-center">
              <span className="text-secondary text-xs d-block">Teams</span>
              <strong className="fs-4 fw-bold text-cyan">{totalTeams}</strong>
            </div>
            <div className="px-3.5 py-2.5 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-30 text-center">
              <span className="text-secondary text-xs d-block">Players</span>
              <strong className="fs-4 fw-bold text-success">{totalPlayers}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {actionSuccess && (
        <div className="alert alert-success border-0 bg-success bg-opacity-20 text-success d-flex align-items-center justify-content-between py-2.5 px-3 rounded-3 small mb-4" role="alert">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">✓</span>
            <strong className="text-white small">{actionSuccess}</strong>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={() => setActionSuccess('')} aria-label="Close"></button>
        </div>
      )}

      {actionError && (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-20 text-danger d-flex align-items-center justify-content-between py-2.5 px-3 rounded-3 small mb-4" role="alert">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">⚠️</span>
            <strong className="text-white small">{actionError}</strong>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={() => setActionError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Tournaments Grid */}
      {tournaments.length === 0 ? (
        <div className="auction-card p-5 text-center my-4 mx-auto" style={{ maxWidth: 600 }}>
          <div className="fs-1 mb-2">{sport.icon}</div>
          <h3 className="h4 fw-bold text-white mb-2">No Tournaments Created Yet</h3>
          <p className="text-secondary small mb-4 leading-relaxed">
            There are currently no tournaments set up for {sport.name}.
            {isAdmin
              ? ' Click the button below to create the first championship auction for this sport!'
              : ' Check back soon once the administrator announces upcoming tournaments.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={openAddModal}
              className="btn btn-warning rounded-pill px-4 py-2.5 fw-bold text-dark d-inline-flex align-items-center gap-2 shadow"
            >
              <span>➕</span>
              <span>Create First {sport.name} Tournament</span>
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {tournaments.map((t) => {
            const tId = t.id || t.slug;
            const isDeleting = deletingId === t.id;

            return (
              <div key={t.id} className="col-12 col-lg-6">
                <div className="tournament-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    {/* Header Row */}
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className={`badge rounded-pill text-xs px-2.5 py-0.5 ${t.status === 'active' ? 'tournament-badge-live' : 'bg-secondary text-white'}`}>
                            {t.status === 'active' ? '● LIVE AUCTION' : t.status?.toUpperCase()}
                          </span>
                          <span className="badge bg-dark text-secondary border border-secondary border-opacity-30 rounded-pill text-xs">
                            {t.season_year || '2026/27'}
                          </span>
                        </div>
                        <h3 className="h5 fw-bold text-white mb-1">{t.tournament_name}</h3>
                        {t.venue && (
                          <span className="text-secondary text-xs d-flex align-items-center gap-1">
                            <span>📍</span>
                            <span>{t.venue}</span>
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="dropdown">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary border-0 text-secondary p-1 rounded-circle"
                            onClick={() => openEditModal(t)}
                            title="Edit tournament settings"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger border-0 text-danger p-1 rounded-circle ms-1"
                            onClick={() => handleDelete(t.id, t.tournament_name)}
                            disabled={isDeleting}
                            title="Delete tournament"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stats Metric Strip */}
                    <div className="row g-2 p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-20 text-center my-3">
                      <div className="col-3">
                        <span className="text-secondary text-xs d-block">Teams</span>
                        <strong className="text-white fw-bold">{t.teams_count || 0}</strong>
                      </div>
                      <div className="col-3">
                        <span className="text-secondary text-xs d-block">Players</span>
                        <strong className="text-cyan fw-bold">{t.players_count || 0}</strong>
                      </div>
                      <div className="col-3">
                        <span className="text-secondary text-xs d-block">Starting Purse</span>
                        <strong className="text-warning fw-bold text-xs">₹{Number(t.default_purse || 100000).toLocaleString()}</strong>
                      </div>
                      <div className="col-3">
                        <span className="text-secondary text-xs d-block">Bid Step</span>
                        <strong className="text-success fw-bold text-xs">₹{Number(t.min_bid_increment || 500).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="vstack gap-2 mt-3 pt-2 border-top border-secondary border-opacity-20">
                    <Link
                      href={`/auction/t/${tId}`}
                      className="btn btn-primary rounded-pill py-2 fw-bold text-sm d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all"
                    >
                      <span>Enter Tournament Auction Hub</span>
                      <span>→</span>
                    </Link>

                    <div className="d-flex flex-wrap align-items-center gap-1.5">
                      <Link
                        href={`/auction/t/${tId}/admin`}
                        className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 text-xs fw-bold flex-grow-1 text-center"
                      >
                        🔨 {isAdmin ? 'Auction Podium' : 'Watch Podium'}
                      </Link>
                      <Link
                        href={`/auction/t/${tId}/live`}
                        className="btn btn-sm btn-outline-info rounded-pill px-3 py-1 text-xs fw-bold flex-grow-1 text-center"
                      >
                        📺 Big Screen
                      </Link>
                      <Link
                        href={`/auction/t/${tId}/teams`}
                        className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 text-xs fw-bold flex-grow-1 text-center"
                      >
                        🛡️ Squads
                      </Link>
                      <Link
                        href={`/auction/t/${tId}/players`}
                        className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 text-xs fw-bold flex-grow-1 text-center"
                      >
                        📋 Players
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isAdmin && (showAddModal || editingTournament) && (
        <div
          className="modal show d-block"
          data-bs-theme="dark"
          style={{ backgroundColor: 'rgba(2, 6, 16, 0.88)', backdropFilter: 'blur(10px)', zIndex: 1055 }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content auction-card border-secondary border-opacity-30 text-white shadow-2xl">
              <form onSubmit={editingTournament ? handleUpdate : handleCreate}>
                <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold">
                      {editingTournament ? 'EDIT TOURNAMENT' : 'NEW TOURNAMENT'}
                    </span>
                    <h5 className="modal-title fw-bold text-white mb-0 fs-6">
                      {editingTournament
                        ? `Edit Tournament: ${editingTournament.tournament_name}`
                        : `Add New ${sport.name} Tournament`}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTournament(null);
                    }}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4 vstack gap-3 auction-scroll-area">
                  {actionError && (
                    <div className="alert alert-danger py-2 px-3 small border-0 mb-1" role="alert">
                      <strong>Error:</strong> {actionError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label text-light small fw-bold mb-1">
                        Tournament Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`e.g. Palghar District ${sport.name} League 2026`}
                        required
                        value={form.tournament_name}
                        onChange={(e) => setForm((prev) => ({ ...prev, tournament_name: e.target.value }))}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-light small fw-bold mb-1">
                        Edition / Season <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 2026/27 or Season 1"
                        required
                        value={form.season_year}
                        onChange={(e) => setForm((prev) => ({ ...prev, season_year: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-light small fw-bold mb-1">
                      Venue / City / Stadium
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Palghar District Sports Complex, Palghar"
                      value={form.venue}
                      onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label text-light small fw-bold mb-1">
                        Starting Purse per Team (₹)
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-dark text-warning border-secondary border-opacity-30 fw-bold">₹</span>
                        <input
                          type="number"
                          step="1000"
                          className="form-control font-monospace"
                          value={form.default_purse}
                          onChange={(e) => setForm((prev) => ({ ...prev, default_purse: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-light small fw-bold mb-1">
                        Min Bid Increment (₹)
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-dark text-cyan border-secondary border-opacity-30 fw-bold">₹</span>
                        <input
                          type="number"
                          step="100"
                          className="form-control font-monospace"
                          value={form.min_bid_increment}
                          onChange={(e) => setForm((prev) => ({ ...prev, min_bid_increment: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-light small fw-bold mb-1">
                        Status
                      </label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="active">Active / Live</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="draft">Draft Mode</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">
                        Min Squad Size
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.min_squad_size}
                        onChange={(e) => setForm((prev) => ({ ...prev, min_squad_size: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">
                        Max Squad Size
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.max_squad_size}
                        onChange={(e) => setForm((prev) => ({ ...prev, max_squad_size: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTournament(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-sm btn-primary rounded-pill px-4 py-2 fw-bold text-xs shadow d-inline-flex align-items-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>{editingTournament ? 'Update Tournament' : 'Create Tournament'}</span>
                        <span>→</span>
                      </>
                    )}
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
