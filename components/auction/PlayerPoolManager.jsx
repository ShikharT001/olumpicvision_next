'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function PlayerPoolManager({ initialPlayers, isAdmin = false }) {
  const [players, setPlayers] = useState(initialPlayers || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', lot: '', position: '', search: '' });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState({ base_price: '', lot_number: '', player_grade: '' });

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auction/players');
      if (res.ok) {
        const json = await res.json();
        setPlayers(json.players || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setMessage(`Successfully imported ${data.importedCount || 0} verified player(s) into the auction pool.`);
      fetchPlayers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToHammer = async (player) => {
    if (!window.confirm(`Load ${player.full_name} onto the live auction podium?`)) return;
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select', playerId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set on hammer');

      setMessage(`${player.full_name} is now on the auction podium.`);
      fetchPlayers();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (player) => {
    setEditingPlayer(player);
    setEditForm({
      base_price: player.base_price || 1000,
      lot_number: player.lot_number || 1,
      player_grade: player.player_grade || 'Grade A',
    });
  };

  const saveEdit = async () => {
    if (!editingPlayer) return;
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          playerId: editingPlayer.id,
          data: editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setMessage(`Updated ${editingPlayer.full_name} details.`);
      setEditingPlayer(null);
      fetchPlayers();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = players.filter((p) => {
    if (filter.status && p.auction_status !== filter.status) return false;
    if (filter.lot && p.lot_number !== Number(filter.lot)) return false;
    if (filter.position && p.playing_position !== filter.position) return false;
    if (filter.search) {
      const term = filter.search.toLowerCase();
      return (
        p.full_name?.toLowerCase().includes(term) ||
        p.playing_position?.toLowerCase().includes(term) ||
        p.player_category?.toLowerCase().includes(term) ||
        p.team_name?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalCount = players.length;
  const queuedCount = players.filter((p) => p.auction_status === 'queued').length;
  const soldCount = players.filter((p) => p.auction_status === 'sold').length;
  const unsoldCount = players.filter((p) => p.auction_status === 'unsold').length;

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      {/* Notifications */}
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
          <span className="badge badge-cyan px-2.5 py-1 rounded-pill text-xs fw-bold text-uppercase mb-1">
            Player Registry
          </span>
          <h2 className="h3 fw-extrabold text-white mb-0 tracking-tight">
            Auction Player Pool & Lot Management
          </h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isAdmin ? (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5"
                onClick={handleImport}
                disabled={loading}
              >
                <span>📥 Import Verified PDVL Players</span>
              </button>
              <Link href="/auction/admin" className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-bold text-xs">
                Open Podium ↗
              </Link>
            </>
          ) : (
            <span className="badge bg-secondary bg-opacity-35 text-white px-3 py-1.5 rounded-pill text-xs fw-semibold">
              👁️ View-Only Registered Player Roster
            </span>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block">Total Pool</span>
            <strong className="fs-4 fw-bold text-white">{totalCount}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block">Queued / Ready</span>
            <strong className="fs-4 fw-bold text-info">{queuedCount}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block">Players Sold</span>
            <strong className="fs-4 fw-bold text-success">{soldCount}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="auction-card p-3 text-center">
            <span className="text-white-50 text-xs d-block">Unsold (Round 2)</span>
            <strong className="fs-4 fw-bold text-warning">{unsoldCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="auction-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-sm-4">
            <input
              type="text"
              className="form-control form-control-sm bg-dark text-white border-secondary"
              placeholder="Search player name, position, club..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="col-6 col-sm-3 col-md-2">
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary"
              value={filter.status}
              onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="on_hammer">On Hammer</option>
              <option value="sold">Sold</option>
              <option value="unsold">Unsold</option>
            </select>
          </div>
          <div className="col-6 col-sm-3 col-md-2">
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary"
              value={filter.lot}
              onChange={(e) => setFilter((prev) => ({ ...prev, lot: e.target.value }))}
            >
              <option value="">All Lots</option>
              <option value="1">Lot 1</option>
              <option value="2">Lot 2</option>
              <option value="3">Lot 3</option>
            </select>
          </div>
          <div className="col-6 col-sm-3 col-md-2">
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary"
              value={filter.position}
              onChange={(e) => setFilter((prev) => ({ ...prev, position: e.target.value }))}
            >
              <option value="">All Positions</option>
              <option value="setter">Setter</option>
              <option value="outside_hitter">Outside Hitter</option>
              <option value="opposite_hitter">Opposite Hitter</option>
              <option value="middle_blocker">Middle Blocker</option>
              <option value="libero">Libero</option>
            </select>
          </div>
          <div className="col-6 col-sm-3 col-md-2 text-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 text-xs"
              onClick={() => setFilter({ status: '', lot: '', position: '', search: '' })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="auction-card overflow-hidden">
        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0 align-middle small">
            <thead className="table-dark text-white-50 text-uppercase text-xs border-secondary border-opacity-25">
              <tr>
                <th scope="col" style={{ width: 60 }}>#</th>
                <th scope="col">Player Details</th>
                <th scope="col">Position & Height</th>
                <th scope="col">Grade & Category</th>
                <th scope="col">Lot</th>
                <th scope="col">Base Price</th>
                <th scope="col">Status</th>
                {isAdmin && <th scope="col" className="text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-4 text-white-50">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((player, idx) => (
                  <tr key={player.id} className="border-secondary border-opacity-20">
                    <td className="text-white-50 font-monospace">{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                          {player.photo_url ? (
                            <img src={player.photo_url} alt={player.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span>🏐</span>
                          )}
                        </div>
                        <div>
                          <strong className="text-white d-block">{player.full_name}</strong>
                          <span className="text-white-50 text-xs">{player.team_name || 'Individual'} • {player.district || 'Palghar'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-capitalize text-white fw-semibold d-block">
                        {player.playing_position?.replace('_', ' ')}
                      </span>
                      <span className="text-white-50 text-xs">
                        {player.height_cm ? `${player.height_cm} cm` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gold px-2 py-0.5 text-xs d-inline-block mb-1">
                        {player.player_grade || 'Grade A'}
                      </span>
                      <span className="text-white-50 d-block text-xs text-capitalize">
                        {player.player_category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-25 text-light px-2 py-1 rounded-pill">
                        Lot #{player.lot_number || 1}
                      </span>
                    </td>
                    <td>
                      <strong className="text-warning font-monospace">
                        ₹{Number(player.base_price || 1000).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      {player.auction_status === 'sold' && (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill text-xs">
                          SOLD (₹{Number(player.sold_price || 0).toLocaleString()})
                        </span>
                      )}
                      {player.auction_status === 'on_hammer' && (
                        <span className="badge bg-danger text-white rounded-pill px-2 py-1 text-xs fw-bold animate-pulse">
                          ● ON HAMMER
                        </span>
                      )}
                      {player.auction_status === 'queued' && (
                        <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 rounded-pill text-xs">
                          QUEUED
                        </span>
                      )}
                      {player.auction_status === 'unsold' && (
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill text-xs">
                          UNSOLD
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="text-end">
                        <div className="d-inline-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0.5 text-xs"
                            onClick={() => startEdit(player)}
                          >
                            ✏️ Edit
                          </button>
                          {player.auction_status !== 'sold' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 text-xs fw-bold"
                              onClick={() => handleSendToHammer(player)}
                            >
                              To Podium →
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isAdmin && editingPlayer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content auction-card border-secondary text-white">
              <div className="modal-header border-secondary border-opacity-25">
                <h5 className="modal-title fw-bold text-white">Edit Auction Player: {editingPlayer.full_name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingPlayer(null)}></button>
              </div>
              <div className="modal-body vstack gap-3">
                <div>
                  <label className="form-label text-white-50 small mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    className="form-control bg-dark text-white border-secondary"
                    value={editForm.base_price}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, base_price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label text-white-50 small mb-1">Lot Number</label>
                  <input
                    type="number"
                    className="form-control bg-dark text-white border-secondary"
                    value={editForm.lot_number}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, lot_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label text-white-50 small mb-1">Player Grade</label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
                    value={editForm.player_grade}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, player_grade: e.target.value }))}
                  >
                    <option value="Icon">Icon Player</option>
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer border-secondary border-opacity-25">
                <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setEditingPlayer(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-sm btn-primary rounded-pill px-4 fw-bold" onClick={saveEdit}>
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
