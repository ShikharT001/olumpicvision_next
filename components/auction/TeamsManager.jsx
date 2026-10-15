'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content auction-card border-secondary text-white">
              <form onSubmit={handleCreateTeam}>
                <div className="modal-header border-secondary border-opacity-25">
                  <h5 className="modal-title fw-bold text-white">Add New Tournament Team</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body vstack gap-3">
                  <div className="row g-2">
                    <div className="col-8">
                      <label className="form-label text-white-50 small mb-1">Team Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. Palghar Spikers"
                        required
                        value={formData.team_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, team_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label text-white-50 small mb-1">Code (3-4 Letters) <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        maxLength={5}
                        className="form-control bg-dark text-white border-secondary text-uppercase"
                        placeholder="PSP"
                        required
                        value={formData.team_code}
                        onChange={(e) => setFormData((prev) => ({ ...prev, team_code: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-white-50 small mb-1">Owner Name</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. Mahesh Patil"
                        value={formData.owner_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, owner_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-white-50 small mb-1">Coach Name</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. Vikram Joshi"
                        value={formData.coach_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, coach_name: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-white-50 small mb-1">Starting Purse (₹) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="100000"
                        required
                        value={formData.initial_purse}
                        onChange={(e) => setFormData((prev) => ({ ...prev, initial_purse: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-white-50 small mb-1">Theme Color</label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="color"
                          className="form-control form-control-color bg-dark border-secondary p-1"
                          value={formData.primary_color}
                          onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
                        />
                        <span className="small text-white-50">{formData.primary_color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-white-50 small mb-1">Min Squad Size</label>
                      <input
                        type="number"
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.min_squad_size}
                        onChange={(e) => setFormData((prev) => ({ ...prev, min_squad_size: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-white-50 small mb-1">Max Squad Size</label>
                      <input
                        type="number"
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.max_squad_size}
                        onChange={(e) => setFormData((prev) => ({ ...prev, max_squad_size: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary border-opacity-25">
                  <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary rounded-pill px-4 fw-bold" disabled={loading}>
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content auction-card border-secondary text-white">
              <div className="modal-header border-secondary border-opacity-25">
                <h5 className="modal-title fw-bold text-white">Edit Team: {editingTeam.team_name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingTeam(null)}></button>
              </div>
              <div className="modal-body vstack gap-3">
                <div>
                  <label className="form-label text-white-50 small mb-1">Team Name</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    value={editingTeam.team_name}
                    onChange={(e) => setEditingTeam((prev) => ({ ...prev, team_name: e.target.value }))}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-white-50 small mb-1">Owner Name</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      value={editingTeam.owner_name || ''}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, owner_name: e.target.value }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-white-50 small mb-1">Coach Name</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      value={editingTeam.coach_name || ''}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, coach_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-white-50 small mb-1">Initial Purse (₹)</label>
                    <input
                      type="number"
                      className="form-control bg-dark text-white border-secondary"
                      value={editingTeam.initial_purse}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, initial_purse: e.target.value }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-white-50 small mb-1">Remaining Purse (₹)</label>
                    <input
                      type="number"
                      className="form-control bg-dark text-white border-secondary"
                      value={editingTeam.remaining_purse}
                      onChange={(e) => setEditingTeam((prev) => ({ ...prev, remaining_purse: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-secondary border-opacity-25">
                <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setEditingTeam(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-sm btn-primary rounded-pill px-4 fw-bold" onClick={handleUpdateTeam}>
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
