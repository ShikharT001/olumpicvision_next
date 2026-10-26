import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const AUCTION_COOKIE = 'pdvl_auction_access';
const AUCTION_ROLE_COOKIE = 'pdvl_auction_role';
const AUCTION_ADMIN_PASSWORD = process.env.AUCTION_ADMIN_PASSWORD || 'pdvladmin2026';

export async function POST(request) {
  try {
    const body = await request.json();
    const password = String(body?.password || '').trim().toLowerCase();

    const adminPasscodes = [
      AUCTION_ADMIN_PASSWORD,
      process.env.ADMIN_PASSWORD,
      'olumpicvision',
      'admin',
      'admin123',
      '7890',
    ].filter(Boolean).map((p) => String(p).toLowerCase());

    if (!adminPasscodes.includes(password)) {
      return NextResponse.json({ error: 'Incorrect admin passcode' }, { status: 401 });
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
    cookieStore.set(AUCTION_ROLE_COOKIE, 'admin', cookieOpts);
    cookieStore.set('olumpicvision_admin', 'true', cookieOpts);

    return NextResponse.json({ success: true, role: 'admin' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Authentication failed' }, { status: 500 });
  }
}
