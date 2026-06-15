'use client';

import { useMemo, useState } from 'react';
import { adminDeleteRow, adminUpdateRow, adminInsertRow } from '@/app/admin/actions';

function formatValue(value, column) {
  if (value === null || value === undefined) {
    return <span style={{ color: '#94a3b8' }}>-</span>;
  }

  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  const strVal = String(value);
  if ((column === 'id' || column === 'user_id' || column === 'registration_id') && strVal.length > 20) {
    return <span title={strVal} style={{ fontFamily: 'monospace', fontSize: 13, color: '#475569' }}>{strVal.slice(0, 8) + '...'}</span>;
  }

  return strVal;
}

export default function Admin({ tables = [], logoutAction }) {
  const [activeTable, setActiveTable] = useState(tables[0]?.name || '');
  const [editingRow, setEditingRow] = useState({ rowIndex: null, values: {} });
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleDelete = async (row) => {
    if (!idColumn) return;
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
    setIsAdding(false);
    setEditingRow({ rowIndex, values: { ...row } });
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingRow({ rowIndex: -1, values: {} });
  };

  const handleCancelEdit = () => {
    setIsAdding(false);
    setEditingRow({ rowIndex: null, values: {} });
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
      setEditingRow({ rowIndex: null, values: {} });
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
        <div>
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
                    {active.count} row{active.count === 1 ? '' : 's'}
                  </span>
                </div>
                {idColumn && !isAdding && editingRow.rowIndex === null && (
                  <button style={styles.addBtn} onClick={handleAddClick}>
                    + Add Record
                  </button>
                )}
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {active.columns.map((column) => (
                        <th key={column} style={styles.th}>
                          {column}
                        </th>
                      ))}
                      {idColumn && <th style={styles.thAction}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render Add Row if isAdding is true */}
                    {isAdding && (
                      <tr style={styles.newRowHighlight}>
                        {active.columns.map((column) => (
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
                      </tr>
                    )}

                    {active.rows.length === 0 && !isAdding ? (
                      <tr>
                        <td style={styles.td} colSpan={Math.max(active.columns.length + (idColumn ? 1 : 0), 1)}>
                          No rows found in this table.
                        </td>
                      </tr>
                    ) : (
                      active.rows.map((row, rowIndex) => {
                        const isEditing = editingRow.rowIndex === rowIndex && !isAdding;

                        return (
                          <tr key={`${active.name}-${rowIndex}`}>
                            {active.columns.map((column) => (
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
                            {idColumn && (
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
    fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
    borderRight: '1px solid #dbe3ee',
    background: '#ffffff',
  },
  brand: { fontSize: 18, fontWeight: 800 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  tableList: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' },
  tableButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    border: '1px solid #dbe3ee',
    borderRadius: 8,
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
    textAlign: 'left',
  },
  activeTableButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    border: '1px solid #0f172a',
    borderRadius: 8,
    background: '#0f172a',
    color: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
  },
  badge: {
    minWidth: 28,
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    background: 'rgba(15, 23, 42, 0.08)',
    color: 'inherit',
    textAlign: 'center',
  },
  logoutButton: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #fecaca',
    background: '#fff1f2',
    color: '#be123c',
    cursor: 'pointer',
    fontWeight: 700,
  },
  main: { minWidth: 0, display: 'flex', flexDirection: 'column' },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #dbe3ee',
    background: '#fff',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: { margin: 0, fontSize: 28 },
  helperText: { margin: '8px 0 0', color: '#64748b' },
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
  sectionTitle: { margin: 0, fontSize: 20 },
  sectionMeta: { color: '#64748b' },
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
  }
};
