export const OPEN_CATEGORY_FEE_PAISE = 80000;
export const OPEN_CATEGORY_FEE_RUPEES = OPEN_CATEGORY_FEE_PAISE / 100;
export const PAID_CATEGORY_CODES = ['open_men', 'open_women'];

/**
 * Calculates a standard reference age as of the actual race date (30 August 2026).
 * This provides correct thresholds for the senior and couple rules.
 */
export function calculateAge(dob, referenceDate = new Date('2026-08-30')) {
  const birthDate = dob instanceof Date ? dob : new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

/**
 * Filters and returns the precise categories matching the event poster's cut-off limits.
 */
export function getAvailableRaceCategories({ dob, gender }) {
  if (!dob || !gender) {
    return [];
  }

  const birthDate = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return [];
  }

  // Exact milestone limits defined by the event requirements
  const cutOffU14 = new Date('2013-01-01');
  const cutOffU17 = new Date('2010-01-01');
  const cutOffU19 = new Date('2008-01-01');

  // Baseline standard age relative to the event day (August 30, 2026)
  const generalAge = calculateAge(dob);

  // --- YOUTH CATEGORIES (Based on strict Date of Birth constraints) ---

  // 3 KM U14: Date of birth must be on or after 01/01/2013
  if (birthDate >= cutOffU14) {
    return [
      {
        value: 'u14',
        label:
          gender === 'female'
            ? '3 km - U14 Girls (Palghar District Only) [Cut-Off: On/After 01/01/2013]'
            : '3 km - U14 Boys (Palghar District Only) [Cut-Off: On/After 01/01/2013]',
        feeRupees: 0,
      },
    ];
  }

  // 5 KM U17: Date of birth must be on or after 01/01/2010 (but older than U14)
  if (birthDate >= cutOffU17) {
    return [
      {
        value: 'u17',
        label:
          gender === 'female'
            ? '5 km - U17 Girls (Palghar District Only) [Cut-Off: On/After 01/01/2010]'
            : '5 km - U17 Boys (Palghar District Only) [Cut-Off: On/After 01/01/2010]',
        feeRupees: 0,
      },
    ];
  }

  // 6 KM U19: Date of birth must be on or after 01/01/2008 (but older than U17)
  if (birthDate >= cutOffU19) {
    return [
      {
        value: 'u19',
        label:
          gender === 'female'
            ? '6 km - U19 Girls (Palghar District Only) [Cut-Off: On/After 01/01/2008]'
            : '6 km - U19 Boys (Palghar District Only) [Cut-Off: On/After 01/01/2008]',
        feeRupees: 0,
      },
    ];
  }

  // --- OPEN & FUN RUN CATEGORIES (Born before 01/01/2008) ---
  const categories = [];

  if (gender === 'male') {
    categories.push({
      value: 'open_men',
      label: `11 km - Men's Open (Maharashtra State Only) - Fee Rs. ${OPEN_CATEGORY_FEE_RUPEES}`,
      feeRupees: OPEN_CATEGORY_FEE_RUPEES,
    });
  }

  if (gender === 'female') {
    categories.push({
      value: 'open_women',
      label: `8 km - Women's Open (Maharashtra State Only) - Fee Rs. ${OPEN_CATEGORY_FEE_RUPEES}`,
      feeRupees: OPEN_CATEGORY_FEE_RUPEES,
    });
  }

  // Senior Citizens: Age 55+ on the event timeline
  if (generalAge >= 55) {
    categories.push({
      value: 'senior',
      label: '1 km - Fun Run (Senior Citizens 55+)',
      feeRupees: 0,
    });
  }

  // Couples Race: Open to adults
  if (generalAge >= 18) {
    categories.push({
      value: 'couple',
      label: '1 km - Fun Run (Couples Race - Husband & Wife)',
      feeRupees: 0,
    });
  }

  return categories;
}

export function isPaidCategory(categoryCode) {
  return PAID_CATEGORY_CODES.includes(categoryCode);
}

export function getCategoryFeePaise(categoryCode) {
  return isPaidCategory(categoryCode) ? OPEN_CATEGORY_FEE_PAISE : 0;
}

export function isAllowedCategoryForParticipant({ dob, gender, category }) {
  return getAvailableRaceCategories({ dob, gender }).some(
    (availableCategory) => availableCategory.value === category
  );
}