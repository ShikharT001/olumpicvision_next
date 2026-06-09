import React, { useState, useEffect } from 'react';

// Simple Admin Panel component
export default function Admin() {
  const [active, setActive] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // simulate loading users
    setLoading(true);
    const t = setTimeout(() => {
      setUsers([
        { id: 1, name: 'Alice', role: 'admin', email: 'alice@example.com' },
        { id: 2, name: 'Bob', role: 'editor', email: 'bob@example.com' },
        { id: 3, name: 'Carlos', role: 'viewer', email: 'carlos@example.com' },
      ]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const renderSidebar = () => (
    <nav style={styles.sidebar}>
      <h2 style={{ margin: 0, marginBottom: 16 }}>Admin</h2>
      <button style={btn(active === 'dashboard')} onClick={() => setActive('dashboard')}>Dashboard</button>
      <button style={btn(active === 'users')} onClick={() => setActive('users')}>Users</button>
      <button style={btn(active === 'settings')} onClick={() => setActive('settings')}>Settings</button>
      <div style={{ marginTop: 'auto', fontSize: 12, color: '#666' }}>v1.0 • Olumpic</div>
    </nav>
  );

  const renderDashboard = () => (
    <div>
      <h3>Overview</h3>
      <div style={styles.cards}>
        <div style={styles.card}><strong>{users.length}</strong><div>Users</div></div>
        <div style={styles.card}><strong>—</strong><div>Active Sessions</div></div>
        <div style={styles.card}><strong>—</strong><div>Errors</div></div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <h3>Users</h3>
      {loading ? <div>Loading...</div> : (
        <table style={styles.table}>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderSettings = () => (
    <div>
      <h3>Settings</h3>
      <p>Basic site settings placeholder.</p>
      <label style={{ display: 'block', marginTop: 8 }}>Site title</label>
      <input style={styles.input} defaultValue="Olumpic Vision" />
    </div>
  );

  return (
    <div style={styles.container}>
      {renderSidebar()}
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={{ margin: 0 }}>Admin Panel</h1>
        </header>
        <section style={styles.content}>
          {active === 'dashboard' && renderDashboard()}
          {active === 'users' && renderUsers()}
          {active === 'settings' && renderSettings()}
        </section>
      </main>
    </div>
  );
}

const btn = (active) => ({
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  marginBottom: 8,
  textAlign: 'left',
  background: active ? '#1976d2' : 'transparent',
  color: active ? '#fff' : '#111',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer'
});

const styles = {
  container: { display: 'flex', minHeight: '70vh', fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', color: '#111' },
  sidebar: { width: 200, padding: 20, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { padding: '20px 24px', borderBottom: '1px solid #eee' },
  content: { padding: 24, flex: 1 },
  cards: { display: 'flex', gap: 12, marginTop: 12 },
  card: { padding: 12, border: '1px solid #eee', borderRadius: 6, minWidth: 140 },
  table: { width: '100%', borderCollapse: 'collapse' },
  input: { padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 320 }
};
