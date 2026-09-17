import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/postgres';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(request), 'pdvl-register', 5, 10 * 60_000);
  if (!allowed) return NextResponse.json({ error: `Too many attempts. Please try again in ${retryAfter} seconds.` }, { status: 429 });
  try {
    const data = await request.json();
    const required = ['fullName', 'dateOfBirth', 'gender', 'mobileNo', 'email', 'address', 'photoUrl', 'teamName', 'playingPosition', 'jerseySize', 'emergencyPhone', 'typedSignature'];
    if (required.some((key) => !String(data[key] || '').trim()) || !data.undertakingAccepted || !data.medicalConsent) return NextResponse.json({ error: 'Please complete all required fields and accept the declarations.' }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(data.mobileNo) || !/^[6-9]\d{9}$/.test(data.emergencyPhone)) return NextResponse.json({ error: 'Please enter valid 10-digit mobile numbers.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    const client = await getDbClient();
    try {
      const result = await client.query(`INSERT INTO volleyball_registrations (full_name, date_of_birth, gender, mobile_no, email, address, photo_url, district, team_name, playing_position, jersey_size, emergency_contact_phone, typed_signature, undertaking_accepted, medical_consent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,true) RETURNING id`, [data.fullName.trim(), data.dateOfBirth, data.gender, data.mobileNo, data.email.trim().toLowerCase(), data.address.trim(), data.photoUrl, data.district?.trim() || 'Palghar', data.teamName.trim(), data.playingPosition, data.jerseySize, data.emergencyPhone, data.typedSignature.trim()]);
      return NextResponse.json({ success: true, id: result.rows[0].id });
    } finally { client.release(); }
  } catch (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A PDVL registration already exists with this mobile number.' }, { status: 409 });
    console.error('PDVL registration error:', error);
    return NextResponse.json({ error: 'Unable to submit your registration. Please try again.' }, { status: 500 });
  }
}
