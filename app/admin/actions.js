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

import { revalidatePath } from 'next/cache';
import { deleteRow, updateRow, insertRow, confirmParticipation, rejectParticipation } from '@/lib/admin-db';

async function checkAuth() {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE)?.value !== 'true') {
    throw new Error('Unauthorized');
  }
}

export async function adminDeleteRow(tableName, idColumn, idValue) {
  await checkAuth();
  await deleteRow(tableName, idColumn, idValue);
  revalidatePath('/admin');
}

export async function adminUpdateRow(tableName, idColumn, idValue, payload) {
  await checkAuth();
  await updateRow(tableName, idColumn, idValue, payload);
  revalidatePath('/admin');
}

export async function adminInsertRow(tableName, payload) {
  await checkAuth();
  await insertRow(tableName, payload);
  revalidatePath('/admin');
}

export async function adminConfirmParticipation(registrationId) {
  await checkAuth();
  await confirmParticipation(registrationId);
  revalidatePath('/admin');
}

export async function adminRejectParticipation(registrationId, reason) {
  await checkAuth();
  await rejectParticipation(registrationId, reason);
  revalidatePath('/admin');
}
