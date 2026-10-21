'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getSportPositions, getSportCategories, formatCategoryLabel, getCategoryBadgeClass } from '@/lib/sports-config';

export default function PlayerPoolManager({ initialPlayers, isAdmin = false, tournament = null, tournamentId: propTournamentId }) {
  const activeTournamentId = propTournamentId || tournament?.id || tournament?.slug;
  const sportId = tournament?.sport_id || 'volleyball';
  const availablePositions = tournament?.sportConfig?.positions || getSportPositions(sportId);
  const availableCategories = tournament?.sportConfig?.categories || getSportCategories(sportId);

  const [players, setPlayers] = useState(initialPlayers || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', lot: '', position: '', search: '' });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState({
    base_price: '',
    lot_number: '',
    player_grade: '',
    photo_url: '',
    full_name: '',
    playing_position: '',
    player_category: '',
    team_name: '',
    district: '',
    height_cm: '',
    weight_kg: '',
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState('csv'); // 'csv' or 'registrations'
  const [csvFileName, setCsvFileName] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  const [uploadingAddPhoto, setUploadingAddPhoto] = useState(false);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');

  const [modalMessage, setModalMessage] = useState('');
  const [modalError, setModalError] = useState('');
  const [pendingHammerPlayer, setPendingHammerPlayer] = useState(null);
  const [podiumSuccessModal, setPodiumSuccessModal] = useState(null);
  const [playerRegisteredModal, setPlayerRegisteredModal] = useState(null);
  const [importSuccessModal, setImportSuccessModal] = useState(null);
  const [editSuccessModal, setEditSuccessModal] = useState(null);

  const defaultPos = availablePositions[0]?.value || 'outside_hitter';
  const defaultCat = availableCategories[0]?.value || 'palghar_open';

  const [addForm, setAddForm] = useState({
    full_name: '',
    photo_url: '',
    playing_position: defaultPos,
    player_category: defaultCat,
    height_cm: '',
    weight_kg: '',
    team_name: '',
    district: tournament?.venue?.split(',')[1]?.trim() || 'Palghar',
    lot_number: 1,
    player_grade: 'Grade A',
    base_price: 3000,
  });

  const openAddModal = () => {
    setModalMessage('');
    setModalError('');
    setPhotoUploadError('');
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setModalMessage('');
    setModalError('');
    setPhotoUploadError('');
    setShowAddModal(false);
  };

  const openImportModal = () => {
    setCsvError('');
    setCsvPreview([]);
    setCsvFileName('');
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setCsvError('');
    setCsvPreview([]);
    setCsvFileName('');
    setShowImportModal(false);
  };

  // Direct Photo File Upload handler via /api/upload-document
  const handlePhotoFile = async (e, target = 'add') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadError('Image size exceeds 5 MB limit.');
      return;
    }

    setPhotoUploadError('');
    if (target === 'add') setUploadingAddPhoto(true);
    else setUploadingEditPhoto(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('label', 'auction-player-photo');

      const res = await fetch('/api/upload-document', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');

      if (target === 'add') {
        setAddForm((prev) => ({ ...prev, photo_url: data.url }));
      } else {
        setEditForm((prev) => ({ ...prev, photo_url: data.url }));
      }
    } catch (err) {
      setPhotoUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      if (target === 'add') setUploadingAddPhoto(false);
      else setUploadingEditPhoto(false);
      e.target.value = '';
    }
  };

  // Parse CSV text for player import
  const parseCsvText = (text) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV file must have a header line and at least 1 player data row.');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
    const getIdx = (keys) => headers.findIndex((h) => keys.includes(h));

    const nameIdx = getIdx(['full_name', 'name', 'player_name', 'player']);
    const posIdx = getIdx(['playing_position', 'position', 'pos']);
    const catIdx = getIdx(['player_category', 'category', 'cat']);
    const gradeIdx = getIdx(['player_grade', 'grade']);
    const priceIdx = getIdx(['base_price', 'price', 'base']);
    const lotIdx = getIdx(['lot_number', 'lot']);
    const photoIdx = getIdx(['photo_url', 'photo', 'image', 'image_url', 'avatar']);
    const heightIdx = getIdx(['height_cm', 'height']);
    const weightIdx = getIdx(['weight_kg', 'weight']);
    const teamIdx = getIdx(['team_name', 'team', 'club', 'school']);
    const districtIdx = getIdx(['district', 'city']);

    if (nameIdx === -1) {
      throw new Error('CSV must contain a "full_name" or "name" column.');
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const nameVal = cols[nameIdx];
      if (!nameVal || !nameVal.trim()) continue;

      rows.push({
        full_name: nameVal.trim(),
        playing_position: posIdx !== -1 && cols[posIdx] ? cols[posIdx].trim() : defaultPos,
        player_category: catIdx !== -1 && cols[catIdx] ? cols[catIdx].trim() : defaultCat,
        player_grade: gradeIdx !== -1 && cols[gradeIdx] ? cols[gradeIdx].trim() : 'Grade A',
        base_price: priceIdx !== -1 && cols[priceIdx] ? Number(cols[priceIdx]) : (tournament?.min_bid_increment ? tournament.min_bid_increment * 4 : 2000),
        lot_number: lotIdx !== -1 && cols[lotIdx] ? Number(cols[lotIdx]) : 1,
        photo_url: photoIdx !== -1 && cols[photoIdx] ? cols[photoIdx].trim() : '',
        height_cm: heightIdx !== -1 && cols[heightIdx] ? Number(cols[heightIdx]) : null,
        weight_kg: weightIdx !== -1 && cols[weightIdx] ? Number(cols[weightIdx]) : null,
        team_name: teamIdx !== -1 && cols[teamIdx] ? cols[teamIdx].trim() : '',
        district: districtIdx !== -1 && cols[districtIdx] ? cols[districtIdx].trim() : (tournament?.venue?.split(',')[1]?.trim() || 'Palghar'),
      });
    }

    return rows;
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError('');
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;
        const parsed = parseCsvText(text);
        setCsvPreview(parsed);
      } catch (err) {
        setCsvError(err.message || 'Failed to parse CSV file');
        setCsvPreview([]);
      }
    };
    reader.onerror = () => setCsvError('Failed to read file');
    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    const headers = 'full_name,playing_position,player_category,player_grade,base_price,lot_number,photo_url,height_cm,weight_kg,team_name,district';
    const sampleRow1 = `Sample Marquee Star,${defaultPos},${defaultCat},Grade A,5000,1,https://images.unsplash.com/photo-1500648767791-00dcc994a43e,182,75,Olympic Club,Palghar`;
    const sampleRow2 = `Rising Talent,${defaultPos},${defaultCat},Grade B,3000,2,,176,70,District Sports,Palghar`;
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, sampleRow1, sampleRow2].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${sportId}_players_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteBulkImport = async () => {
    if (!isAdmin) return;
    if (csvPreview.length === 0) return;
    setCsvLoading(true);
    setCsvError('');
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_import',
          tournamentId: activeTournamentId,
          data: { players: csvPreview },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk import failed');

      setShowImportModal(false);
      setImportSuccessModal({ count: data.importedCount });
      setMessage(`Successfully imported ${data.importedCount} player(s) into the auction pool.`);
      setCsvPreview([]);
      setCsvFileName('');
      fetchPlayers();
    } catch (err) {
      setCsvError(err.message);
    } finally {
      setCsvLoading(false);
    }
  };

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeTournamentId
        ? `/api/auction/players?tournamentId=${encodeURIComponent(activeTournamentId)}`
        : '/api/auction/players';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPlayers(json.players || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [activeTournamentId]);

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setModalMessage('');
    setModalError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', tournamentId: activeTournamentId, data: addForm }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned an invalid response. Please verify admin privileges.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create player');

      const savedName = addForm.full_name;
      const savedPrice = Number(addForm.base_price || 0).toLocaleString();
      const savedLot = addForm.lot_number || 1;
      const savedPos = addForm.playing_position;
      const savedCat = addForm.player_category;
      const savedGrade = addForm.player_grade;
      const savedPhoto = addForm.photo_url || '';

      // In-modal notification
      setModalMessage(`✓ Player "${savedName}" registered successfully with base price ₹${savedPrice} (Lot ${savedLot})!`);
      // Outer page notification
      setMessage(`Player "${savedName}" added to auction database.`);

      // Open Action Celebration Modal
      setPlayerRegisteredModal({
        name: savedName,
        position: savedPos,
        category: savedCat,
        basePrice: savedPrice,
        lot: savedLot,
        grade: savedGrade,
        photo_url: savedPhoto,
      });

      // Clear the add player form completely with dynamic defaults
      setAddForm({
        full_name: '',
        photo_url: '',
        playing_position: defaultPos,
        player_category: defaultCat,
        height_cm: '',
        weight_kg: '',
        team_name: '',
        district: tournament?.venue?.split(',')[1]?.trim() || 'Palghar',
        lot_number: 1,
        player_grade: 'Grade A',
        base_price: 3000,
      });

      // Refresh list
      fetchPlayers();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunRegistrationsImport = async () => {
    if (!isAdmin) return;
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', tournamentId: activeTournamentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      const count = data.importedCount || 0;
      setShowImportModal(false);
      setImportSuccessModal({ count });
      setMessage(`Successfully imported ${count} verified player(s) into the auction pool.`);
      fetchPlayers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestSendToHammer = (player) => {
    if (!isAdmin) return;
    setPendingHammerPlayer(player);
  };

  const executeSendToHammer = async (player) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select', playerId: player.id, tournamentId: activeTournamentId }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned an invalid response. Please verify you are logged in as admin.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to set on hammer');

      setPendingHammerPlayer(null);
      setPodiumSuccessModal({ player });
      setMessage(`✓ ${player.full_name} is now on the auction podium.`);
      fetchPlayers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (player) => {
    if (!isAdmin) return;
    setEditingPlayer(player);
    setEditForm({
      base_price: player.base_price || 1000,
      lot_number: player.lot_number || 1,
      player_grade: player.player_grade || 'Grade A',
      photo_url: player.photo_url || '',
      full_name: player.full_name || '',
      playing_position: player.playing_position || defaultPos,
      player_category: player.player_category || defaultCat,
      team_name: player.team_name || '',
      district: player.district || '',
      height_cm: player.height_cm || '',
      weight_kg: player.weight_kg || '',
    });
  };

  const saveEdit = async () => {
    if (!isAdmin || !editingPlayer) return;
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          playerId: editingPlayer.id,
          tournamentId: activeTournamentId,
          data: editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setEditSuccessModal({
        playerName: editingPlayer.full_name,
        basePrice: editForm.base_price,
        lot: editForm.lot_number,
      });
      setMessage(`Updated ${editingPlayer.full_name} details.`);
      setEditingPlayer(null);
      fetchPlayers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePlayer = async (playerId, playerName) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove ${playerName} from the auction pool?`)) return;
    try {
      const res = await fetch('/api/auction/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', playerId, tournamentId: activeTournamentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setMessage(`Player "${playerName}" removed successfully.`);
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
                className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5 shadow-sm"
                onClick={openAddModal}
              >
                <span>+ Add Player</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 fw-bold text-xs d-inline-flex align-items-center gap-1.5"
                onClick={openImportModal}
                disabled={loading}
              >
                <span>📥 Import Players (CSV / Data)</span>
              </button>
              <Link
                href={activeTournamentId ? `/auction/t/${activeTournamentId}/admin` : '/auction/admin'}
                className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 fw-bold text-xs"
              >
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
              {availablePositions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
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
                        <div className="rounded-circle overflow-hidden bg-dark d-flex align-items-center justify-content-center border border-secondary border-opacity-40" style={{ width: 40, height: 40, flexShrink: 0 }}>
                          {player.photo_url ? (
                            <img src={player.photo_url} alt={player.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span>{tournament?.sportConfig?.icon || '🏆'}</span>
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
                      <span className={`badge px-2 py-0.5 rounded-pill text-xs fw-bold d-inline-block mb-1 ${getCategoryBadgeClass(player.player_category)}`}>
                        {formatCategoryLabel(player.player_category)}
                      </span>
                      <span className="text-white-50 d-block text-xs">
                        {player.player_grade || 'Grade A'}
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
                              onClick={() => requestSendToHammer(player)}
                            >
                              To Podium →
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill px-2 py-0.5 text-xs"
                            onClick={() => handleDeletePlayer(player.id, player.full_name)}
                            title="Remove player"
                          >
                            🗑️
                          </button>
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
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge badge-gold px-2 py-0.5 rounded-pill text-xs">
                    EDIT
                  </span>
                  <h5 className="modal-title fw-bold text-white mb-0 fs-6">
                    Edit Player: {editingPlayer.full_name}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingPlayer(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 vstack gap-3 auction-scroll-area">
                {/* Photo Upload & Preview */}
                <div>
                  <label className="form-label text-light small fw-bold mb-1.5 d-flex align-items-center justify-content-between">
                    <span>Player Photo</span>
                    <span className="text-secondary text-xs">JPG, PNG, WEBP</span>
                  </label>
                  <div className="d-flex align-items-center gap-3 p-2.5 rounded-3 bg-dark border border-secondary border-opacity-30">
                    <div className="player-photo-preview" style={{ width: 68, height: 68 }}>
                      {editForm.photo_url ? (
                        <img src={editForm.photo_url} alt={editingPlayer.full_name} />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary fs-3">
                          {tournament?.sportConfig?.icon || '🏆'}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1.5">
                        <label className="btn btn-xs btn-outline-info rounded-pill px-3 py-1 text-xs mb-0 cursor-pointer">
                          {uploadingEditPhoto ? 'Uploading...' : (editForm.photo_url ? 'Change Photo' : 'Upload Photo')}
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            disabled={uploadingEditPhoto}
                            onChange={(e) => handlePhotoFile(e, 'edit')}
                          />
                        </label>
                        {editForm.photo_url && (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1 text-xs"
                            onClick={() => setEditForm((prev) => ({ ...prev, photo_url: '' }))}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-30 text-xs"
                        placeholder="Or enter direct photo URL"
                        value={editForm.photo_url || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label text-light small fw-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Playing Position</label>
                    <select
                      className="form-select"
                      value={editForm.playing_position}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, playing_position: e.target.value }))}
                    >
                      {availablePositions.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Category</label>
                    <select
                      className="form-select"
                      value={editForm.player_category}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, player_category: e.target.value }))}
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Base Price (₹)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-dark text-warning border-secondary border-opacity-30 fw-bold">₹</span>
                      <input
                        type="number"
                        step="500"
                        className="form-control font-monospace fw-bold"
                        value={editForm.base_price}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, base_price: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="col-6">
                    <label className="form-label text-light small fw-bold mb-1">Auction Lot Assignment</label>
                    <select
                      className="form-select"
                      value={editForm.lot_number}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, lot_number: Number(e.target.value) }))}
                    >
                      <option value="1">Lot 1: Icon Players</option>
                      <option value="2">Lot 2: Open Category</option>
                      <option value="3">Lot 3: Youth Categories</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label text-light small fw-bold mb-1">Player Grade Tier</label>
                  <select
                    className="form-select"
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

              <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                  onClick={() => setEditingPlayer(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-bold text-xs shadow"
                  onClick={saveEdit}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ADD PLAYER MODAL */}
      {isAdmin && showAddModal && (
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
              <form onSubmit={handleCreatePlayer}>
                <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge badge-cyan px-2 py-0.5 rounded-pill text-xs">
                      NEW PLAYER
                    </span>
                    <h5 className="modal-title fw-bold text-white mb-0 fs-6">
                      Add Player to Auction Pool
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeAddModal}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4 vstack gap-3 auction-scroll-area">
                  {/* In-modal Save Notification Banner */}
                  {modalMessage && (
                    <div className="alert alert-success border-0 bg-success bg-opacity-20 text-success d-flex align-items-center justify-content-between py-2.5 px-3 rounded-3 small shadow-sm mb-1" role="alert">
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
                    <div className="alert alert-danger border-0 bg-danger bg-opacity-20 text-danger d-flex align-items-center justify-content-between py-2.5 px-3 rounded-3 small shadow-sm mb-1" role="alert">
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

                  {/* Player Photo Upload */}
                  <div>
                    <label className="form-label text-light small fw-bold mb-1.5 d-flex align-items-center justify-content-between">
                      <span>Player Profile Photo</span>
                      <span className="text-secondary text-xs">JPG, PNG, WEBP (Max 5MB)</span>
                    </label>

                    {addForm.photo_url ? (
                      <div className="d-flex align-items-center gap-3 p-2.5 rounded-3 bg-dark border border-secondary border-opacity-30">
                        <div className="player-photo-preview" style={{ width: 68, height: 68 }}>
                          <img src={addForm.photo_url} alt="Uploaded Player Photo" />
                        </div>
                        <div className="flex-grow-1">
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 rounded-pill text-xs fw-bold mb-1.5 d-inline-block">
                            ✓ Photo Attached
                          </span>
                          <div className="d-flex align-items-center gap-2">
                            <label className="btn btn-xs btn-outline-info rounded-pill px-2.5 py-1 text-xs mb-0 cursor-pointer">
                              {uploadingAddPhoto ? 'Uploading...' : 'Change Photo'}
                              <input
                                type="file"
                                accept="image/*"
                                className="d-none"
                                disabled={uploadingAddPhoto}
                                onChange={(e) => handlePhotoFile(e, 'add')}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1 text-xs"
                              onClick={() => setAddForm((prev) => ({ ...prev, photo_url: '' }))}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="player-photo-dropzone d-block mb-1.5 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            disabled={uploadingAddPhoto}
                            onChange={(e) => handlePhotoFile(e, 'add')}
                          />
                          {uploadingAddPhoto ? (
                            <div className="py-2 text-info">
                              <div className="spinner-border spinner-border-sm text-info me-2" role="status"></div>
                              <span className="small fw-semibold">Uploading player photo...</span>
                            </div>
                          ) : (
                            <div className="py-1">
                              <div className="fs-3 mb-1">📸</div>
                              <div className="small fw-bold text-white mb-0.5">Click or drag &amp; drop to upload player photo</div>
                              <span className="text-secondary text-xs">High-resolution headshots appear on stage &amp; console</span>
                            </div>
                          )}
                        </label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-dark text-secondary border-secondary border-opacity-30 text-xs">Or URL</span>
                          <input
                            type="url"
                            className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-30 text-xs"
                            placeholder="https://example.com/photo.jpg"
                            value={addForm.photo_url || ''}
                            onChange={(e) => setAddForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                    {photoUploadError && (
                      <div className="text-danger small mt-1 text-xs">{photoUploadError}</div>
                    )}
                  </div>

                  <div>
                    <label className="form-label text-light small fw-bold mb-1">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Kumar Patil"
                      required
                      value={addForm.full_name}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">Playing Position</label>
                      <select
                        className="form-select"
                        value={addForm.playing_position}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, playing_position: e.target.value }))}
                      >
                        {availablePositions.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">Category</label>
                      <select
                        className="form-select"
                        value={addForm.player_category}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, player_category: e.target.value }))}
                      >
                        {availableCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">Height (cm)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 182"
                        value={addForm.height_cm}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, height_cm: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 74"
                        value={addForm.weight_kg}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, weight_kg: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">Club / School</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Palghar Spikers Club"
                        value={addForm.team_name}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, team_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">District</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.district}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, district: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">Lot Assignment</label>
                      <select
                        className="form-select"
                        value={addForm.lot_number}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, lot_number: Number(e.target.value) }))}
                      >
                        <option value="1">Lot 1: Icon Players</option>
                        <option value="2">Lot 2: Open Category</option>
                        <option value="3">Lot 3: Youth Categories</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-light small fw-bold mb-1">Grade Tier</label>
                      <select
                        className="form-select"
                        value={addForm.player_grade}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, player_grade: e.target.value }))}
                      >
                        <option value="Icon">Icon</option>
                        <option value="Grade A">Grade A</option>
                        <option value="Grade B">Grade B</option>
                        <option value="Grade C">Grade C</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-light small fw-bold mb-1">
                      Base Price (₹) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-dark text-warning border-secondary border-opacity-30 fw-bold">₹</span>
                      <input
                        type="number"
                        step="500"
                        min="500"
                        className="form-control font-monospace fw-bold"
                        required
                        value={addForm.base_price}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, base_price: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                    onClick={closeAddModal}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-bold text-xs shadow"
                    disabled={loading || !addForm.full_name}
                  >
                    {loading ? 'Saving Player...' : '+ Save Player to Pool'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT PLAYERS MODAL (CSV & DATA IMPORT) */}
      {isAdmin && showImportModal && (
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
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge badge-cyan px-2 py-0.5 rounded-pill text-xs">
                    DATA IMPORT
                  </span>
                  <h5 className="modal-title fw-bold text-white mb-0 fs-6">
                    Import Players &amp; Photos ({tournament?.sport_name || 'Tournament'})
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeImportModal}
                  aria-label="Close"
                ></button>
              </div>

              {/* Import Tabs */}
              <div className="px-4 pt-3 border-bottom border-secondary border-opacity-20 d-flex gap-2">
                <button
                  type="button"
                  className={`import-tab-btn ${importTab === 'csv' ? 'active' : ''}`}
                  onClick={() => setImportTab('csv')}
                >
                  📊 CSV / Spreadsheet Import (with Photos)
                </button>
                <button
                  type="button"
                  className={`import-tab-btn ${importTab === 'registrations' ? 'active' : ''}`}
                  onClick={() => setImportTab('registrations')}
                >
                  🏅 Verified Registrations
                </button>
              </div>

              <div className="modal-body p-4 vstack gap-3 auction-scroll-area">
                {importTab === 'csv' ? (
                  <>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-25">
                      <div>
                        <h6 className="fw-bold text-white mb-0.5">Bulk Upload CSV with Photo URLs</h6>
                        <p className="text-secondary small mb-0 text-xs">
                          Upload a spreadsheet containing names, positions, base prices, lots, and photo URLs.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-warning rounded-pill px-3 py-1.5 fw-bold text-xs"
                        onClick={downloadSampleCsv}
                      >
                        ⬇ Download Sample CSV Template
                      </button>
                    </div>

                    {csvError && (
                      <div className="alert alert-danger border-0 py-2 px-3 small d-flex align-items-center justify-content-between mb-0" role="alert">
                        <span><strong>Error:</strong> {csvError}</span>
                        <button type="button" className="btn-close py-1" onClick={() => setCsvError('')} aria-label="Close"></button>
                      </div>
                    )}

                    {/* Drag and Drop Zone for CSV */}
                    <label className="player-photo-dropzone d-block cursor-pointer">
                      <input
                        type="file"
                        accept=".csv,text/csv,text/plain"
                        className="d-none"
                        onChange={handleCsvFileChange}
                      />
                      <div className="py-2">
                        <div className="fs-3 mb-1">📄</div>
                        <div className="small fw-bold text-white mb-0.5">
                          {csvFileName ? `Selected: ${csvFileName}` : 'Click or drop your CSV file here'}
                        </div>
                        <span className="text-secondary text-xs">
                          Supports columns: full_name, playing_position, player_grade, base_price, lot_number, photo_url
                        </span>
                      </div>
                    </label>

                    {/* Preview Table */}
                    {csvPreview.length > 0 && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-white small fw-bold">
                            Found {csvPreview.length} player(s) • {csvPreview.filter((p) => p.photo_url).length} with photo URL
                          </span>
                          <span className="badge badge-emerald px-2 py-0.5 rounded-pill text-xs">Ready for Import</span>
                        </div>
                        <div className="table-responsive border border-secondary border-opacity-25 rounded-3" style={{ maxHeight: 240 }}>
                          <table className="table table-dark table-hover mb-0 align-middle text-xs">
                            <thead className="table-dark text-white-50 text-uppercase border-secondary border-opacity-25">
                              <tr>
                                <th>#</th>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Grade</th>
                                <th>Lot</th>
                                <th>Base Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.map((p, idx) => (
                                <tr key={idx} className="border-secondary border-opacity-15">
                                  <td className="text-secondary font-monospace">{idx + 1}</td>
                                  <td>
                                    <div className="player-photo-preview" style={{ width: 32, height: 32 }}>
                                      {p.photo_url ? (
                                        <img src={p.photo_url} alt={p.full_name} />
                                      ) : (
                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary" style={{ fontSize: '0.8rem' }}>
                                          📷
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="fw-bold text-white">{p.full_name}</td>
                                  <td className="text-capitalize text-secondary">{p.playing_position?.replace(/_/g, ' ')}</td>
                                  <td><span className="badge badge-gold px-1.5 py-0.5 text-xs">{p.player_grade}</span></td>
                                  <td>Lot {p.lot_number}</td>
                                  <td className="font-monospace text-warning fw-bold">₹{Number(p.base_price).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-25">
                    <h6 className="fw-bold text-white mb-1">Import from Official Registrations</h6>
                    <p className="text-secondary small mb-3">
                      Pulls all verified, approved tournament player registrations directly into the auction pool.
                      Uploaded player photos, identity docs, positions, heights, weights, and categories will be automatically imported and mapped.
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-info rounded-pill px-4 py-2 fw-bold text-xs d-inline-flex align-items-center gap-2"
                      onClick={handleRunRegistrationsImport}
                      disabled={loading}
                    >
                      <span>📥 Run Registration Import Now</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                  onClick={closeImportModal}
                >
                  Close
                </button>
                {importTab === 'csv' && csvPreview.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-bold text-xs shadow"
                    onClick={handleExecuteBulkImport}
                    disabled={csvLoading}
                  >
                    {csvLoading ? 'Importing...' : `Import ${csvPreview.length} Player(s) to Pool →`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM LOAD TO PODIUM MODAL */}
      {pendingHammerPlayer && (
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
                  <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
                    Podium Selection
                  </span>
                  <h5 className="modal-title fw-extrabold text-white mb-0 fs-6">
                    Allow Player to Hammer Podium
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPendingHammerPlayer(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="text-center py-2">
                <div className="fs-1 mb-2">🔨</div>
                <h4 className="fw-black text-white mb-1 fs-5">
                  Put {pendingHammerPlayer.full_name} on Live Podium?
                </h4>
                <p className="text-white-50 text-xs mb-3">
                  This player will be set as the active podium target for all franchise paddles in the live auction.
                </p>

                <div className="bg-dark bg-opacity-70 rounded-3 p-3 border border-secondary border-opacity-30 text-start mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <span className="text-white-50 text-xs">Playing Position:</span>
                    <span className="badge badge-cyan text-xs text-uppercase">{pendingHammerPlayer.playing_position}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <span className="text-white-50 text-xs">Lot & Grade:</span>
                    <strong className="text-white small">Lot #{pendingHammerPlayer.lot_number || 1} • {pendingHammerPlayer.player_grade || 'Grade A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-white-50 text-xs">Starting Base Price:</span>
                    <strong className="text-warning font-monospace fs-5 fw-black">₹{Number(pendingHammerPlayer.base_price || 1000).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top border-secondary border-opacity-25">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 text-xs"
                  onClick={() => setPendingHammerPlayer(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-bold text-xs shadow"
                  disabled={loading}
                  onClick={() => executeSendToHammer(pendingHammerPlayer)}
                >
                  {loading ? 'Activating Podium...' : '🔨 Load to Podium Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PODIUM SUCCESS MODAL */}
      {podiumSuccessModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-md modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-success-card text-white text-center p-4 shadow-2xl">
              <div className="modal-action-avatar bg-success text-white">
                🔨
              </div>
              <span className="badge badge-emerald px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase mx-auto mb-2">
                Now Live On Podium
              </span>
              <h2 className="fs-4 fw-black text-white mb-1">
                PLAYER ON HAMMER!
              </h2>
              <p className="text-white-50 text-xs mb-3">
                Franchises can now attribute paddle bids for this player
              </p>

              <div className="bg-dark bg-opacity-70 rounded-3 p-3 border border-secondary border-opacity-30 mb-3 text-start">
                <h4 className="fw-extrabold text-white mb-1 fs-5">
                  {podiumSuccessModal.player.full_name}
                </h4>
                <div className="d-flex align-items-center justify-content-between text-xs text-white-50">
                  <span className="text-capitalize">{podiumSuccessModal.player.playing_position?.replace('_', ' ')}</span>
                  <span className="text-warning font-monospace fw-bold">Base: ₹{Number(podiumSuccessModal.player.base_price || 1000).toLocaleString()}</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light rounded-pill px-3.5 py-2 fw-semibold text-xs flex-fill"
                  onClick={() => setPodiumSuccessModal(null)}
                >
                  Stay in Player Pool
                </button>
                <Link
                  href="/auction/admin"
                  className="btn btn-sm btn-primary rounded-pill px-4 py-2 fw-bold text-xs flex-fill shadow"
                  onClick={() => setPodiumSuccessModal(null)}
                >
                  Open Live Podium ↗
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER REGISTERED MODAL */}
      {playerRegisteredModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-md modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-success-card text-white text-center p-4 shadow-2xl">
              <div className="d-flex justify-content-center mb-3">
                {playerRegisteredModal.photo_url ? (
                  <div className="player-photo-preview" style={{ width: 76, height: 76 }}>
                    <img src={playerRegisteredModal.photo_url} alt={playerRegisteredModal.name} />
                  </div>
                ) : (
                  <div className="modal-action-avatar bg-primary text-white">
                    {tournament?.sportConfig?.icon || '🏆'}
                  </div>
                )}
              </div>
              <span className="badge badge-cyan px-3 py-1 rounded-pill text-xs fw-extrabold text-uppercase mx-auto mb-2">
                Auction Pool Registered
              </span>
              <h2 className="fs-4 fw-black text-white mb-1">
                PLAYER ADDED!
              </h2>
              <p className="text-white-50 text-xs mb-3">
                Successfully enrolled into the {tournament?.sport_name || 'Tournament'} auction database
              </p>

              <div className="bg-dark bg-opacity-70 rounded-3 p-3 border border-secondary border-opacity-30 mb-3 text-start">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-white-50 text-xs">Full Name:</span>
                  <strong className="text-white small fw-bold">{playerRegisteredModal.name}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-white-50 text-xs">Position:</span>
                  <span className="badge badge-cyan text-xs text-uppercase">{playerRegisteredModal.position}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-white-50 text-xs">Lot & Grade:</span>
                  <span className="text-white small">Lot #{playerRegisteredModal.lot} • {playerRegisteredModal.grade}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-white-50 text-xs">Base Price:</span>
                  <strong className="text-warning font-monospace fs-6 fw-bold">₹{playerRegisteredModal.basePrice}</strong>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light rounded-pill px-3.5 py-2 fw-semibold text-xs flex-fill"
                  onClick={() => setPlayerRegisteredModal(null)}
                >
                  View Player Pool
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-4 py-2 fw-bold text-xs flex-fill shadow"
                  onClick={() => {
                    setPlayerRegisteredModal(null);
                    openAddModal();
                  }}
                >
                  + Add Another Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT SUCCESS MODAL */}
      {importSuccessModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-sm modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-confirm-card text-white p-4 text-center shadow-2xl">
              <div className="fs-1 mb-2">📋</div>
              <h5 className="fw-bold text-white mb-1 fs-6">Import Complete!</h5>
              <p className="text-white-50 text-xs mb-3">
                Successfully imported <strong>{importSuccessModal.count}</strong> verified player(s) into the auction pool.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-bold text-xs w-100"
                onClick={() => setImportSuccessModal(null)}
              >
                View Pool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER EDIT SAVED MODAL */}
      {editSuccessModal && (
        <div
          className="modal show d-block auction-modal-overlay"
          data-bs-theme="dark"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-sm modal-dialog-centered auction-modal-pop">
            <div className="modal-content auction-card modal-confirm-card text-white p-4 text-center shadow-2xl">
              <div className="fs-1 mb-2">✓</div>
              <h5 className="fw-bold text-white mb-1 fs-6">Player Updated!</h5>
              <p className="text-white-50 text-xs mb-3">
                <strong>{editSuccessModal.playerName}</strong> details updated (Base: ₹{Number(editSuccessModal.basePrice || 1000).toLocaleString()}, Lot #{editSuccessModal.lot}).
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-bold text-xs w-100"
                onClick={() => setEditSuccessModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
