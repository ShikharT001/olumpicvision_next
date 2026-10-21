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
      { value: 'icon_player', label: 'Icon Player' },
      { value: 'palghar_open', label: 'District Open Senior' },
      { value: 'u19', label: 'U19 Youth Category' },
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
      { value: 'icon_player', label: 'Marquee / Icon Player' },
      { value: 'senior_open', label: 'Senior Division Open' },
      { value: 'u21_youth', label: 'U21 Youth Talent' },
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
      { value: 'icon_player', label: 'Category A (Pro / National)' },
      { value: 'grade_a', label: 'Category B (State / Senior)' },
      { value: 'grade_b', label: 'Category C (District Open)' },
      { value: 'new_young_player', label: 'NYP (New Young Player)' },
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
      { value: 'icon_player', label: 'Star / Icon Chaser' },
      { value: 'senior_open', label: 'Senior Open Division' },
      { value: 'junior_talent', label: 'Junior Talent (U18)' },
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
      { value: 'grade_a', label: 'Grade A (Division 1 / District)' },
      { value: 'grade_b', label: 'Grade B (Club / Senior)' },
      { value: 'emerging_star', label: 'Emerging U19 Talent' },
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
      { value: 'seed_1', label: 'Top Seed / Icon Player' },
      { value: 'tier_a', label: 'Tier A (Ranked Tournament Player)' },
      { value: 'tier_b', label: 'Tier B (District Open)' },
      { value: 'junior', label: 'Junior / Under-17' },
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
      { value: 'senior_open', label: 'Senior Open Division' },
      { value: 'varsity_youth', label: 'College / Youth Talent' },
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
      { value: 'icon_player', label: 'Top Seed Icon' },
      { value: 'grade_a', label: 'Grade A (District / State)' },
      { value: 'grade_b', label: 'Grade B (Open Club)' },
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
      { value: 'icon_player', label: 'Icon Player' },
      { value: 'open', label: 'Open Category' },
      { value: 'youth', label: 'Youth Category' },
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
