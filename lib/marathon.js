export const OPEN_CATEGORY_FEE_PAISE = 80000;
export const OPEN_CATEGORY_FEE_RUPEES = OPEN_CATEGORY_FEE_PAISE / 100;
export const PAID_CATEGORY_CODES = ['open_men', 'open_women'];

export function calculateAge(dob, today = new Date()) {
  const birthDate = dob instanceof Date ? dob : new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function getAvailableRaceCategories({ dob, gender }, today = new Date()) {
  const age = calculateAge(dob, today);

  if (age === null || age < 0 || !gender) {
    return [];
  }

  if (age < 14) {
    return [
      {
        value: 'u14',
        label:
          gender === 'female'
            ? '3 km - U14 Girls (Palghar District Only)'
            : '3 km - U14 Boys (Palghar District Only)',
        feeRupees: 0,
      },
    ];
  }

  if (age < 17) {
    return [
      {
        value: 'u17',
        label:
          gender === 'female'
            ? '5 km - U17 Girls (Palghar District Only)'
            : '5 km - U17 Boys (Palghar District Only)',
        feeRupees: 0,
      },
    ];
  }

  if (age < 19) {
    return [
      {
        value: 'u19',
        label:
          gender === 'female'
            ? '6 km - U19 Girls (Palghar District Only)'
            : '6 km - U19 Boys (Palghar District Only)',
        feeRupees: 0,
      },
    ];
  }

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

  if (age >= 55) {
    categories.push({
      value: 'senior',
      label: '1 km - Fun Run (Senior Citizens 55+)',
      feeRupees: 0,
    });
  }

  categories.push({
    value: 'couple',
    label: '1 km - Fun Run (Couples Race - Husband & Wife)',
    feeRupees: 0,
  });

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
