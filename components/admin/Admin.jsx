'use client';

import { useMemo, useState } from 'react';

function formatValue(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export default function Admin({ tables = [], logoutAction }) {
  const [activeTable, setActiveTable] = useState(tables[0]?.name || '');

  const active = useMemo(
    () => tables.find((table) => table.name === activeTable) || tables[0] || null,
    [activeTable, tables]
  );

  const totalRows = tables.reduce((sum, table) => sum + table.count, 0);

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
                onClick={() => setActiveTable(table.name)}
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
                <h2 style={styles.sectionTitle}>{active.name}</h2>
                <span style={styles.sectionMeta}>
                  {active.count} row{active.count === 1 ? '' : 's'}
                </span>
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
                    </tr>
                  </thead>
                  <tbody>
                    {active.rows.length === 0 ? (
                      <tr>
                        <td style={styles.td} colSpan={Math.max(active.columns.length, 1)}>
                          No rows found in this table.
                        </td>
                      </tr>
                    ) : (
                      active.rows.map((row, rowIndex) => (
                        <tr key={`${active.name}-${rowIndex}`}>
                          {active.columns.map((column) => (
                            <td key={column} style={styles.td}>
                              {formatValue(row[column])}
                            </td>
                          ))}
                        </tr>
                      ))
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
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'top',
    wordBreak: 'break-word',
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    borderRadius: 10,
    border: '1px dashed #cbd5e1',
    color: '#64748b',
    background: '#fff',
  },
};
