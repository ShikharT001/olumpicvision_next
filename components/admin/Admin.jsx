'use client';

import { useMemo, useState } from 'react';
import { adminDeleteRow, adminUpdateRow, adminInsertRow, adminConfirmParticipation } from '@/app/admin/actions';

const COMPACT_COLUMNS = new Set([
  'id',
  'registration_id',
  'provider_order_id',
  'provider_payment_id',
  'provider_signature',
]);

const TABLE_HIDDEN_COLUMNS = {
  payment_transactions: ['raw_response', 'provider_signature'],
  payment_transaction_details: ['raw_response'],
};

const CHECKBOX_COLUMN_PRIORITY = [
  'tshirt_size',
  'gender',
  'sender_gender',
  'registration_status',
  'payment_status',
  'registration_payment_status',
  'transaction_status',
  'status',
  'category_code',
  'category_label',
  'gender_allowed',
  'payment_required',
  'provider',
  'currency',
];

const CHECKBOX_COLUMN_EXCLUDED = new Set([
  'id',
  'registration_id',
  'provider_order_id',
  'provider_payment_id',
  'provider_signature',
  'raw_response',
  'full_name',
  'sender_name',
  'mobile_no',
  'email',
  'sender_mobile_no',
  'school_college_name',
  'description',
  'bib_number',
  'document_url',
  'partner_document_url',
  'payment_screenshot_url',
  'fee_amount_paise',
  'amount_paise',
  'fee_amount_rupees',
]);

function labelize(value) {
  if (value === 'fee_amount_paise') return 'Fee (₹)';
  if (value === 'amount_paise') return 'Amount (₹)';
  if (value === 'tshirt_size') return 'T-Shirt Size';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getVisibleColumns(table) {
  const hiddenColumns = new Set(TABLE_HIDDEN_COLUMNS[table?.name] || []);
  return (table?.columns || []).filter((column) => !hiddenColumns.has(column));
}

function serializeFilterValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'blank';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function getRowSearchText(row) {
  return Object.values(row)
    .map((value) => serializeFilterValue(value))
    .join(' ')
    .toLowerCase();
}

function getFilterGroups(table, visibleColumns) {
  if (!table) {
    return [];
  }

  const groups = visibleColumns
    .filter((column) => {
      if (CHECKBOX_COLUMN_EXCLUDED.has(column)) {
        return false;
      }

      if (column.endsWith('_at') || column.includes('date')) {
        return false;
      }

      return true;
    })
    .map((column) => {
      const values = Array.from(
        new Set(
          table.rows.map((row) => serializeFilterValue(row[column]))
        )
      )
        .filter((value) => value !== 'blank')
        .sort((a, b) => a.localeCompare(b));

      return { column, values };
    })
    .filter(({ column, values }) => {
      const isPriority = CHECKBOX_COLUMN_PRIORITY.includes(column);
      const maxValues = isPriority ? 20 : 10;
      return (
        values.length >= 1 &&
        values.length <= maxValues &&
        values.every((value) => value.length <= 42)
      );
    });

  return groups
    .sort((a, b) => {
      const aPriority = CHECKBOX_COLUMN_PRIORITY.indexOf(a.column);
      const bPriority = CHECKBOX_COLUMN_PRIORITY.indexOf(b.column);
      const normalizedA = aPriority === -1 ? 999 : aPriority;
      const normalizedB = bPriority === -1 ? 999 : bPriority;

      if (normalizedA !== normalizedB) {
        return normalizedA - normalizedB;
      }

      return a.column.localeCompare(b.column);
    })
    .slice(0, 6);
}

function rowMatchesFilters(row, query, checkboxFilters) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery && !getRowSearchText(row).includes(normalizedQuery)) {
    return false;
  }

  for (const [column, selectedValues] of Object.entries(checkboxFilters)) {
    if (!selectedValues || selectedValues.length === 0) {
      continue;
    }

    if (!selectedValues.includes(serializeFilterValue(row[column]))) {
      return false;
    }
  }

  return true;
}

function formatValue(value, column) {
  if (value === null || value === undefined) {
    return <span style={{ color: '#94a3b8' }}>-</span>;
  }

  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return (
      <span title={JSON.stringify(value)} style={styles.mutedValue}>
        JSON {keys.length ? `(${keys.length} fields)` : ''}
      </span>
    );
  }

  const strVal = String(value);

  if (column === 'amount_paise' || column === 'fee_amount_paise') {
    const rupees = Number(value) / 100;
    return `₹ ${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`;
  }

  // Render document URLs as clickable links
  if ((column === 'document_url' || column === 'partner_document_url' || column === 'payment_screenshot_url') && strVal.startsWith('http')) {
    return (
      <a href={strVal} target="_blank" rel="noopener noreferrer" style={{ color: '#0d6efd', fontSize: 12 }}>
        {column === 'payment_screenshot_url' ? 'View Slip ↗' : 'View Doc ↗'}
      </a>
    );
  }

  if (COMPACT_COLUMNS.has(column) && strVal.length > 18) {
    return <span title={strVal} style={styles.monoValue}>{strVal.slice(0, 10) + '...'}</span>;
  }

  if (strVal.length > 80) {
    return <span title={strVal}>{strVal.slice(0, 77)}...</span>;
  }

  return strVal;
}

function formatDetailValue(value, key) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#94a3b8' }}>-</span>;
  }

  if (key === 'amount_paise' || key === 'fee_amount_paise') {
    const rupees = Number(value) / 100;
    return <strong style={{ color: '#0f6' }}>₹ {rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}</strong>;
  }

  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(value).toLocaleString();
  }

  if (typeof value === 'string' && value.startsWith('http')) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#0d6efd', wordBreak: 'break-all' }}>
        {value.length > 60 ? value.slice(0, 60) + '…' : value} ↗
      </a>
    );
  }

  if (typeof value === 'object') {
    return <pre style={styles.jsonBlock}>{JSON.stringify(value, null, 2)}</pre>;
  }

  return String(value);
}

export default function Admin({ tables = [], logoutAction }) {
  const [activeTable, setActiveTable] = useState(tables[0]?.name || '');
  const [editingRow, setEditingRow] = useState({ rowIndex: null, rowKey: null, values: {} });
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailsRow, setDetailsRow] = useState(null);
  const [query, setQuery] = useState('');
  const [checkboxFilters, setCheckboxFilters] = useState({});

  const active = useMemo(
    () => tables.find((table) => table.name === activeTable) || tables[0] || null,
    [activeTable, tables]
  );

  const totalRows = tables.reduce((sum, table) => sum + table.count, 0);

  const idColumn = active?.columns.includes('id')
    ? 'id'
    : active?.columns.includes('code')
      ? 'code'
      : null;
  const isReadOnly = Boolean(active?.readOnly);
  const visibleColumns = useMemo(() => getVisibleColumns(active), [active]);
  const filterGroups = useMemo(
    () => getFilterGroups(active, visibleColumns),
    [active, visibleColumns]
  );
  const filteredRows = useMemo(() => {
    if (!active) {
      return [];
    }

    return active.rows.filter((row) => rowMatchesFilters(row, query, checkboxFilters));
  }, [active, query, checkboxFilters]);
  const selectedFilterCount = Object.values(checkboxFilters).reduce(
    (sum, values) => sum + values.length,
    0
  );
  const hasActiveFilters = query.trim().length > 0 || selectedFilterCount > 0;
  const hasActions = Boolean(active);

  const resetFilters = () => {
    setQuery('');
    setCheckboxFilters({});
  };

  const handleFilterToggle = (column, value) => {
    setCheckboxFilters((current) => {
      const selected = current[column] || [];
      const nextSelected = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      const nextFilters = { ...current };

      if (nextSelected.length > 0) {
        nextFilters[column] = nextSelected;
      } else {
        delete nextFilters[column];
      }

      return nextFilters;
    });
  };

  const handleDelete = async (row) => {
    if (!idColumn || isReadOnly) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete this record?`);
    if (confirmDelete) {
      try {
        await adminDeleteRow(active.name, idColumn, row[idColumn]);
      } catch (err) {
        alert('Failed to delete row: ' + err.message);
      }
    }
  };

  const handleEditClick = (rowIndex, row) => {
    if (isReadOnly) return;
    setIsAdding(false);
    setEditingRow({
      rowIndex,
      rowKey: idColumn ? serializeFilterValue(row[idColumn]) : null,
      values: { ...row },
    });
  };

  const handleAddClick = () => {
    if (isReadOnly) return;
    setIsAdding(true);
    setEditingRow({ rowIndex: -1, rowKey: null, values: {} });
  };

  const handleCancelEdit = () => {
    setIsAdding(false);
    setEditingRow({ rowIndex: null, rowKey: null, values: {} });
  };

  const handleSaveEdit = async (originalRow) => {
    if (!idColumn) return;
    setIsSaving(true);
    try {
      if (isAdding) {
        const payload = {};
        for (const col of active.columns) {
          if (col !== idColumn && editingRow.values[col] !== undefined && editingRow.values[col] !== '') {
            payload[col] = editingRow.values[col];
          }
        }
        await adminInsertRow(active.name, payload);
      } else {
        const payload = {};
        for (const col of active.columns) {
          if (col !== idColumn && editingRow.values[col] !== originalRow[col]) {
            payload[col] = editingRow.values[col] === 'null' ? null : editingRow.values[col];
          }
        }

        if (Object.keys(payload).length > 0) {
          await adminUpdateRow(active.name, idColumn, originalRow[idColumn], payload);
        }
      }
      setIsAdding(false);
      setEditingRow({ rowIndex: null, rowKey: null, values: {} });
    } catch (err) {
      alert('Failed to save row: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (col, value) => {
    setEditingRow((prev) => ({
      ...prev,
      values: { ...prev.values, [col]: value }
    }));
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.brand}>Olympic Vision</div>
          <div style={styles.subtitle}>Database admin</div>
        </div>

        <nav style={styles.tableList} aria-label="Database tables">
          {tables.length === 0 ? (
            <div style={styles.emptyState}>No public tables found.</div>
          ) : (
            tables.map((table) => (
              <button
                key={table.name}
                type="button"
                onClick={() => {
                  setActiveTable(table.name);
                  handleCancelEdit();
                  resetFilters();
                }}
                style={activeTable === table.name ? styles.activeTableButton : styles.tableButton}
              >
                <span>{table.name}</span>
                <span style={styles.badge}>{table.count}</span>
              </button>
            ))
          )}
        </nav>

        <form action={logoutAction}>
          <button type="submit" style={styles.logoutButton}>
            Logout
          </button>
        </form>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.helperText}>
              Password access granted. Showing live database rows from Supabase.
            </p>
          </div>
          <div style={styles.summaryRow}>
            <div style={styles.summaryCard}>
              <strong>{tables.length}</strong>
              <span>Tables</span>
            </div>
            <div style={styles.summaryCard}>
              <strong>{totalRows}</strong>
              <span>Rows</span>
            </div>
          </div>
        </header>

        <section style={styles.content}>
          {active ? (
            <>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>{active.name}</h2>
                  <span style={styles.sectionMeta}>
                    {filteredRows.length} of {active.count} row{active.count === 1 ? '' : 's'}
                    {isReadOnly ? ' - read only details view' : ''}
                  </span>
                </div>
                {!isReadOnly && idColumn && !isAdding && editingRow.rowIndex === null && (
                  <button style={styles.addBtn} onClick={handleAddClick}>
                    + Add Record
                  </button>
                )}
              </div>

              <div style={styles.filterPanel}>
                <div style={styles.searchWrap}>
                  <i className="ti ti-search" aria-hidden="true" style={styles.searchIcon} />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, phone number, gender, status..."
                    aria-label="Search table rows"
                    style={styles.searchInput}
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      title="Clear search"
                      style={styles.iconButton}
                    >
                      <i className="ti ti-x" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                {filterGroups.length > 0 ? (
                  <div style={styles.checkboxGrid}>
                    {filterGroups.map(({ column, values }) => (
                      <fieldset key={column} style={styles.filterGroup}>
                        <legend style={styles.filterLegend}>{labelize(column)}</legend>
                        <div style={styles.filterOptions}>
                          {values.map((value) => {
                            const checked = (checkboxFilters[column] || []).includes(value);

                            return (
                              <label key={`${column}-${value}`} style={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleFilterToggle(column, value)}
                                  style={styles.checkboxInput}
                                />
                                <span style={styles.checkboxText}>{labelize(value)}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                ) : (
                  <div style={styles.filterHint}>No checkbox filters available for this table.</div>
                )}

                <div style={styles.filterFooter}>
                  <span>
                    Showing <strong>{filteredRows.length}</strong> result{filteredRows.length === 1 ? '' : 's'}
                    {selectedFilterCount > 0 ? ` with ${selectedFilterCount} selected filter${selectedFilterCount === 1 ? '' : 's'}` : ''}
                  </span>
                  {hasActiveFilters ? (
                    <button type="button" onClick={resetFilters} style={styles.clearFiltersBtn}>
                      Clear filters
                    </button>
                  ) : null}
                </div>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {visibleColumns.map((column) => (
                        <th key={column} style={styles.th}>
                          {labelize(column)}
                        </th>
                      ))}
                      {hasActions && <th style={styles.thAction}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render Add Row if isAdding is true */}
                    {isAdding && (
                      <tr style={styles.newRowHighlight}>
                        {visibleColumns.map((column) => (
                          <td key={column} style={styles.td}>
                            {column !== idColumn ? (
                              <input
                                style={styles.inlineInput}
                                placeholder={`Enter ${column}`}
                                value={editingRow.values[column] || ''}
                                onChange={(e) => handleInputChange(column, e.target.value)}
                              />
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Auto-generated</span>
                            )}
                          </td>
                        ))}
                        {hasActions && <td style={styles.tdAction}>
                          <div style={styles.actionGroup}>
                            <button
                              style={styles.saveBtn}
                              onClick={() => handleSaveEdit(null)}
                              disabled={isSaving}
                            >
                              {isSaving ? 'Saving' : 'Save'}
                            </button>
                            <button style={styles.cancelBtn} onClick={handleCancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </td>}
                      </tr>
                    )}

                    {active.rows.length === 0 && !isAdding ? (
                      <tr>
                        <td style={styles.td} colSpan={Math.max(visibleColumns.length + (hasActions ? 1 : 0), 1)}>
                          No rows found in this table.
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 && !isAdding ? (
                      <tr>
                        <td style={styles.td} colSpan={Math.max(visibleColumns.length + (hasActions ? 1 : 0), 1)}>
                          No rows match the current search or checkbox filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, rowIndex) => {
                        const rowKey = idColumn ? serializeFilterValue(row[idColumn]) : null;
                        const isEditing = !isAdding && (
                          rowKey
                            ? editingRow.rowKey === rowKey
                            : editingRow.rowIndex === rowIndex
                        );

                        return (
                          <tr key={`${active.name}-${rowIndex}`}>
                            {visibleColumns.map((column) => (
                              <td key={column} style={styles.td}>
                                {isEditing && column !== idColumn ? (
                                  <input
                                    style={styles.inlineInput}
                                    value={editingRow.values[column] === null ? '' : editingRow.values[column]}
                                    onChange={(e) => handleInputChange(column, e.target.value)}
                                  />
                                ) : (
                                  formatValue(row[column], column)
                                )}
                              </td>
                            ))}
                            {hasActions && (
                              <td style={styles.tdAction}>
                                {isEditing ? (
                                  <div style={styles.actionGroup}>
                                    <button
                                      style={styles.saveBtn}
                                      onClick={() => handleSaveEdit(row)}
                                      disabled={isSaving}
                                    >
                                      {isSaving ? 'Saving' : 'Save'}
                                    </button>
                                    <button style={styles.cancelBtn} onClick={handleCancelEdit}>
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div style={styles.actionGroup}>
                                    <button
                                      style={styles.detailsBtn}
                                      onClick={() => setDetailsRow(row)}
                                      disabled={isAdding || editingRow.rowIndex !== null}
                                    >
                                      Details
                                    </button>
                                    {!isReadOnly && idColumn && (
                                      <>
                                        {/* Confirm Participation button */}
                                        {(row.registration_status === 'pending' || row.registration_status === 'payment_pending') && (
                                          <button
                                            style={styles.confirmBtn}
                                            disabled={isAdding || editingRow.rowIndex !== null}
                                            onClick={async () => {
                                              if (!window.confirm(`Confirm participation for ${row.full_name || row.sender_name || 'this participant'}?`)) return;
                                              try {
                                                await adminConfirmParticipation(row.id || row.registration_id);
                                              } catch (err) {
                                                alert('Failed to confirm: ' + err.message);
                                              }
                                            }}
                                          >
                                            ✓ Confirm
                                          </button>
                                        )}
                                        <button
                                          style={styles.editBtn}
                                          onClick={() => handleEditClick(rowIndex, row)}
                                          disabled={isAdding || editingRow.rowIndex !== null}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          style={styles.deleteBtn}
                                          onClick={() => handleDelete(row)}
                                          disabled={isAdding || editingRow.rowIndex !== null}
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>Connect a table to see data here.</div>
          )}
        </section>
      </main>

      {detailsRow ? (
        <div style={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Record details">
          <div style={styles.modalPanel}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Transaction Details</h2>
                <p style={styles.modalSubtitle}>{active?.name ? labelize(active.name) : 'Selected record'}</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setDetailsRow(null)} aria-label="Close details">
                Close
              </button>
            </div>

            <div style={styles.detailGrid}>
              {Object.entries(detailsRow).map(([key, value]) => (
                <div key={key} style={styles.detailItem}>
                  <div style={styles.detailLabel}>{labelize(key)}</div>
                  <div style={styles.detailValue}>{formatDetailValue(value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    background: '#f4f7fb',
    color: '#0f172a',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    padding: 24,
    height: '100vh',
    minHeight: '100vh',
    position: 'sticky',
    top: 0,
    borderRight: '1px solid #dbe3ee',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: 'inset -1px 0 0 0 rgba(0,0,0,0.03)',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  sidebarHeader: {
    paddingBottom: 16,
    borderBottom: '2px solid rgba(15, 23, 42, 0.08)',
  },
  brand: {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 220px)',
    paddingRight: 4,
  },
  tableButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  activeTableButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    border: '2px solid #0f172a',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 600,
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)',
    transform: 'translateX(2px)',
    transition: 'all 0.2s ease',
  },
  badge: {
    minWidth: 32,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    background: 'rgba(15, 23, 42, 0.12)',
    color: 'inherit',
    textAlign: 'center',
    fontWeight: 700,
    transition: 'all 0.2s ease',
  },
  logoutButton: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #fed7aa',
    background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
    color: '#92400e',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '14px',
    transition: 'all 0.2s ease',
    marginTop: 'auto',
  },
  main: { minWidth: 0, display: 'flex', flexDirection: 'column' },
  header: {
    padding: '24px 28px',
    borderBottom: '1px solid #dbe3ee',
    background: '#fff',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: { margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' },
  helperText: { margin: '8px 0 0', color: '#64748b', fontSize: 15 },
  summaryRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  summaryCard: {
    minWidth: 110,
    padding: '12px 14px',
    border: '1px solid #dbe3ee',
    borderRadius: 8,
    background: '#f8fafc',
    display: 'grid',
    gap: 4,
  },
  content: { padding: 24, minWidth: 0 },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: { margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' },
  sectionMeta: { color: '#64748b', fontSize: 14, fontWeight: 500 },
  filterPanel: {
    display: 'grid',
    gap: 14,
    padding: 14,
    marginBottom: 16,
    border: '1px solid #dbe3ee',
    borderRadius: 10,
    background: '#fff',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.04)',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: 44,
  },
  searchIcon: {
    position: 'absolute',
    left: 13,
    color: '#64748b',
    fontSize: 20,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    minHeight: 44,
    padding: '10px 46px 10px 42px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: 15,
    outline: 'none',
  },
  iconButton: {
    position: 'absolute',
    right: 8,
    width: 30,
    height: 30,
    display: 'inline-grid',
    placeItems: 'center',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    background: '#fff',
    color: '#475569',
    cursor: 'pointer',
    fontSize: 18,
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 12,
  },
  filterGroup: {
    minWidth: 0,
    margin: 0,
    padding: 10,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    background: '#f8fafc',
  },
  filterLegend: {
    padding: '0 4px',
    color: '#334155',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  filterOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    padding: '6px 8px',
    border: '1px solid #dbe3ee',
    borderRadius: 6,
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1.2,
  },
  checkboxInput: {
    width: 15,
    height: 15,
    accentColor: '#0f172a',
    flex: '0 0 auto',
  },
  checkboxText: {
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  filterHint: {
    padding: '10px 12px',
    borderRadius: 8,
    background: '#f8fafc',
    color: '#64748b',
    fontSize: 13,
  },
  filterFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    color: '#475569',
    fontSize: 13,
    flexWrap: 'wrap',
  },
  clearFiltersBtn: {
    padding: '7px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
  },
  tableWrap: {
    overflow: 'auto',
    border: '1px solid #dbe3ee',
    borderRadius: 10,
    background: '#fff',
  },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 720 },
  th: {
    position: 'sticky',
    top: 0,
    background: '#e2e8f0',
    color: '#0f172a',
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: 13,
    borderBottom: '1px solid #cbd5e1',
    whiteSpace: 'nowrap',
  },
  thAction: {
    position: 'sticky',
    top: 0,
    background: '#e2e8f0',
    color: '#0f172a',
    textAlign: 'right',
    padding: '12px 14px',
    fontSize: 13,
    borderBottom: '1px solid #cbd5e1',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    fontSize: 14,
  },
  tdAction: {
    padding: '12px 14px',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'middle',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: 20,
    borderRadius: 10,
    border: '1px dashed #cbd5e1',
    color: '#64748b',
    background: '#fff',
  },
  inlineInput: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #cbd5e1',
    fontSize: 14,
  },
  actionGroup: {
    display: 'inline-flex',
    gap: 8,
  },
  addBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 6,
    background: '#0f172a',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  editBtn: {
    padding: '4px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    background: '#f8fafc',
    cursor: 'pointer',
    fontSize: 13,
  },
  deleteBtn: {
    padding: '4px 10px',
    border: '1px solid #fecaca',
    borderRadius: 4,
    background: '#fff1f2',
    color: '#be123c',
    cursor: 'pointer',
    fontSize: 13,
  },
  detailsBtn: {
    padding: '4px 10px',
    border: '1px solid #bae6fd',
    borderRadius: 4,
    background: '#f0f9ff',
    color: '#0369a1',
    cursor: 'pointer',
    fontSize: 13,
  },
  saveBtn: {
    padding: '4px 10px',
    border: '1px solid #86efac',
    borderRadius: 4,
    background: '#f0fdf4',
    color: '#166534',
    cursor: 'pointer',
    fontSize: 13,
  },
  cancelBtn: {
    padding: '4px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  newRowHighlight: {
    backgroundColor: '#f8fafc',
  },
  mutedValue: {
    color: '#64748b',
    fontSize: 13,
  },
  monoValue: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#475569',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    background: 'rgba(15, 23, 42, 0.55)',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  },
  modalPanel: {
    width: 'min(980px, 100%)',
    maxHeight: '88vh',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.24)',
    border: '1px solid #dbe3ee',
  },
  modalHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    padding: 18,
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
  },
  modalTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.3px',
  },
  modalSubtitle: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 500,
  },
  closeBtn: {
    padding: '7px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
    padding: 18,
  },
  detailItem: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 12,
    background: '#f8fafc',
    minWidth: 0,
  },
  detailLabel: {
    marginBottom: 6,
    color: '#64748b',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  detailValue: {
    color: '#0f172a',
    fontSize: 14,
    overflowWrap: 'anywhere',
  },
  jsonBlock: {
    maxHeight: 320,
    overflow: 'auto',
    margin: 0,
    padding: 10,
    borderRadius: 6,
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  confirmBtn: {
    padding: '4px 10px',
    border: 'none',
    borderRadius: 6,
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.2px',
    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
    transition: 'opacity 0.2s',
  },
};
