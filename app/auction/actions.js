'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUCTION_COOKIE = 'pdvl_auction_access';
const AUCTION_PASSWORD = process.env.AUCTION_PASSWORD || process.env.ADMIN_PASSWORD || 'pdvl2026';

export async function authenticateAuction(formData) {
  const password = String(formData.get('password') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/auction').trim();

  if (password !== AUCTION_PASSWORD) {
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

  redirect(returnTo.split('?')[0]);
}

export async function logoutAuction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUCTION_COOKIE);
  redirect('/auction');
}

export async function isAuctionAuthenticated() {
  const cookieStore = await cookies();
  const hasAuctionCookie = cookieStore.get(AUCTION_COOKIE)?.value === 'true';
  const hasAdminCookie = cookieStore.get('olumpicvision_admin')?.value === 'true';
  return hasAuctionCookie || hasAdminCookie;
}
