'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ADMIN_COOKIE = 'olumpicvision_admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'olumpicvision';

export async function authenticateAdmin(formData) {
  const password = String(formData.get('password') || '');

  if (password !== ADMIN_PASSWORD) {
    redirect('/admin?error=invalid');
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, 'true', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  redirect('/admin');
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect('/admin');
}
