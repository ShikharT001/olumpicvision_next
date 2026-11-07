// =======================================================
// MULTI-SPORT AUCTION SYSTEM — SPORTS CONFIGURATION
// Master registry of sports, rules, positions, and presets
// =======================================================

export const SPORTS_REGISTRY = [
  {
    id: 'volleyball',
    name: 'Volleyball',
    icon: '🏐',
    badgeClass: 'badge-gold',
    themeColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.08) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    description: '6v6 indoor & outdoor volleyball leagues. Attackers, blockers, setters, and liberos.',
    defaultPurse: 100000,
    minBidIncrement: 500,
    minSquadSize: 8,
    maxSquadSize: 12,
    positions: [
      { value: 'outside_hitter', label: 'Outside Hitter / Left Spiker' },
      { value: 'opposite_hitter', label: 'Opposite Hitter / Right Spiker' },
      { value: 'middle_blocker', label: 'Middle Blocker / Center' },
      { value: 'setter', label: 'Setter / Playmaker' },
      { value: 'libero', label: 'Libero / Defensive Specialist' },
      { value: 'universal', label: 'Universal / All-Rounder' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon / Marquee Player' },
      { value: 'open', label: 'Open Category (Senior)' },
      { value: 'u19', label: 'Under-19 (U19 Youth)' },
      { value: 'u17', label: 'Under-17 (U17 Youth)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Junior)' },
      { value: 'u21', label: 'Under-21 (U21 Youth)' },
      { value: 'palghar_open', label: 'District Open Senior' },
      { value: 'state_national', label: 'State / National Pro' },
    ],
  },
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    badgeClass: 'badge-emerald',
    themeColor: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.08) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    description: '11-a-side and 7-a-side football tournaments. Strikers, playmakers, stoppers, and keepers.',
    defaultPurse: 200000,
    minBidIncrement: 1000,
    minSquadSize: 11,
    maxSquadSize: 18,
    positions: [
      { value: 'striker', label: 'Striker / Center Forward (CF)' },
      { value: 'winger', label: 'Winger (LW / RW)' },
      { value: 'attacking_midfielder', label: 'Attacking Midfielder (CAM / #10)' },
      { value: 'central_midfielder', label: 'Central Midfielder (CM / CDM)' },
      { value: 'full_back', label: 'Full Back / Wing Back (LB / RB)' },
      { value: 'center_back', label: 'Center Back / Stopper (CB)' },
      { value: 'goalkeeper', label: 'Goalkeeper (GK)' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon / Marquee Player' },
      { value: 'open', label: 'Open Category (Senior Division)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Junior)' },
      { value: 'u19', label: 'Under-19 (U19 Talent)' },
      { value: 'foreign_quota', label: 'State / Guest Player' },
    ],
  },
  {
    id: 'kabaddi',
    name: 'Kabaddi',
    icon: '🤼',
    badgeClass: 'badge-danger',
    themeColor: '#ef4444',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.08) 100%)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    description: 'High-octane mats & mud kabaddi leagues. Speed raiders, lethal corners, and iron covers.',
    defaultPurse: 150000,
    minBidIncrement: 500,
    minSquadSize: 7,
    maxSquadSize: 14,
    positions: [
      { value: 'right_raider', label: 'Right Raider' },
      { value: 'left_raider', label: 'Left Raider' },
      { value: 'right_corner', label: 'Right Corner Defender' },
      { value: 'left_corner', label: 'Left Corner Defender' },
      { value: 'right_cover', label: 'Right Cover Defender' },
      { value: 'left_cover', label: 'Left Cover Defender' },
      { value: 'all_rounder', label: 'All-Rounder (Raid & Defense)' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon Player (Grade A Pro)' },
      { value: 'open', label: 'Open Category (Senior District)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Junior)' },
      { value: 'u19', label: 'Under-19 (U19 NYP)' },
      { value: 'grade_a', label: 'Category B (State)' },
      { value: 'grade_b', label: 'Category C (Club)' },
    ],
  },
  {
    id: 'khokho',
    name: 'Kho-Kho',
    icon: '🏃',
    badgeClass: 'badge-purple',
    themeColor: '#8b5cf6',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(109, 40, 217, 0.08) 100%)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    description: 'Ultimate speed, agility, and diving chase tournament leagues. Chasers and defenders.',
    defaultPurse: 100000,
    minBidIncrement: 500,
    minSquadSize: 9,
    maxSquadSize: 15,
    positions: [
      { value: 'chaser_attacker', label: 'Chaser / Attacking Specialist' },
      { value: 'runner_defender', label: 'Defender / Dodger / Runner' },
      { value: 'pole_diver', label: 'Pole Diver / Turning Specialist' },
      { value: 'all_rounder', label: 'All-Rounder (Chaser & Defender)' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon / Star Chaser' },
      { value: 'open', label: 'Open Category (Senior)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Junior)' },
      { value: 'u19', label: 'Under-19 (U19 Youth)' },
    ],
  },
  {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    badgeClass: 'badge-cyan',
    themeColor: '#06b6d4',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(14, 116, 144, 0.08) 100%)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    description: 'T20, T10, and tennis/leather ball leagues. Power-hitters, pacers, mystery spinners, and keepers.',
    defaultPurse: 500000,
    minBidIncrement: 1000,
    minSquadSize: 11,
    maxSquadSize: 16,
    positions: [
      { value: 'top_order_batter', label: 'Top-Order Batter / Opener' },
      { value: 'middle_order_batter', label: 'Middle-Order Batter / Finisher' },
      { value: 'wicketkeeper_batter', label: 'Wicketkeeper Batter' },
      { value: 'pace_bowler', label: 'Fast / Medium Pace Bowler' },
      { value: 'spin_bowler', label: 'Spin Bowler (Off / Leg / Left-Arm)' },
      { value: 'batting_allrounder', label: 'Batting All-Rounder' },
      { value: 'bowling_allrounder', label: 'Bowling All-Rounder' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon / Marquee Player' },
      { value: 'open', label: 'Open Category (Senior Club)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Sub-Junior)' },
      { value: 'u19', label: 'Under-19 (U19 Emerging)' },
      { value: 'grade_a', label: 'Grade A (Division 1)' },
    ],
  },
  {
    id: 'badminton',
    name: 'Badminton',
    icon: '🏸',
    badgeClass: 'badge-pink',
    themeColor: '#ec4899',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(190, 24, 93, 0.08) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    description: 'Fast-paced shuttle leagues. Singles masters, doubles duos, and mixed doubles specialists.',
    defaultPurse: 100000,
    minBidIncrement: 500,
    minSquadSize: 4,
    maxSquadSize: 8,
    positions: [
      { value: 'singles_specialist', label: "Men's / Women's Singles" },
      { value: 'doubles_specialist', label: "Men's / Women's Doubles" },
      { value: 'mixed_doubles', label: 'Mixed Doubles Specialist' },
      { value: 'all_court', label: 'All-Court Player (Singles & Doubles)' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon / Top Seed' },
      { value: 'open', label: 'Open Category (Senior)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Junior)' },
      { value: 'u19', label: 'Under-19 (U19 Youth)' },
      { value: 'tier_a', label: 'Tier A (Ranked)' },
    ],
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    badgeClass: 'badge-orange',
    themeColor: '#f97316',
    gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(194, 65, 12, 0.08) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    description: '5v5 and 3x3 hoops leagues. Point guards, sharpshooters, power forwards, and rim protectors.',
    defaultPurse: 150000,
    minBidIncrement: 500,
    minSquadSize: 5,
    maxSquadSize: 10,
    positions: [
      { value: 'point_guard', label: 'Point Guard (PG / #1)' },
      { value: 'shooting_guard', label: 'Shooting Guard (SG / #2)' },
      { value: 'small_forward', label: 'Small Forward (SF / #3)' },
      { value: 'power_forward', label: 'Power Forward (PF / #4)' },
      { value: 'center', label: 'Center / Rim Protector (C / #5)' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon / MVP Player' },
      { value: 'open', label: 'Open Category (Senior)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Junior)' },
      { value: 'u19', label: 'Under-19 (U19 Youth)' },
    ],
  },
  {
    id: 'tabletennis',
    name: 'Table Tennis',
    icon: '🏓',
    badgeClass: 'badge-cyan',
    themeColor: '#0ea5e9',
    gradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(3, 105, 161, 0.08) 100%)',
    borderColor: 'rgba(14, 165, 233, 0.4)',
    description: 'Fast-reflex table tennis leagues. Offensive loopers, defensive choppers, and doubles aces.',
    defaultPurse: 80000,
    minBidIncrement: 500,
    minSquadSize: 3,
    maxSquadSize: 6,
    positions: [
      { value: 'offensive_looper', label: 'Offensive Looper / Attacker' },
      { value: 'defensive_chopper', label: 'Defensive Chopper / Pips Specialist' },
      { value: 'all_round_counter', label: 'All-Round Counter Hitter' },
      { value: 'doubles_ace', label: 'Doubles Specialist' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon / Top Seed' },
      { value: 'open', label: 'Open Category (Senior)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Junior)' },
      { value: 'u19', label: 'Under-19 (U19 Youth)' },
    ],
  },
];

export function getAllSports() {
  return SPORTS_REGISTRY;
}

export function getSportById(sportId) {
  if (!sportId) return SPORTS_REGISTRY[0];
  const normalized = String(sportId).trim().toLowerCase();
  return SPORTS_REGISTRY.find((s) => s.id === normalized) || {
    id: normalized,
    name: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    icon: '🏆',
    badgeClass: 'badge-gold',
    themeColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.08) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    description: `${normalized.charAt(0).toUpperCase() + normalized.slice(1)} Tournament League`,
    defaultPurse: 100000,
    minBidIncrement: 500,
    minSquadSize: 5,
    maxSquadSize: 15,
    positions: [
      { value: 'player', label: 'General Player' },
      { value: 'captain', label: 'Team Captain / Marquee' },
      { value: 'all_rounder', label: 'All-Rounder' },
    ],
    categories: [
      { value: 'icon_player', label: 'Icon / Marquee' },
      { value: 'open', label: 'Open Category (Senior)' },
      { value: 'u18', label: 'Under-18 (U18 Youth)' },
      { value: 'u14', label: 'Under-14 (U14 Junior)' },
      { value: 'u19', label: 'Under-19 (U19 Youth)' },
    ],
  };
}

export function getSportPositions(sportId) {
  const sport = getSportById(sportId);
  return sport.positions || [];
}

export function getSportCategories(sportId) {
  const sport = getSportById(sportId);
  return sport.categories || [];
}

// Default Squad Category Quota Limits
export const DEFAULT_MENS_CATEGORY_LIMITS = {
  u14: 1,
  u17: 2,
  u19: 3,
  open: 4,
  icon_player: 2,
};

export const DEFAULT_WOMENS_CATEGORY_LIMITS = {
  u14: 1,
  u17: 5,
  u21: 4,
  open: 2,
};

export const DEFAULT_MENS_PURSE = 11400;
export const DEFAULT_MENS_MAX_BID = 11400;
export const DEFAULT_WOMENS_PURSE = 13500;
export const DEFAULT_WOMENS_MAX_BID = 13500;

export const CATEGORY_LIMIT_PRESETS = [
  {
    id: 'mens',
    label: "Men's Standard (Purse: ₹11,400 · Max Bid: ₹11,400 · 12 Players)",
    shortLabel: "Men's (₹11,400)",
    totalSlots: 12,
    defaultPurse: DEFAULT_MENS_PURSE,
    maxBidPerPlayer: DEFAULT_MENS_MAX_BID,
    limits: DEFAULT_MENS_CATEGORY_LIMITS,
  },
  {
    id: 'womens',
    label: "Women's Standard (Purse: ₹13,500 · Max Bid: ₹13,500 · 12 Players)",
    shortLabel: "Women's (₹13,500)",
    totalSlots: 12,
    defaultPurse: DEFAULT_WOMENS_PURSE,
    maxBidPerPlayer: DEFAULT_WOMENS_MAX_BID,
    limits: DEFAULT_WOMENS_CATEGORY_LIMITS,
  },
];

/**
 * Resolves the maximum allowed single bid cap for a team / tournament.
 */
export function getMaxBidLimit(team, tournament) {
  const teamCap = Number(team?.max_bid_per_player);
  if (!isNaN(teamCap) && teamCap > 0) return teamCap;

  const tourneyCap = Number(tournament?.max_bid_per_player);
  if (!isNaN(tourneyCap) && tourneyCap > 0) return tourneyCap;

  const tourneyPurse = Number(tournament?.default_purse);
  if (!isNaN(tourneyPurse) && tourneyPurse > 0) return tourneyPurse;

  return DEFAULT_MENS_MAX_BID;
}

// Systematic Category Pipeline Ordering for Auction Podium
export const CATEGORY_SYSTEMATIC_PIPELINE = [
  { key: 'icon_player', label: 'Icon / Marquee', shortLabel: 'Icon', icon: '⭐', badgeClass: 'badge-gold' },
  { key: 'open', label: 'Open Category', shortLabel: 'Open', icon: '🏆', badgeClass: 'badge-emerald' },
  { key: 'u19', label: 'Under-19 (U19)', shortLabel: 'U19', icon: '⚡', badgeClass: 'badge-cyan' },
  { key: 'u17', label: 'Under-17 (U17)', shortLabel: 'U17', icon: '🔥', badgeClass: 'badge-warning bg-amber-500 text-dark' },
  { key: 'u18', label: 'Under-18 (U18)', shortLabel: 'U18', icon: '⚡', badgeClass: 'badge-cyan' },
  { key: 'u21', label: 'Under-21 (U21)', shortLabel: 'U21', icon: '✨', badgeClass: 'bg-pink-600 text-white border border-pink-400' },
  { key: 'u14', label: 'Under-14 (U14)', shortLabel: 'U14', icon: '🌱', badgeClass: 'badge-purple' },
];

/**
 * Normalizes any category string or legacy alias into a standard category key
 */
export function normalizeCategory(cat) {
  if (!cat) return 'open';
  const c = String(cat).toLowerCase().trim().replace(/[-\s]+/g, '_');
  if (c.includes('icon') || c.includes('marquee') || c === 'seed_1') return 'icon_player';
  if (c.includes('u14') || c.includes('under_14')) return 'u14';
  if (c.includes('u17') || c.includes('under_17')) return 'u17';
  if (c.includes('u18') || c.includes('under_18')) return 'u18';
  if (c.includes('u19') || c.includes('under_19') || c.includes('emerging')) return 'u19';
  if (c.includes('u21') || c.includes('under_21')) return 'u21';
  if (c.includes('open') || c.includes('senior') || c.includes('palghar') || c.includes('district') || c.includes('grade_a') || c.includes('tier_a')) {
    return 'open';
  }
  return c;
}

/**
 * Returns human-readable presentation label for any category key
 */
export function formatCategoryLabel(cat) {
  const norm = normalizeCategory(cat);
  switch (norm) {
    case 'icon_player':
      return 'Icon / Marquee';
    case 'open':
      return 'Open Category';
    case 'u14':
      return 'Under-14 (U14)';
    case 'u17':
      return 'Under-17 (U17)';
    case 'u18':
      return 'Under-18 (U18)';
    case 'u19':
      return 'Under-19 (U19)';
    case 'u21':
      return 'Under-21 (U21)';
    case 'state_national':
      return 'State / National Pro';
    default:
      return String(cat).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

/**
 * Returns consistent badge CSS class for category tag
 */
export function getCategoryBadgeClass(cat) {
  const norm = normalizeCategory(cat);
  switch (norm) {
    case 'icon_player':
      return 'badge-gold';
    case 'open':
      return 'badge-emerald';
    case 'u14':
      return 'bg-purple-600 text-white border border-purple-400';
    case 'u17':
      return 'bg-amber-500 text-dark border border-amber-400 fw-bold';
    case 'u18':
      return 'badge-cyan';
    case 'u19':
      return 'badge-cyan';
    case 'u21':
      return 'bg-pink-600 text-white border border-pink-400 fw-bold';
    default:
      return 'badge-cyan';
  }
}

/**
 * Resolves effective category limits for a team in a tournament.
 * Team-level limits take priority if specified; otherwise tournament defaults apply.
 */
export function getEffectiveCategoryLimits(team, tournament) {
  let limits = null;
  if (team?.category_limits && typeof team.category_limits === 'object' && Object.keys(team.category_limits).length > 0) {
    limits = team.category_limits;
  } else if (tournament?.category_limits && typeof tournament.category_limits === 'object' && Object.keys(tournament.category_limits).length > 0) {
    limits = tournament.category_limits;
  } else {
    limits = DEFAULT_MENS_CATEGORY_LIMITS;
  }

  const normalized = {};
  for (const [key, val] of Object.entries(limits)) {
    const normKey = normalizeCategory(key);
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      normalized[normKey] = num;
    }
  }
  return normalized;
}

/**
 * Consistently format Rupee amounts across both SSR (Node.js) and Browser Client (V8)
 * using the explicit 'en-IN' locale to prevent Next.js hydration mismatches.
 */
export function formatRupees(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '0';
  return Number(amount).toLocaleString('en-IN');
}

/**
 * Safe currency formatter alias using Indian numbering system (en-IN)
 */
export const formatCurrency = formatRupees;

/**
 * Human-readable position label
 */
export function formatPositionLabel(pos) {
  if (!pos) return 'Player';
  return String(pos)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}


