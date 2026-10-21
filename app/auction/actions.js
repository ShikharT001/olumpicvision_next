'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUCTION_COOKIE = 'pdvl_auction_access';
const AUCTION_ROLE_COOKIE = 'pdvl_auction_role';
const AUCTION_TEAM_ID_COOKIE = 'pdvl_auction_team_id';
const AUCTION_TEAM_NAME_COOKIE = 'pdvl_auction_team_name';
const AUCTION_TEAM_CODE_COOKIE = 'pdvl_auction_team_code';
const AUCTION_TEAM_COLOR_COOKIE = 'pdvl_auction_team_color';

const AUCTION_ADMIN_PASSWORD = process.env.AUCTION_ADMIN_PASSWORD || 'pdvladmin2026';
const AUCTION_TEAM_PASSWORD = process.env.AUCTION_TEAM_PASSWORD || 'pdvl2026';

export async function authenticateAuction(formData) {
  const password = String(formData.get('password') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/auction').trim();
  const loginMode = String(formData.get('loginMode') || 'admin').trim(); // 'admin' | 'team'

  // Team selection fields (when logging in under team mode)
  const teamId = String(formData.get('teamId') || '').trim();
  const teamName = String(formData.get('teamName') || '').trim();
  const teamCode = String(formData.get('teamCode') || '').trim();
  const teamColor = String(formData.get('teamColor') || '').trim();

  const adminPasscodes = [
    AUCTION_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    'olumpicvision',
    'admin',
    'admin123',
    '7890',
  ].filter(Boolean).map((p) => String(p).toLowerCase());

  const teamPasscodes = [
    AUCTION_TEAM_PASSWORD,
    'pdvl2026',
    'team',
    'team123',
    'franchise',
    'player',
    '1234',
  ].filter(Boolean).map((p) => String(p).toLowerCase());

  const passLower = password.toLowerCase();

  let role = null;
  const isMatchAdmin = adminPasscodes.includes(passLower);
  const isMatchTeam =
    teamPasscodes.includes(passLower) ||
    (teamCode && passLower === teamCode.toLowerCase()) ||
    (teamName && passLower === teamName.toLowerCase());

  if (loginMode === 'team') {
    // If logging in via Team tab, accept team passcodes or admin passcodes (for testing)
    if (isMatchTeam || isMatchAdmin) {
      role = 'team';
    } else {
      const errRedirect = `${returnTo.split('?')[0]}?error=invalid&role=team`;
      redirect(errRedirect);
    }
  } else {
    // Admin mode requires admin passcode
    if (isMatchAdmin) {
      role = 'admin';
    } else {
      const errRedirect = `${returnTo.split('?')[0]}?error=invalid&role=admin`;
      redirect(errRedirect);
    }
  }

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  };

  cookieStore.set(AUCTION_COOKIE, 'true', cookieOpts);
  cookieStore.set(AUCTION_ROLE_COOKIE, role, cookieOpts);

  if (role === 'team' && teamId) {
    cookieStore.set(AUCTION_TEAM_ID_COOKIE, teamId, cookieOpts);
    cookieStore.set(AUCTION_TEAM_NAME_COOKIE, teamName || '', cookieOpts);
    cookieStore.set(AUCTION_TEAM_CODE_COOKIE, teamCode || '', cookieOpts);
    cookieStore.set(AUCTION_TEAM_COLOR_COOKIE, teamColor || '', cookieOpts);
  } else {
    // If admin or general team, clear specific team credentials
    cookieStore.delete(AUCTION_TEAM_ID_COOKIE);
    cookieStore.delete(AUCTION_TEAM_NAME_COOKIE);
    cookieStore.delete(AUCTION_TEAM_CODE_COOKIE);
    cookieStore.delete(AUCTION_TEAM_COLOR_COOKIE);
  }

  // Determine post-login redirect path
  let target = returnTo || '/auction';

  if (role === 'team') {
    // Prevent team role from landing on admin-only consoles
    if (target.includes('/manage-teams') || target.includes('/admin')) {
      target = target.replace(/\/manage-teams|\/admin/, '/teams');
    }
    // If logging in from general login, route to the tournament selection hub
    if (target.startsWith('/auction/login') || target === '/auction') {
      target = '/auction';
    }
  } else if (role === 'admin') {
    if (target.startsWith('/auction/login')) {
      target = '/auction';
    }
  }

  redirect(target);
}

export async function logoutAuction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUCTION_COOKIE);
  cookieStore.delete(AUCTION_ROLE_COOKIE);
  cookieStore.delete(AUCTION_TEAM_ID_COOKIE);
  cookieStore.delete(AUCTION_TEAM_NAME_COOKIE);
  cookieStore.delete(AUCTION_TEAM_CODE_COOKIE);
  cookieStore.delete(AUCTION_TEAM_COLOR_COOKIE);
  redirect('/auction');
}

export async function getAuctionSession() {
  const cookieStore = await cookies();
  const hasAuctionCookie = cookieStore.get(AUCTION_COOKIE)?.value === 'true';
  const hasAdminCookie = cookieStore.get('olumpicvision_admin')?.value === 'true';
  const role = hasAdminCookie
    ? 'admin'
    : (cookieStore.get(AUCTION_ROLE_COOKIE)?.value || (hasAuctionCookie ? 'team' : null));

  const teamId = cookieStore.get(AUCTION_TEAM_ID_COOKIE)?.value || null;
  const teamName = cookieStore.get(AUCTION_TEAM_NAME_COOKIE)?.value || null;
  const teamCode = cookieStore.get(AUCTION_TEAM_CODE_COOKIE)?.value || null;
  const teamColor = cookieStore.get(AUCTION_TEAM_COLOR_COOKIE)?.value || null;

  return {
    isAuthenticated: Boolean(hasAuctionCookie || hasAdminCookie),
    role,
    isAdmin: role === 'admin',
    isTeam: role === 'team',
    team: teamId ? { id: teamId, name: teamName, code: teamCode, color: teamColor } : null,
  };
}

export async function getAuctionRole() {
  const session = await getAuctionSession();
  return session.role;
}

export async function getAuctionTeam() {
  const session = await getAuctionSession();
  return session.team;
}

export async function isAuctionAdmin() {
  const session = await getAuctionSession();
  return session.isAdmin;
}

export async function isAuctionAuthenticated() {
  const session = await getAuctionSession();
  return session.isAuthenticated;
}
