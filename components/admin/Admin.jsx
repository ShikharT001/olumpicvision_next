'use client';

import { useMemo, useState } from 'react';
import { adminDeleteRow, adminUpdateRow, adminInsertRow, adminConfirmParticipation, adminRejectParticipation } from '@/app/admin/actions';

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
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExportReport = async () => {
    if (!filteredRows || filteredRows.length === 0) {
      alert('No data available to export.');
      return;
    }

    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');

      const dataToExport = filteredRows.map((row) => {
        const exportRow = {};
        visibleColumns.forEach((col) => {
          let value = row[col];

          if (value === null || value === undefined) {
            value = '';
          } else if (col === 'amount_paise' || col === 'fee_amount_paise') {
            const rupees = Number(value) / 100;
            value = rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2);
          } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            value = new Date(value).toLocaleString();
          } else if (typeof value === 'object') {
            value = JSON.stringify(value);
          }

          exportRow[labelize(col)] = value;
        });
        return exportRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `${active.name}_Report_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      alert('Failed to generate Excel report: ' + err.message);
    } finally {
      setIsExporting(false);
    }
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
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    style={styles.exportBtn}
                    onClick={handleExportReport}
                    disabled={isExporting || filteredRows.length === 0}
                  >
                    {isExporting ? 'Exporting...' : '📊 Export Excel'}
                  </button>
                  {!isReadOnly && idColumn && !isAdding && editingRow.rowIndex === null && (
                    <button style={styles.addBtn} onClick={handleAddClick}>
                      + Add Record
                    </button>
                  )}
                </div>
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
                        {hasActions && (
                          <td style={styles.tdAction}>
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
                          </td>
                        )}
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
                                        {(row.registration_status === 'pending' || row.registration_status === 'payment_pending') && (
                                          <>
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
                                            <button
                                              style={styles.rejectBtn}
                                              disabled={isAdding || editingRow.rowIndex !== null}
                                              onClick={async () => {
                                                const name = row.full_name || row.sender_name || 'this participant';
                                                if (!window.confirm(`Reject participation for ${name}? They will receive a rejection email.`)) return;
                                                const reason = window.prompt('Optional: Enter a reason for rejection (leave blank to skip):', '') ?? '';
                                                try {
                                                  await adminRejectParticipation(row.id || row.registration_id, reason.trim() || null);
                                                } catch (err) {
                                                  alert('Failed to reject: ' + err.message);
                                                }
                                              }}
                                            >
                                              ✕ Reject
                                            </button>
                                          </>
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
                  <div style={styles.detailValue}>{formatDetailValue(value, key)}</div>
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
  addBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  exportBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #16a34a',
    background: '#f0fdf4',
    color: '#15803d',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
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
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12,
  },
  filterGroup: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '8px 12px',
    margin: 0,
    background: '#fafafa',
  },
  filterLegend: {
    fontSize: 12,
    fontWeight: 700,
    color: '#475569',
    padding: '0 4px',
  },
  filterOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 6,
    maxHeight: 120,
    overflowY: 'auto',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#1e293b',
    cursor: 'pointer',
  },
  checkboxInput: {
    cursor: 'pointer',
  },
  checkboxText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  filterHint: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  filterFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    color: '#64748b',
    borderTop: '1px solid #f1f5f9',
    paddingTop: 8,
  },
  clearFiltersBtn: {
    border: 'none',
    background: 'none',
    color: '#dc2626',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
  },
  tableWrap: {
    border: '1px solid #dbe3ee',
    borderRadius: 10,
    background: '#fff',
    overflowX: 'auto',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.04)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: 14,
  },
  th: {
    padding: '12px 16px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  thAction: {
    padding: '12px 16px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontWeight: 700,
    textAlign: 'right',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    color: '#1e293b',
    whiteSpace: 'nowrap',
  },
  tdAction: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'right',
  },
  actionGroup: {
    display: 'inline-flex',
    gap: 6,
    justifyContent: 'flex-end',
  },
  detailsBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#16a34a',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#dc2626',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  editBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #93c5fd',
    background: '#eff6ff',
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #fca5a5',
    background: '#fef2f2',
    color: '#991b1b',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#475569',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  inlineInput: {
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #2563eb',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  newRowHighlight: {
    background: '#f0fdf4',
  },
  emptyState: {
    padding: 24,
    color: '#64748b',
    textAlign: 'center',
  },
  mutedValue: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
  },
  monoValue: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    zIndex: 50,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '85vh',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
  },
  modalSubtitle: {
    margin: '2px 0 0',
    fontSize: 13,
    color: '#64748b',
  },
  closeBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  detailGrid: {
    padding: 24,
    overflowY: 'auto',
    display: 'grid',
    gap: 16,
  },
  detailItem: {
    display: 'grid',
    gap: 4,
    paddingBottom: 12,
    borderBottom: '1px solid #f1f5f9',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
    wordBreak: 'break-word',
  },
  jsonBlock: {
    margin: 0,
    padding: 12,
    background: '#0f172a',
    color: '#f8fafc',
    borderRadius: 6,
    fontSize: 12,
    overflowX: 'auto',
  },
};