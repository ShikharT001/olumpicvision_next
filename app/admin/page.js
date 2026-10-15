import { cookies } from 'next/headers';
import Admin from '@/components/admin/Admin';
import { getDatabaseSnapshot } from '@/lib/admin-db';
import { authenticateAdmin, logoutAdmin } from './actions';

const ADMIN_COOKIE = 'olumpicvision_admin';

function LoginForm({ errorMessage }) {
  return (
    <main style={styles.loginShell}>
      <form action={authenticateAdmin} style={styles.loginCard}>
        <h1 style={styles.loginTitle}>Admin Access</h1>
        <p style={styles.loginText}>Enter the password to open the database view.</p>
        <label style={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          style={styles.input}
        />
        {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}
        <button type="submit" style={styles.button}>
          Continue
        </button>
      </form>
    </main>
  );
}

export default async function Page({ searchParams }) {
  const cookieStore = await cookies();
  const resolvedSearchParams = await searchParams;
  const isAuthed = cookieStore.get(ADMIN_COOKIE)?.value === 'true';
  const errorMessage = resolvedSearchParams?.error === 'invalid' ? 'Incorrect password.' : '';

  if (!isAuthed) {
    return <LoginForm errorMessage={errorMessage} />;
  }

  const tables = await getDatabaseSnapshot();

  return <Admin tables={tables} logoutAction={logoutAdmin} />;
}

const styles = {
  loginShell: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background: '#f4f7fb',
    fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    border: '1px solid #dbe3ee',
    borderRadius: 12,
    padding: 24,
    display: 'grid',
    gap: 12,
    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
  },
  loginTitle: { margin: 0, fontSize: 28 },
  loginText: { margin: 0, color: '#64748b' },
  label: { fontSize: 14, fontWeight: 700 },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 16,
  },
  error: {
    margin: 0,
    color: '#b91c1c',
    fontSize: 14,
  },
  button: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: 8,
    background: '#0f172a',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
