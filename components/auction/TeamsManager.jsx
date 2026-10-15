'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

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
];

export default function TeamsManager({ initialTeams }) {
  const [teams, setTeams] = useState(initialTeams || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [formData, setFormData] = useState({
    team_name: '',
    team_code: '',
    owner_name: '',
    coach_name: '',
    initial_purse: 100000,
    min_squad_size: 8,
    max_squad_size: 12,
    primary_color: '#0d6efd',
  });

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auction/teams');
      if (res.ok) {
        const json = await res.json();
        setTeams(json.teams || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auction/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');

      setMessage(`Team ${formData.team_name} (${formData.team_code}) added successfully.`);
      setShowAddModal(false);
      setFormData({
        team_name: '',
        team_code: '',
        owner_name: '',
        coach_name: '',
        initial_purse: 100000,
        min_squad_size: 8,
        max_squad_size: 12,
        primary_color: '#0d6efd',
      });
      fetchTeams();
    } catch (err) {
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
          ...editingTeam,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setMessage(`Updated ${editingTeam.team_name} details.`);
      setEditingTeam(null);
      fetchTeams();
    } catch (err) {
      setError(err.message);
    }
  };

  const totalPurse = teams.reduce((acc, t) => acc + Number(t.initial_purse || 0), 0);

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      {/* Alert Notices */}
      {message && (
        <div className="alert alert-success alert-dismissible fade show border-0 py-2 px-3 small d-flex align-items-center justify-content-between mb-3" role="alert">
          <span><strong>Success:</strong> {message}</span>
          <button type="button" className="btn-close py-2" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show border-0 py-2 px-3 small d-flex align-items-center justify-content-between mb-3" role="alert">
          <span><strong>Error:</strong> {error}</span>
          <button type="button" className="btn-close py-2" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary border-opacity-25 pb-3 mb-4">
        <div>
          <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-bold text-uppercase mb-1">
            Tournament Roster Setup
          </span>
          <h2 className="h3 fw-extrabold text-white mb-0 tracking-tight">
            Participating Teams & Budget Configuration
          </h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5 shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <span>+ Add New Team</span>
          </button>
          <Link href="/auction/admin" className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 fw-bold text-xs">
            Open Podium ↗
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block">Participating Teams</span>
            <strong className="fs-3 fw-bold text-white">{teams.length}</strong>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block">Total League Purse Allocated</span>
            <strong className="fs-3 fw-bold text-warning">₹{totalPurse.toLocaleString()}</strong>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block">Average Purse per Team</span>
            <strong className="fs-3 fw-bold text-info">
              ₹{teams.length ? Math.round(totalPurse / teams.length).toLocaleString() : '0'}
            </strong>
          </div>
        </div>
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
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content auction-card border-secondary border-opacity-30 text-white shadow-2xl">
              <form onSubmit={handleCreateTeam}>
                <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2.5">
                    <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                      Setup Franchise
                    </span>
                    <h5 className="modal-title fw-extrabold text-white mb-0 fs-5">
                      Add New Tournament Team
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowAddModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4 auction-scroll-area">
                  <div className="row g-4">
                    {/* Left Column: Form Fields */}
                    <div className="col-12 col-md-7 border-end-md border-secondary border-opacity-20 pe-md-4">
                      {/* Team Name & Short Code */}
                      <div className="row g-2 mb-3">
                        <div className="col-8">
                          <label className="form-label text-light small fw-bold mb-1">
                            Team / Franchise Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Palghar Spikers"
                            required
                            value={formData.team_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, team_name: e.target.value }))}
                          />
                        </div>
                        <div className="col-4">
                          <label className="form-label text-light small fw-bold mb-1">
                            Code <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            className="form-control text-uppercase font-monospace fw-bold"
                            placeholder="PSP"
                            required
                            value={formData.team_code}
                            onChange={(e) => setFormData((prev) => ({ ...prev, team_code: e.target.value.toUpperCase() }))}
                          />
                          <span className="text-white-50 text-xs d-block mt-0.5" style={{ fontSize: '0.72rem' }}>3-4 letters</span>
                        </div>
                      </div>

                      {/* Primary Franchise Color Swatches */}
                      <div className="mb-3">
                        <label className="form-label text-light small fw-bold mb-1.5 d-flex align-items-center justify-content-between">
                          <span>Franchise Color Palette</span>
                          <span className="badge bg-secondary bg-opacity-30 text-white-50 font-monospace text-xs">
                            {formData.primary_color}
                          </span>
                        </label>
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                          {PRESET_COLORS.map((c) => {
                            const isSelected = formData.primary_color.toLowerCase() === c.hex.toLowerCase();
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                title={c.name}
                                className={`swatch-pill ${isSelected ? 'is-selected' : ''}`}
                                style={{ backgroundColor: c.hex }}
                                onClick={() => setFormData((prev) => ({ ...prev, primary_color: c.hex }))}
                              >
                                {isSelected && <span style={{ fontSize: '11px', color: '#fff' }}>✓</span>}
                              </button>
                            );
                          })}
                          {/* Custom Color Input */}
                          <div className="d-flex align-items-center gap-1.5 ms-1">
                            <input
                              type="color"
                              className="form-control form-control-color p-0.5 border-0 rounded-circle"
                              style={{ width: 32, height: 32, cursor: 'pointer' }}
                              value={formData.primary_color}
                              onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
                              title="Custom Color"
                            />
                            <span className="text-white-50 small" style={{ fontSize: '0.75rem' }}>Custom</span>
                          </div>
                        </div>
                      </div>

                      {/* Starting Purse */}
                      <div className="mb-3">
                        <label className="form-label text-light small fw-bold mb-1.5 d-flex align-items-center justify-content-between">
                          <span>Starting Auction Purse (₹) <span className="text-danger">*</span></span>
                          <span className="text-warning fw-bold font-monospace small">
                            ₹{Number(formData.initial_purse || 0).toLocaleString()}
                          </span>
                        </label>
                        {/* Quick Purse Chips */}
                        <div className="d-flex flex-wrap gap-1.5 mb-2">
                          {QUICK_PURSES.map((qp) => (
                            <button
                              key={qp.value}
                              type="button"
                              className={`purse-chip ${Number(formData.initial_purse) === qp.value ? 'is-active' : ''}`}
                              onClick={() => setFormData((prev) => ({ ...prev, initial_purse: qp.value }))}
                            >
                              {qp.label}
                            </button>
                          ))}
                        </div>
                        <div className="input-group">
                          <span className="input-group-text bg-dark text-warning border-secondary border-opacity-30 fw-bold">₹</span>
                          <input
                            type="number"
                            step="1000"
                            min="1000"
                            className="form-control font-monospace fw-bold"
                            placeholder="100000"
                            required
                            value={formData.initial_purse}
                            onChange={(e) => setFormData((prev) => ({ ...prev, initial_purse: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Owner & Coach */}
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label text-light small fw-bold mb-1">Owner Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Mahesh Patil"
                            value={formData.owner_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, owner_name: e.target.value }))}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-light small fw-bold mb-1">Coach Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Vikram Joshi"
                            value={formData.coach_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, coach_name: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Squad Size Limits */}
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label text-light small fw-bold mb-1">Min Squad Size</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="form-control font-monospace"
                            value={formData.min_squad_size}
                            onChange={(e) => setFormData((prev) => ({ ...prev, min_squad_size: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-light small fw-bold mb-1">Max Squad Size</label>
                          <input
                            type="number"
                            min="1"
                            max="25"
                            className="form-control font-monospace"
                            value={formData.max_squad_size}
                            onChange={(e) => setFormData((prev) => ({ ...prev, max_squad_size: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Live Interactive Franchise Preview */}
                    <div className="col-12 col-md-5 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-white-50 text-xs fw-bold text-uppercase tracking-wider">
                            Live Console Preview
                          </span>
                          <span className="badge badge-cyan px-2 py-0.5 text-xs">Real-Time</span>
                        </div>

                        {/* Preview Box */}
                        <div className="team-preview-box text-center" style={{ borderTop: `4px solid ${formData.primary_color || '#0d6efd'}` }}>
                          {/* Circular Logo Emblem */}
                          <div
                            className="rounded-circle mx-auto d-flex align-items-center justify-content-center shadow-lg mb-2.5"
                            style={{
                              width: 64,
                              height: 64,
                              background: `linear-gradient(135deg, ${formData.primary_color || '#0d6efd'}, #081124)`,
                              border: '2px solid rgba(255,255,255,0.4)',
                            }}
                          >
                            <span className="fw-black fs-4 text-white font-monospace">
                              {formData.team_code || 'PSP'}
                            </span>
                          </div>

                          <h4 className="fw-extrabold text-white mb-0.5 fs-5">
                            {formData.team_name || 'Franchise Name'}
                          </h4>

                          <p className="text-white-50 text-xs mb-3">
                            Owner: <strong className="text-light">{formData.owner_name || 'Management'}</strong>
                            {formData.coach_name && <> • Coach: <strong className="text-light">{formData.coach_name}</strong></>}
                          </p>

                          {/* Budget & Squad Tag */}
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                            <div className="bg-dark bg-opacity-75 border border-secondary border-opacity-30 rounded-3 px-2.5 py-1 text-center">
                              <span className="text-white-50 text-xs d-block" style={{ fontSize: '0.7rem' }}>PURSE</span>
                              <strong className="text-warning font-monospace text-xs">
                                ₹{Number(formData.initial_purse || 0).toLocaleString()}
                              </strong>
                            </div>
                            <div className="bg-dark bg-opacity-75 border border-secondary border-opacity-30 rounded-3 px-2.5 py-1 text-center">
                              <span className="text-white-50 text-xs d-block" style={{ fontSize: '0.7rem' }}>SQUAD</span>
                              <strong className="text-info font-monospace text-xs">
                                0 / {formData.max_squad_size || 12}
                              </strong>
                            </div>
                          </div>

                          {/* Auction Paddle Button Preview */}
                          <div className="text-start">
                            <span className="text-white-50 text-xs d-block mb-1" style={{ fontSize: '0.72rem' }}>
                              AUCTIONEER PADDLE APPEARANCE:
                            </span>
                            <div
                              className="team-paddle-btn py-2 px-2.5"
                              style={{ '--team-color': formData.primary_color || '#0d6efd', pointerEvents: 'none' }}
                            >
                              <div className="d-flex align-items-center justify-content-between mb-1">
                                <span
                                  className="badge px-2 py-0.5 rounded-pill text-xs fw-extrabold"
                                  style={{ backgroundColor: formData.primary_color || '#0d6efd', color: '#fff' }}
                                >
                                  {formData.team_code || 'CODE'}
                                </span>
                                <span className="text-warning font-monospace text-xs fw-bold">
                                  ₹{Number(formData.initial_purse || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="fw-bold text-white small text-truncate">
                                {formData.team_name || 'Team Name'}
                              </div>
                              <div className="text-white-50 text-xs mt-0.5" style={{ fontSize: '0.72rem' }}>
                                Click to attribute bid on live podium
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-secondary bg-opacity-10 rounded-3 p-2.5 mt-3 border border-secondary border-opacity-15">
                        <span className="text-info text-xs fw-bold d-block mb-0.5">ℹ️ Tournament Tip</span>
                        <span className="text-white-50 text-xs" style={{ fontSize: '0.75rem' }}>
                          Teams can immediately bid once created. The initial purse is automatically set as the remaining purse.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5 shadow"
                    disabled={loading || !formData.team_name || !formData.team_code}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Saving Franchise...</span>
                      </>
                    ) : (
                      <>
                        <span>✓ Create Team Franchise</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div
          className="modal show d-block"
          data-bs-theme="dark"
          style={{ backgroundColor: 'rgba(2, 6, 16, 0.88)', backdropFilter: 'blur(10px)', zIndex: 1055 }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content auction-card border-secondary border-opacity-30 text-white shadow-2xl">
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="badge px-2.5 py-1 rounded-pill text-xs fw-extrabold"
                    style={{ backgroundColor: editingTeam.primary_color || '#0d6efd', color: '#fff' }}
                  >
                    {editingTeam.team_code}
                  </span>
                  <h5 className="modal-title fw-bold text-white mb-0 fs-6">
                    Edit: {editingTeam.team_name}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingTeam(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 vstack gap-3 auction-scroll-area">
                <div>
                  <label className="form-label text-light small fw-bold mb-1">Team Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingTeam.team_name}
                    onChange={(e) => setEditingTeam((prev) => ({ ...prev, team_name: e.target.value }))}
                  />
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Owner Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTeam.owner_name || ''}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, owner_name: e.target.value }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Coach Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTeam.coach_name || ''}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, coach_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">
                      Initial Purse (₹)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-dark text-warning border-secondary border-opacity-30 fw-bold">₹</span>
                      <input
                        type="number"
                        className="form-control font-monospace"
                        value={editingTeam.initial_purse}
                        onChange={(e) => setEditingTeam((prev) => ({ ...prev, initial_purse: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">
                      Remaining Purse (₹)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-dark text-success border-secondary border-opacity-30 fw-bold">₹</span>
                      <input
                        type="number"
                        className="form-control font-monospace"
                        value={editingTeam.remaining_purse}
                        onChange={(e) => setEditingTeam((prev) => ({ ...prev, remaining_purse: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Color and Squad Limit Edit */}
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Max Squad Size</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control font-monospace"
                      value={editingTeam.max_squad_size || 12}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, max_squad_size: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Franchise Color</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="color"
                        className="form-control form-control-color p-0.5 border-0 rounded-circle"
                        style={{ width: 34, height: 34, cursor: 'pointer' }}
                        value={editingTeam.primary_color || '#0d6efd'}
                        onChange={(e) => setEditingTeam((prev) => ({ ...prev, primary_color: e.target.value }))}
                      />
                      <span className="text-white-50 font-monospace text-xs">{editingTeam.primary_color || '#0d6efd'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                  onClick={() => setEditingTeam(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-bold text-xs shadow"
                  onClick={handleUpdateTeam}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
