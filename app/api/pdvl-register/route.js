import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/postgres';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(request), 'pdvl-register', 5, 10 * 60_000);
  if (!allowed) return NextResponse.json({ error: `Too many attempts. Please try again in ${retryAfter} seconds.` }, { status: 429 });

  try {
    const data = await request.json();
    const required = [
      'fullName',
      'dateOfBirth',
      'gender',
      'playerCategory',
      'mobileNo',
      'email',
      'address',
      'photoUrl',
      'teamName',
      'playingPosition',
      'highestLevel',
      'jerseySize',
      'emergencyPhone',
      'typedSignature',
    ];

    if (required.some((key) => !String(data[key] || '').trim()) || !data.undertakingAccepted || !data.medicalConsent) {
      return NextResponse.json({ error: 'Please complete all required fields and accept the declarations.' }, { status: 400 });
    }

    if (!/^[6-9]\d{9}$/.test(data.mobileNo) || !/^[6-9]\d{9}$/.test(data.emergencyPhone)) {
      return NextResponse.json({ error: 'Please enter valid 10-digit Indian mobile numbers.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const client = await getDbClient();
    try {
      const result = await client.query(
        `INSERT INTO volleyball_registrations (
          full_name, guardian_name, date_of_birth, gender, player_category,
          mobile_no, alternate_mobile, email, address, district, pin_code,
          playing_position, preferred_hand, height_cm, weight_kg, playing_experience, previous_club, highest_level,
          team_name, jersey_size, medical_limitations, emergency_contact_name, emergency_relationship, emergency_contact_phone,
          typed_signature, photo_url, undertaking_accepted, medical_consent
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24,
          $25, $26, true, true
        ) RETURNING id`,
        [
          data.fullName.trim(),
          data.guardianName?.trim() || null,
          data.dateOfBirth,
          data.gender,
          data.playerCategory || 'palghar_open',
          data.mobileNo.trim(),
          data.alternateMobile?.trim() || null,
          data.email.trim().toLowerCase(),
          data.address.trim(),
          data.district?.trim() || 'Palghar',
          data.pinCode?.trim() || null,
          data.playingPosition,
          data.preferredHand || 'right',
          data.heightCm ? Number(data.heightCm) : null,
          data.weightKg ? Number(data.weightKg) : null,
          data.playingExperience ? Number(data.playingExperience) : null,
          data.previousClub?.trim() || null,
          data.highestLevel || null,
          data.teamName.trim(),
          data.jerseySize,
          data.medicalLimitations?.trim() || null,
          data.emergencyContactName?.trim() || null,
          data.emergencyRelationship?.trim() || null,
          data.emergencyPhone.trim(),
          data.typedSignature.trim(),
          data.photoUrl,
        ]
      );
      return NextResponse.json({ success: true, id: result.rows[0].id });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A PDVL registration already exists with this mobile number.' }, { status: 409 });
    }
    console.error('PDVL registration error:', error);
    return NextResponse.json({ error: 'Unable to submit your registration. Please try again.' }, { status: 500 });
  }
}

