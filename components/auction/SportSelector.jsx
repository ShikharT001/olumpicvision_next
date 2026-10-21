'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SportSelector({ sports = [], tournaments = [], role = 'team', isAdmin = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    sport_id: 'volleyball',
    tournament_name: '',
    season_year: '2026/27',
    venue: '',
    default_purse: 100000,
    min_bid_increment: 500,
    min_squad_size: 8,
    max_squad_size: 15,
    status: 'active',
  });

  const filteredSports = sports.filter((sport) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      sport.name.toLowerCase().includes(term) ||
      sport.description?.toLowerCase().includes(term) ||
      sport.id.toLowerCase().includes(term)
    );
  });

  const totalTeamsCount = tournaments.reduce((acc, t) => acc + (t.teams_count || 0), 0);
  const totalPlayersCount = tournaments.reduce((acc, t) => acc + (t.players_count || 0), 0);

  const handleSportSelectChange = (sportId) => {
    const selected = sports.find((s) => s.id === sportId);
    setCreateForm((prev) => ({
      ...prev,
      sport_id: sportId,
      default_purse: selected?.defaultPurse || 100000,
      min_bid_increment: selected?.minBidIncrement || 500,
      min_squad_size: selected?.minSquadSize || 8,
      max_squad_size: selected?.maxSquadSize || 15,
    }));
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setCreateError('');
    setCreating(true);
    try {
      const res = await fetch('/api/auction/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...createForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create tournament');

      // Navigate to the newly created tournament's hub
      const newId = data.tournament?.id || data.tournament?.slug;
      window.location.href = `/auction/t/${newId}`;
    } catch (err) {
      setCreateError(err.message);
      setCreating(false);
    }
  };

  return (
    <div className="container py-4 py-md-5">
      {/* Hero Welcome Banner */}
      <div className="text-center mx-auto mb-5" style={{ maxWidth: 840 }}>
        <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-primary bg-opacity-20 text-info border border-info border-opacity-30 mb-3 shadow-sm">
          <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
          <span className="small fw-bold text-uppercase" style={{ letterSpacing: '0.08em' }}>
            Multi-Sport Live Auction Platform
          </span>
        </div>

        <h1 className="display-5 fw-extrabold text-white mb-3 tracking-tight">
          Select Your Sport &amp; Game
        </h1>

        <p className="text-secondary fs-5 mb-4 leading-relaxed">
          {isAdmin
            ? 'Manage multi-sport auctions, create tournament championships, configure franchise team purses, and conduct live gavel hammer sessions in real time.'
            : 'Welcome Team Franchises & Officials. Select a sport below to view tournaments, monitor live podium bids, and inspect team rosters.'}
        </p>

        {/* Search & Actions Bar */}
        <div className="d-flex flex-wrap align-items-center justify-content-center gap-3">
          <div className="position-relative" style={{ maxWidth: 380, width: '100%' }}>
            <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-secondary">
              🔍
            </span>
            <input
              type="text"
              className="form-control form-control-lg rounded-pill ps-5 bg-dark text-white border-secondary border-opacity-30 small"
              placeholder="Filter sports (e.g. Volleyball, Football, Kabaddi...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '0.95rem' }}
            />
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-warning rounded-pill px-4 py-2.5 fw-bold text-dark d-inline-flex align-items-center gap-2 shadow-sm transition-all"
            >
              <span className="fs-6">➕</span>
              <span>Create Tournament</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Stat Counters */}
      <div className="auction-card p-3 p-md-4 mb-5 mx-auto" style={{ maxWidth: 940 }}>
        <div className="row g-3 text-center">
          <div className="col-6 col-md-3">
            <span className="text-secondary small d-block">Available Sports</span>
            <strong className="fs-3 fw-bold text-white">{sports.length}</strong>
          </div>
          <div className="col-6 col-md-3">
            <span className="text-secondary small d-block">Total Tournaments</span>
            <strong className="fs-3 fw-bold text-warning">{tournaments.length}</strong>
          </div>
          <div className="col-6 col-md-3">
            <span className="text-secondary small d-block">Franchise Teams</span>
            <strong className="fs-3 fw-bold text-cyan">{totalTeamsCount}</strong>
          </div>
          <div className="col-6 col-md-3">
            <span className="text-secondary small d-block">Players in Pool</span>
            <strong className="fs-3 fw-bold text-success">{totalPlayersCount}</strong>
          </div>
        </div>
      </div>

      {/* ACTIVE SIMULTANEOUS TOURNAMENTS SECTION */}
      {tournaments.length > 0 && (
        <div className="mb-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom border-secondary border-opacity-20">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge badge-cyan px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                  Live &amp; Active
                </span>
                <span className="text-white-50 text-xs">Simultaneous Championships</span>
              </div>
              <h2 className="fs-4 fw-extrabold text-white mb-0 mt-1 tracking-tight">
                Active Tournaments Directory
              </h2>
            </div>
            <span className="badge bg-dark bg-opacity-70 text-secondary border border-secondary border-opacity-30 rounded-pill text-xs px-3 py-1.5">
              {tournaments.length} Championships Available
            </span>
          </div>

          <div className="row g-3">
            {tournaments.map((t) => {
              const sportConfig = sports.find((s) => s.id === t.sport_id);
              const tId = t.id || t.slug;
              return (
                <div key={t.id} className="col-12 col-md-6 col-xl-4">
                  <div className="auction-card h-100 p-4 d-flex flex-column transition-all hover-translate-y">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-4">{sportConfig?.icon || '🏆'}</span>
                        <span className="badge badge-cyan px-2 py-0.5 rounded-pill text-xs fw-bold">
                          {t.sport_name || sportConfig?.name || 'Championship'}
                        </span>
                      </div>
                      <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs rounded-pill">
                        {t.season_year || '2026/27'}
                      </span>
                    </div>

                    <h3 className="fs-6 fw-extrabold text-white mb-1 text-truncate" title={t.tournament_name}>
                      {t.tournament_name}
                    </h3>
                    <p className="text-white-50 text-xs mb-3 flex-grow-1 text-truncate">
                      {t.venue ? `📍 ${t.venue}` : 'Official District Tournament'}
                    </p>

                    <div className="d-flex align-items-center justify-content-between py-2 border-top border-secondary border-opacity-20 text-xs text-white-50 mb-3">
                      <span>Teams: <strong className="text-white">{t.teams_count || 8}</strong></span>
                      <span>Purse: <strong className="text-warning font-monospace">₹{Number(t.default_purse || 100000).toLocaleString()}</strong></span>
                      <span>Players: <strong className="text-white">{t.players_count || 48}</strong></span>
                    </div>

                    <div className="d-flex align-items-center gap-2 mt-auto">
                      <Link
                        href={`/auction/t/${tId}/teams`}
                        className="btn btn-sm btn-info text-dark rounded-pill px-3 py-2 fw-bold text-xs flex-fill text-center shadow-sm"
                      >
                        🛡️ Squads &amp; Purse ➔
                      </Link>
                      <Link
                        href={`/auction/t/${tId}/admin`}
                        className="btn btn-sm btn-outline-light rounded-pill px-2.5 py-2 text-xs fw-bold"
                        title={isAdmin ? 'Auctioneer Console' : 'Watch Live Console'}
                      >
                        🔨
                      </Link>
                      <Link
                        href={`/auction/t/${tId}/live`}
                        className="btn btn-sm btn-outline-warning rounded-pill px-2.5 py-2 text-xs fw-bold"
                        title="Big Screen Projector Stage"
                      >
                        📺
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section Divider & Heading for Sports Explorer */}
      <div className="mb-3 d-flex align-items-center justify-content-between">
        <div>
          <span className="text-white-50 text-xs fw-bold text-uppercase d-block mb-0.5">Explore by Category</span>
          <h2 className="fs-4 fw-extrabold text-white mb-0">Browse All Sports &amp; Games</h2>
        </div>
        <span className="text-secondary small">{filteredSports.length} Sports</span>
      </div>

      {/* Sports Grid */}
      <div className="row g-4 mb-5">
        {filteredSports.map((sport) => {
          const sportTournaments = tournaments.filter((t) => t.sport_id === sport.id);
          const activeCount = sportTournaments.length;

          return (
            <div key={sport.id} className="col-12 col-sm-6 col-lg-3">
              <div
                className="sport-card h-100"
                style={{
                  '--sport-theme': sport.themeColor,
                  '--sport-glow': sport.borderColor,
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="sport-icon-box">{sport.icon}</div>
                  <span
                    className={`badge rounded-pill px-2.5 py-1 text-xs fw-extrabold ${sport.badgeClass || 'badge-cyan'}`}
                  >
                    {activeCount > 0 ? `${activeCount} Tournament${activeCount > 1 ? 's' : ''}` : 'Ready to Add'}
                  </span>
                </div>

                <h3 className="h4 fw-bold text-white mb-2">{sport.name}</h3>

                <p className="text-secondary small mb-4 flex-grow-1 leading-relaxed">
                  {sport.description}
                </p>

                <div className="vstack gap-2 mt-auto">
                  <Link
                    href={`/auction?sport=${sport.id}`}
                    className="btn btn-sm btn-outline-info rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-1.5 transition-all"
                  >
                    <span>View Tournaments</span>
                    <span>→</span>
                  </Link>

                  {/* If tournaments exist for this sport, offer quick 1-click jump to the first one */}
                  {sportTournaments.length > 0 && (
                    <Link
                      href={`/auction/t/${sportTournaments[0].id || sportTournaments[0].slug}`}
                      className="btn btn-sm btn-primary rounded-pill py-1.5 fw-bold text-xs d-flex align-items-center justify-content-center gap-1"
                    >
                      <span>Enter Latest Auction</span>
                      <span>⚡</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TOURNAMENT MODAL (ADMIN) */}
      {isAdmin && showCreateModal && (
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
              <form onSubmit={handleCreateTournament}>
                <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold">
                      NEW TOURNAMENT
                    </span>
                    <h5 className="modal-title fw-bold text-white mb-0 fs-6">
                      Add New Tournament / Championship
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowCreateModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4 vstack gap-3 auction-scroll-area">
                  {createError && (
                    <div className="alert alert-danger py-2 px-3 small border-0 mb-1" role="alert">
                      <strong>Error:</strong> {createError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-light small fw-bold mb-1">
                        Select Game / Sport <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={createForm.sport_id}
                        onChange={(e) => handleSportSelectChange(e.target.value)}
                        required
                      >
                        {sports.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.icon} {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-light small fw-bold mb-1">
                        Edition / Season <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 2026/27 or Season 1"
                        required
                        value={createForm.season_year}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, season_year: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-light small fw-bold mb-1">
                      Tournament Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Palghar District Premier Cup 2026"
                      required
                      value={createForm.tournament_name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, tournament_name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="form-label text-light small fw-bold mb-1">
                      Venue / City / Arena
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Palghar Sports Complex, Palghar"
                      value={createForm.venue}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, venue: e.target.value }))}
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
                          value={createForm.default_purse}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, default_purse: Number(e.target.value) }))}
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
                          value={createForm.min_bid_increment}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, min_bid_increment: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-light small fw-bold mb-1">
                        Tournament Status
                      </label>
                      <select
                        className="form-select"
                        value={createForm.status}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="active">Active / Ready for Auction</option>
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
                        value={createForm.min_squad_size}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, min_squad_size: Number(e.target.value) }))}
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
                        value={createForm.max_squad_size}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, max_squad_size: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn btn-sm btn-primary rounded-pill px-4 py-2 fw-bold text-xs shadow d-inline-flex align-items-center gap-1.5"
                  >
                    {creating ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>Create &amp; Launch Auction</span>
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
