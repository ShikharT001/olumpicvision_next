'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUCTION_COOKIE = 'pdvl_auction_access';
const AUCTION_ROLE_COOKIE = 'pdvl_auction_role';

const AUCTION_ADMIN_PASSWORD = process.env.AUCTION_ADMIN_PASSWORD || 'pdvladmin2026';
const AUCTION_TEAM_PASSWORD = process.env.AUCTION_TEAM_PASSWORD || 'pdvl2026';

export async function authenticateAuction(formData) {
  const password = String(formData.get('password') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/auction').trim();

  let role = null;
  if (password === AUCTION_ADMIN_PASSWORD || (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD)) {
    role = 'admin';
  } else if (password === AUCTION_TEAM_PASSWORD) {
    role = 'team';
  } else {
    redirect(`${returnTo.split('?')[0]}?error=invalid`);
  }

  const cookieStore = await cookies();
  cookieStore.set(AUCTION_COOKIE, 'true', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  cookieStore.set(AUCTION_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  // If a team member tried to login while heading to /auction/admin or /auction/manage-teams, redirect to /auction/teams
  let target = returnTo.split('?')[0];
  if (role === 'team' && (target.includes('/admin') || target.includes('/manage-teams'))) {
    target = '/auction/teams';
  }

  redirect(target);
}

export async function logoutAuction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUCTION_COOKIE);
  cookieStore.delete(AUCTION_ROLE_COOKIE);
  redirect('/auction');
}

export async function getAuctionRole() {
  const cookieStore = await cookies();
  const hasAdminCookie = cookieStore.get('olumpicvision_admin')?.value === 'true';
  if (hasAdminCookie) return 'admin';
  const role = cookieStore.get(AUCTION_ROLE_COOKIE)?.value;
  if (role) return role;
  // If only legacy access cookie exists, default to 'team' (view-only) for safety
  return cookieStore.get(AUCTION_COOKIE)?.value === 'true' ? 'team' : null;
}

export async function isAuctionAdmin() {
  const role = await getAuctionRole();
  return role === 'admin';
}

export async function isAuctionAuthenticated() {
  const cookieStore = await cookies();
  const hasAuctionCookie = cookieStore.get(AUCTION_COOKIE)?.value === 'true';
  const hasAdminCookie = cookieStore.get('olumpicvision_admin')?.value === 'true';
  return hasAuctionCookie || hasAdminCookie;
}
