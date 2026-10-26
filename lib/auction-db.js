// =======================================================
// MULTI-SPORT AUCTION SYSTEM — DATABASE & SERVICE LAYER
// Handles Tournaments, Sports, Teams, Players, Bids, and
// Live Podium State across Volleyball, Football, Kabaddi,
// Kho-Kho, Cricket, Badminton, and custom sports.
// =======================================================

import { getAllSports, getSportById } from './sports-config.js';

const g = globalThis;
if (!g.__multiSportAuctionStore__) g.__multiSportAuctionStore__ = null;
if (!g.__auctionNotifications__) g.__auctionNotifications__ = {};
if (!g.__auctionNotificationHistory__) g.__auctionNotificationHistory__ = {};

const DEFAULT_TOURNAMENT_ID = '00000000-0000-0000-0000-000000000001';
const FOOTBALL_TOURNAMENT_ID = '00000000-0000-0000-0000-000000000002';
const KABADDI_TOURNAMENT_ID = '00000000-0000-0000-0000-000000000003';
const KHOKHO_TOURNAMENT_ID = '00000000-0000-0000-0000-000000000004';
const CRICKET_TOURNAMENT_ID = '00000000-0000-0000-0000-000000000005';
const BADMINTON_TOURNAMENT_ID = '00000000-0000-0000-0000-000000000006';

// Seed starter data across games so every sport has instant live capability
function initMultiSportMemoryStore() {
  if (g.__multiSportAuctionStore__) return g.__multiSportAuctionStore__;

  // 1. Initial Tournaments
  const sampleTournaments = [
    {
      id: DEFAULT_TOURNAMENT_ID,
      sport_id: 'volleyball',
      sport_name: 'Volleyball',
      tournament_name: 'Palghar District Volleyball League 2026/27',
      slug: 'pdvl-2026',
      season_year: '2026/27',
      venue: 'Palghar District Sports Complex, Palghar',
      banner_url: '',
      default_purse: 100000,
      min_bid_increment: 500,
      min_squad_size: 8,
      max_squad_size: 12,
      status: 'active',
      created_at: new Date('2026-01-10').toISOString(),
    },
    {
      id: FOOTBALL_TOURNAMENT_ID,
      sport_id: 'football',
      sport_name: 'Football',
      tournament_name: 'Palghar District Premier Football Cup 2026',
      slug: 'pdfc-2026',
      season_year: '2026/27',
      venue: 'Tarapur Atomic Arena, Boisar',
      banner_url: '',
      default_purse: 200000,
      min_bid_increment: 1000,
      min_squad_size: 11,
      max_squad_size: 18,
      status: 'active',
      created_at: new Date('2026-01-15').toISOString(),
    },
    {
      id: KABADDI_TOURNAMENT_ID,
      sport_id: 'kabaddi',
      sport_name: 'Kabaddi',
      tournament_name: 'Palghar Pro Kabaddi League Championship 2026',
      slug: 'ppkc-2026',
      season_year: 'Season 4',
      venue: 'Manor Sports Pavilion, Manor',
      banner_url: '',
      default_purse: 150000,
      min_bid_increment: 500,
      min_squad_size: 7,
      max_squad_size: 14,
      status: 'active',
      created_at: new Date('2026-01-20').toISOString(),
    },
    {
      id: KHOKHO_TOURNAMENT_ID,
      sport_id: 'khokho',
      sport_name: 'Kho-Kho',
      tournament_name: 'Maharashtra State District Kho-Kho Trophy 2026',
      slug: 'dkkc-2026',
      season_year: '2026',
      venue: 'Dahanu Coastal Grounds, Dahanu',
      banner_url: '',
      default_purse: 100000,
      min_bid_increment: 500,
      min_squad_size: 9,
      max_squad_size: 15,
      status: 'active',
      created_at: new Date('2026-02-01').toISOString(),
    },
    {
      id: CRICKET_TOURNAMENT_ID,
      sport_id: 'cricket',
      sport_name: 'Cricket',
      tournament_name: 'Palghar Super League T20 Championship 2026',
      slug: 'psl-t20-2026',
      season_year: '2026',
      venue: 'Kelva Green Oval, Kelva',
      banner_url: '',
      default_purse: 500000,
      min_bid_increment: 2000,
      min_squad_size: 11,
      max_squad_size: 16,
      status: 'active',
      created_at: new Date('2026-02-05').toISOString(),
    },
    {
      id: BADMINTON_TOURNAMENT_ID,
      sport_id: 'badminton',
      sport_name: 'Badminton',
      tournament_name: 'District Badminton Super Series 2026',
      slug: 'dbss-2026',
      season_year: '2026',
      venue: 'Virar Indoor Badminton Stadium, Virar',
      banner_url: '',
      default_purse: 100000,
      min_bid_increment: 500,
      min_squad_size: 4,
      max_squad_size: 8,
      status: 'active',
      created_at: new Date('2026-02-10').toISOString(),
    },
  ];

  // 2. Initial Teams across tournaments
  const sampleTeams = [
    // Volleyball (PDVL) Teams
    {
      id: 'team-vb-1',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      team_name: 'Palghar Smashers',
      team_code: 'PSM',
      owner_name: 'Sunil Patil',
      coach_name: 'Rajesh Gharat',
      logo_url: '',
      primary_color: '#f59e0b',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'team-vb-2',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      team_name: 'Boisar Blasters',
      team_code: 'BBL',
      owner_name: 'Mahesh Tare',
      coach_name: 'Pravin Raut',
      logo_url: '',
      primary_color: '#06b6d4',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 2,
      is_active: true,
    },
    {
      id: 'team-vb-3',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      team_name: 'Dahanu Spikers',
      team_code: 'DSP',
      owner_name: 'Ketan Vaze',
      coach_name: 'Amol More',
      logo_url: '',
      primary_color: '#10b981',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 3,
      is_active: true,
    },
    {
      id: 'team-vb-4',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      team_name: 'Manor Aces',
      team_code: 'MAC',
      owner_name: 'Sachin Jadhav',
      coach_name: 'Devendra Koli',
      logo_url: '',
      primary_color: '#8b5cf6',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 4,
      is_active: true,
    },
    {
      id: 'team-vb-5',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      team_name: 'Tarapur Warriors',
      team_code: 'TWR',
      owner_name: 'Vikram Thakur',
      coach_name: 'Ajay Shinde',
      logo_url: '',
      primary_color: '#ef4444',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 5,
      is_active: true,
    },
    {
      id: 'team-vb-6',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      team_name: 'Virar Kings',
      team_code: 'VKG',
      owner_name: 'Anand Mishra',
      coach_name: 'Suresh Nair',
      logo_url: '',
      primary_color: '#ec4899',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 6,
      is_active: true,
    },

    // Football Teams
    {
      id: 'team-fb-1',
      tournament_id: FOOTBALL_TOURNAMENT_ID,
      team_name: 'Coastal Strikers FC',
      team_code: 'CSF',
      owner_name: 'Farooq Merchant',
      coach_name: 'Alberto Gomes',
      primary_color: '#10b981',
      initial_purse: 200000,
      remaining_purse: 200000,
      min_squad_size: 11,
      max_squad_size: 18,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'team-fb-2',
      tournament_id: FOOTBALL_TOURNAMENT_ID,
      team_name: 'Sahyadri United',
      team_code: 'SUN',
      owner_name: 'Rohan Deshmukh',
      coach_name: 'Ganesh Sawant',
      primary_color: '#2563eb',
      initial_purse: 200000,
      remaining_purse: 200000,
      min_squad_size: 11,
      max_squad_size: 18,
      display_order: 2,
      is_active: true,
    },
    {
      id: 'team-fb-3',
      tournament_id: FOOTBALL_TOURNAMENT_ID,
      team_name: 'Palghar Blue Tigers',
      team_code: 'PBT',
      owner_name: 'Nitin Meher',
      coach_name: 'Sanjay Bhoir',
      primary_color: '#06b6d4',
      initial_purse: 200000,
      remaining_purse: 200000,
      min_squad_size: 11,
      max_squad_size: 18,
      display_order: 3,
      is_active: true,
    },
    {
      id: 'team-fb-4',
      tournament_id: FOOTBALL_TOURNAMENT_ID,
      team_name: 'Tarapur Titans FC',
      team_code: 'TTF',
      owner_name: 'Vivek Joshi',
      coach_name: 'Denzil Dsouza',
      primary_color: '#ea580c',
      initial_purse: 200000,
      remaining_purse: 200000,
      min_squad_size: 11,
      max_squad_size: 18,
      display_order: 4,
      is_active: true,
    },

    // Kabaddi Teams
    {
      id: 'team-kb-1',
      tournament_id: KABADDI_TOURNAMENT_ID,
      team_name: 'Dahanu Dhurandhar',
      team_code: 'DDH',
      owner_name: 'Baban Patil',
      coach_name: 'Shrikant Jadhav',
      primary_color: '#dc2626',
      initial_purse: 150000,
      remaining_purse: 150000,
      min_squad_size: 7,
      max_squad_size: 14,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'team-kb-2',
      tournament_id: KABADDI_TOURNAMENT_ID,
      team_name: 'Boisar Bulls',
      team_code: 'BBU',
      owner_name: 'Ajit Tamore',
      coach_name: 'Pandurang Koli',
      primary_color: '#f59e0b',
      initial_purse: 150000,
      remaining_purse: 150000,
      min_squad_size: 7,
      max_squad_size: 14,
      display_order: 2,
      is_active: true,
    },
    {
      id: 'team-kb-3',
      tournament_id: KABADDI_TOURNAMENT_ID,
      team_name: 'Palghar Panthers',
      team_code: 'PAN',
      owner_name: 'Dinesh Chaudhari',
      coach_name: 'Ramdas Gharat',
      primary_color: '#7c3aed',
      initial_purse: 150000,
      remaining_purse: 150000,
      min_squad_size: 7,
      max_squad_size: 14,
      display_order: 3,
      is_active: true,
    },
    {
      id: 'team-kb-4',
      tournament_id: KABADDI_TOURNAMENT_ID,
      team_name: 'Manor Marathas',
      team_code: 'MMR',
      owner_name: 'Kashinath Pawar',
      coach_name: 'Vilas Mhatre',
      primary_color: '#ea580c',
      initial_purse: 150000,
      remaining_purse: 150000,
      min_squad_size: 7,
      max_squad_size: 14,
      display_order: 4,
      is_active: true,
    },

    // Cricket Teams
    {
      id: 'team-cr-1',
      tournament_id: CRICKET_TOURNAMENT_ID,
      team_name: 'Palghar Super Kings',
      team_code: 'PSK',
      owner_name: 'Hemant Patil',
      coach_name: 'Vinit Indulkar',
      primary_color: '#eab308',
      initial_purse: 500000,
      remaining_purse: 500000,
      min_squad_size: 11,
      max_squad_size: 16,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'team-cr-2',
      tournament_id: CRICKET_TOURNAMENT_ID,
      team_name: 'Boisar Royals',
      team_code: 'BRO',
      owner_name: 'Ashok Shah',
      coach_name: 'Pradeep Sundaram',
      primary_color: '#2563eb',
      initial_purse: 500000,
      remaining_purse: 500000,
      min_squad_size: 11,
      max_squad_size: 16,
      display_order: 2,
      is_active: true,
    },
    {
      id: 'team-cr-3',
      tournament_id: CRICKET_TOURNAMENT_ID,
      team_name: 'Dahanu Indians',
      team_code: 'DIN',
      owner_name: 'Chetan Vaze',
      coach_name: 'Sagar Naik',
      primary_color: '#0284c7',
      initial_purse: 500000,
      remaining_purse: 500000,
      min_squad_size: 11,
      max_squad_size: 16,
      display_order: 3,
      is_active: true,
    },

    // Kho-Kho Teams
    {
      id: 'team-kk-1',
      tournament_id: KHOKHO_TOURNAMENT_ID,
      team_name: 'Palghar Chasers',
      team_code: 'PCH',
      owner_name: 'Narendra Tandel',
      coach_name: 'Santosh Kadam',
      primary_color: '#8b5cf6',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 9,
      max_squad_size: 15,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'team-kk-2',
      tournament_id: KHOKHO_TOURNAMENT_ID,
      team_name: 'Sahyadri Runners',
      team_code: 'SRU',
      owner_name: 'Bhushan Patil',
      coach_name: 'Umesh More',
      primary_color: '#10b981',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 9,
      max_squad_size: 15,
      display_order: 2,
      is_active: true,
    },

    // Badminton Teams
    {
      id: 'team-bm-1',
      tournament_id: BADMINTON_TOURNAMENT_ID,
      team_name: 'Palghar Smash Masters',
      team_code: 'PSM',
      owner_name: 'Deepak Merchant',
      coach_name: 'Arun Gawade',
      primary_color: '#ec4899',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 4,
      max_squad_size: 8,
      display_order: 1,
      is_active: true,
    },
    {
      id: 'team-bm-2',
      tournament_id: BADMINTON_TOURNAMENT_ID,
      team_name: 'Shuttle Stars Boisar',
      team_code: 'SSB',
      owner_name: 'Kavita Tare',
      coach_name: 'Nitin Sawant',
      primary_color: '#06b6d4',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 4,
      max_squad_size: 8,
      display_order: 2,
      is_active: true,
    },
  ];

  // 3. Initial Players across tournaments
  const samplePlayers = [
    // Volleyball (PDVL) Players
    {
      id: 'player-vb-1',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      full_name: 'Pratik Patil',
      photo_url: '/images/volleyball/image4.jpeg',
      playing_position: 'outside_hitter',
      player_category: 'icon_player',
      height_cm: 188,
      weight_kg: 78,
      team_name: 'Tarapur Club',
      district: 'Palghar',
      lot_number: 1,
      player_grade: 'Icon',
      base_price: 5000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'on_hammer',
      bidding_order: 1,
      bid_count: 0,
    },
    {
      id: 'player-vb-2',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      full_name: 'Sanket Gharat',
      photo_url: '/images/volleyball/image7.jpeg',
      playing_position: 'setter',
      player_category: 'icon_player',
      height_cm: 182,
      weight_kg: 72,
      team_name: 'Boisar Gymkhana',
      district: 'Palghar',
      lot_number: 1,
      player_grade: 'Icon',
      base_price: 5000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 2,
      bid_count: 0,
    },
    {
      id: 'player-vb-3',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      full_name: 'Mayur Raut',
      photo_url: '/images/volleyball/image8.jpeg',
      playing_position: 'middle_blocker',
      player_category: 'open',
      height_cm: 194,
      weight_kg: 84,
      team_name: 'Palghar Warriors',
      district: 'Palghar',
      lot_number: 2,
      player_grade: 'Grade A',
      base_price: 3000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 3,
      bid_count: 0,
    },
    {
      id: 'player-vb-4',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      full_name: 'Chetan Koli',
      photo_url: '/images/volleyball/image9.jpeg',
      playing_position: 'libero',
      player_category: 'open',
      height_cm: 172,
      weight_kg: 66,
      team_name: 'Kelva Tigers',
      district: 'Palghar',
      lot_number: 2,
      player_grade: 'Grade A',
      base_price: 2500,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 4,
      bid_count: 0,
    },
    {
      id: 'player-vb-5',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      full_name: 'Akshay Vaze',
      photo_url: '/images/volleyball/image10.jpeg',
      playing_position: 'opposite_hitter',
      player_category: 'u19',
      height_cm: 185,
      weight_kg: 74,
      team_name: 'Dahanu Rising Stars',
      district: 'Palghar',
      lot_number: 3,
      player_grade: 'Grade B',
      base_price: 1500,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 5,
      bid_count: 0,
    },
    {
      id: 'player-vb-6',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      full_name: 'Tanmay Gharat',
      photo_url: '/images/volleyball/image11.jpeg',
      playing_position: 'outside_hitter',
      player_category: 'u19',
      height_cm: 180,
      weight_kg: 70,
      team_name: 'Boisar Youth Club',
      district: 'Palghar',
      lot_number: 3,
      player_grade: 'Grade B',
      base_price: 1500,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 6,
      bid_count: 0,
    },
    {
      id: 'player-vb-7',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      full_name: 'Aditya Tandel',
      photo_url: '/images/team1.jpeg',
      playing_position: 'setter',
      player_category: 'u14',
      height_cm: 168,
      weight_kg: 58,
      team_name: 'Satpati Junior Academy',
      district: 'Palghar',
      lot_number: 4,
      player_grade: 'Grade C',
      base_price: 1000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 7,
      bid_count: 0,
    },
    {
      id: 'player-vb-8',
      tournament_id: DEFAULT_TOURNAMENT_ID,
      full_name: 'Omkar Tamore',
      photo_url: '/images/team2.jpeg',
      playing_position: 'middle_blocker',
      player_category: 'u14',
      height_cm: 175,
      weight_kg: 62,
      team_name: 'Tarapur Juniors',
      district: 'Palghar',
      lot_number: 4,
      player_grade: 'Grade C',
      base_price: 1000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 8,
      bid_count: 0,
    },

    // Football Players
    {
      id: 'player-fb-1',
      tournament_id: FOOTBALL_TOURNAMENT_ID,
      full_name: 'Rahul Fernandes',
      playing_position: 'striker',
      player_category: 'icon_player',
      height_cm: 181,
      weight_kg: 76,
      team_name: 'St. John FC',
      district: 'Palghar',
      lot_number: 1,
      player_grade: 'Icon',
      base_price: 10000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 1,
      bid_count: 0,
    },
    {
      id: 'player-fb-2',
      tournament_id: FOOTBALL_TOURNAMENT_ID,
      full_name: 'Amir Shaikh',
      playing_position: 'attacking_midfielder',
      player_category: 'senior_open',
      height_cm: 175,
      weight_kg: 69,
      team_name: 'Palghar Youth Academy',
      district: 'Palghar',
      lot_number: 2,
      player_grade: 'Grade A',
      base_price: 5000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 2,
      bid_count: 0,
    },
    {
      id: 'player-fb-3',
      tournament_id: FOOTBALL_TOURNAMENT_ID,
      full_name: 'David Mendonca',
      playing_position: 'goalkeeper',
      player_category: 'senior_open',
      height_cm: 188,
      weight_kg: 82,
      team_name: 'Boisar Rangers',
      district: 'Palghar',
      lot_number: 2,
      player_grade: 'Grade A',
      base_price: 6000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 3,
      bid_count: 0,
    },

    // Kabaddi Players
    {
      id: 'player-kb-1',
      tournament_id: KABADDI_TOURNAMENT_ID,
      full_name: 'Babanrao Shinde',
      playing_position: 'right_raider',
      player_category: 'icon_player',
      height_cm: 180,
      weight_kg: 80,
      team_name: 'Jai Bajrang Kreeda Mandal',
      district: 'Palghar',
      lot_number: 1,
      player_grade: 'Icon',
      base_price: 8000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 1,
      bid_count: 0,
    },
    {
      id: 'player-kb-2',
      tournament_id: KABADDI_TOURNAMENT_ID,
      full_name: 'Ganesh Kadu',
      playing_position: 'right_corner',
      player_category: 'grade_a',
      height_cm: 176,
      weight_kg: 78,
      team_name: 'Veer Maratha Dahanu',
      district: 'Palghar',
      lot_number: 2,
      player_grade: 'Grade A',
      base_price: 4000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 2,
      bid_count: 0,
    },

    // Cricket Players
    {
      id: 'player-cr-1',
      tournament_id: CRICKET_TOURNAMENT_ID,
      full_name: 'Aditya Tare Patil',
      playing_position: 'wicketkeeper_batter',
      player_category: 'icon_player',
      height_cm: 178,
      weight_kg: 75,
      team_name: 'Palghar Cricket Club',
      district: 'Palghar',
      lot_number: 1,
      player_grade: 'Icon',
      base_price: 25000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 1,
      bid_count: 0,
    },
    {
      id: 'player-cr-2',
      tournament_id: CRICKET_TOURNAMENT_ID,
      full_name: 'Omkar Jadhav',
      playing_position: 'pace_bowler',
      player_category: 'grade_a',
      height_cm: 186,
      weight_kg: 79,
      team_name: 'Tarapur Speedsters',
      district: 'Palghar',
      lot_number: 2,
      player_grade: 'Grade A',
      base_price: 15000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 2,
      bid_count: 0,
    },
  ];

  g.__multiSportAuctionStore__ = {
    tournaments: sampleTournaments,
    teams: sampleTeams,
    players: samplePlayers,
    bids: [],
    history: [],
    states: {}, // Scoped by tournament_id
  };

  return g.__multiSportAuctionStore__;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const tournamentUuidCache = new Map([
  ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'],
  ['pdvl-2026', '00000000-0000-0000-0000-000000000001'],
  ['00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'],
  ['pdfc-2026', '00000000-0000-0000-0000-000000000002'],
  ['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003'],
  ['ppkc-2026', '00000000-0000-0000-0000-000000000003'],
  ['00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004'],
  ['dkkc-2026', '00000000-0000-0000-0000-000000000004'],
  ['00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005'],
  ['psl-t20-2026', '00000000-0000-0000-0000-000000000005'],
  ['00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006'],
  ['dbss-2026', '00000000-0000-0000-0000-000000000006'],
]);

export function resolveTournamentUuidSync(identifier) {
  if (!identifier) return DEFAULT_TOURNAMENT_ID;
  const clean = String(identifier).trim().toLowerCase();
  if (tournamentUuidCache.has(clean)) return tournamentUuidCache.get(clean);
  if (UUID_REGEX.test(clean)) return clean;
  const store = initMultiSportMemoryStore();
  const match = store.tournaments.find(
    (t) => String(t.id).toLowerCase() === clean || String(t.slug).toLowerCase() === clean
  );
  return match ? match.id : clean;
}

export async function resolveTournamentUuid(identifier) {
  if (!identifier) return DEFAULT_TOURNAMENT_ID;
  const clean = String(identifier).trim().toLowerCase();

  if (tournamentUuidCache.has(clean)) {
    return tournamentUuidCache.get(clean);
  }

  if (UUID_REGEX.test(clean)) {
    tournamentUuidCache.set(clean, clean);
    return clean;
  }

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const res = await client.query(
          `SELECT id, slug FROM auction_tournaments WHERE LOWER(slug) = $1 OR id::text = $1 LIMIT 1`,
          [clean]
        );
        if (res.rows[0]) {
          const uuid = res.rows[0].id;
          tournamentUuidCache.set(clean, uuid);
          if (res.rows[0].slug) {
            tournamentUuidCache.set(res.rows[0].slug.toLowerCase(), uuid);
          }
          return uuid;
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB resolveTournamentUuid failed:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const match = store.tournaments.find(
    (t) => String(t.id).toLowerCase() === clean || String(t.slug).toLowerCase() === clean
  );
  if (match) {
    tournamentUuidCache.set(clean, match.id);
    return match.id;
  }

  return clean;
}

function getMemoryTournamentState(tournamentId = DEFAULT_TOURNAMENT_ID) {
  const targetId = resolveTournamentUuidSync(tournamentId);
  const store = initMultiSportMemoryStore();
  if (!store.states[targetId]) {
    const firstPlayer = store.players.find(
      (p) => String(p.tournament_id) === String(targetId) && (p.auction_status === 'on_hammer' || p.auction_status === 'queued')
    );
    if (firstPlayer) {
      firstPlayer.auction_status = 'on_hammer';
    }
    store.states[targetId] = {
      active_player_id: firstPlayer ? firstPlayer.id : null,
      current_highest_bid: 0,
      current_highest_team_id: null,
      bid_increment: 500,
      hammer_stage: 0,
      is_paused: false,
      last_action: firstPlayer ? `Now on hammer: ${firstPlayer.full_name} (Base ₹${Number(firstPlayer.base_price).toLocaleString('en-IN')})` : 'Auction system ready',
      last_notification: null,
      updated_at: new Date().toISOString(),
    };
  }
  return store.states[targetId];
}

async function hasDbConnection() {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return Boolean(connStr && connStr.trim().length > 0);
}

// ── TOURNAMENTS & SPORTS API ──────────────────────────────────────────────

export async function getSports() {
  const allSports = getAllSports();
  const tournaments = await getTournaments();

  // Attach live tournament counts to each sport
  return allSports.map((sport) => {
    const sportTournaments = tournaments.filter((t) => t.sport_id === sport.id);
    return {
      ...sport,
      tournamentsCount: sportTournaments.length,
      tournaments: sportTournaments,
    };
  });
}

export async function getTournaments(sportId = null) {
  if (sportId && sportId.toLowerCase() !== 'volleyball') {
    return [];
  }

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        let sql = `
          SELECT t.*,
            COUNT(DISTINCT tm.id)::int as teams_count,
            COUNT(DISTINCT p.id)::int as players_count,
            COUNT(DISTINCT p.id) FILTER (WHERE p.auction_status = 'sold')::int as sold_players_count
          FROM auction_tournaments t
          LEFT JOIN auction_teams tm ON tm.tournament_id = t.id AND tm.is_active = true
          LEFT JOIN auction_players p ON p.tournament_id = t.id
          WHERE LOWER(t.sport_id) = 'volleyball'
          GROUP BY t.id
          ORDER BY t.created_at DESC
        `;

        const res = await client.query(sql);
        return res.rows;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB getTournaments failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  let list = store.tournaments.filter((t) => t.sport_id.toLowerCase() === 'volleyball');

  return list.map((t) => {
    const teams = store.teams.filter((tm) => tm.tournament_id === t.id && tm.is_active !== false);
    const players = store.players.filter((p) => p.tournament_id === t.id);
    const sold = players.filter((p) => p.auction_status === 'sold');
    return {
      ...t,
      teams_count: teams.length,
      players_count: players.length,
      sold_players_count: sold.length,
    };
  });
}

export async function getTournamentById(tournamentId) {
  const cleanTarget = String(tournamentId || DEFAULT_TOURNAMENT_ID).trim();

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const res = await client.query(
          `SELECT t.*,
            COUNT(DISTINCT tm.id)::int as teams_count,
            COUNT(DISTINCT p.id)::int as players_count
          FROM auction_tournaments t
          LEFT JOIN auction_teams tm ON tm.tournament_id = t.id AND tm.is_active = true
          LEFT JOIN auction_players p ON p.tournament_id = t.id
          WHERE t.id::text = $1 OR LOWER(t.slug) = LOWER($1)
          GROUP BY t.id`,
          [cleanTarget]
        );
        if (res.rows[0]) {
          const sport = getSportById(res.rows[0].sport_id);
          return { ...res.rows[0], sportConfig: sport };
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB getTournamentById failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const match = store.tournaments.find(
    (t) => String(t.id).toLowerCase() === cleanTarget.toLowerCase() || String(t.slug).toLowerCase() === cleanTarget.toLowerCase()
  );

  if (!match) return null;

  const teams = store.teams.filter((t) => t.tournament_id === match.id && t.is_active !== false);
  const players = store.players.filter((p) => p.tournament_id === match.id);
  const sport = getSportById(match.sport_id);

  return {
    ...match,
    teams_count: teams.length,
    players_count: players.length,
    sportConfig: sport,
  };
}

export async function createTournament(data) {
  const sportId = String(data.sport_id || 'volleyball').trim().toLowerCase();
  const sport = getSportById(sportId);
  const tournamentName = String(data.tournament_name || '').trim();
  if (!tournamentName) throw new Error('Tournament name is required');

  const slug = String(
    data.slug || tournamentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  );
  const seasonYear = String(data.season_year || '2026/27').trim();
  const venue = data.venue?.trim() || null;
  const bannerUrl = data.banner_url?.trim() || null;
  const defaultPurse = Number(data.default_purse) || sport.defaultPurse || 100000;
  const minBidIncrement = Number(data.min_bid_increment) || sport.minBidIncrement || 500;
  const minSquadSize = Number(data.min_squad_size) || sport.minSquadSize || 8;
  const maxSquadSize = Number(data.max_squad_size) || sport.maxSquadSize || 15;
  const status = String(data.status || 'active').trim();

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const res = await client.query(
          `INSERT INTO auction_tournaments (
            sport_id, sport_name, tournament_name, slug, season_year, venue,
            banner_url, default_purse, min_bid_increment, min_squad_size,
            max_squad_size, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [
            sportId,
            sport.name,
            tournamentName,
            slug,
            seasonYear,
            venue,
            bannerUrl,
            defaultPurse,
            minBidIncrement,
            minSquadSize,
            maxSquadSize,
            status,
          ]
        );

        // Also guarantee an auction_state row for this tournament
        if (res.rows[0]) {
          await client.query(
            `INSERT INTO auction_state (tournament_id, current_highest_bid, bid_increment, hammer_stage, is_paused, last_action)
             VALUES ($1, 0, $2, 0, false, 'Auction System Ready')
             ON CONFLICT (id) DO NOTHING`,
            [res.rows[0].id, minBidIncrement]
          );
        }

        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB createTournament failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const newTourn = {
    id: `tourn-${Date.now()}`,
    sport_id: sportId,
    sport_name: sport.name,
    tournament_name: tournamentName,
    slug,
    season_year: seasonYear,
    venue,
    banner_url: bannerUrl,
    default_purse: defaultPurse,
    min_bid_increment: minBidIncrement,
    min_squad_size: minSquadSize,
    max_squad_size: maxSquadSize,
    status,
    created_at: new Date().toISOString(),
    teams_count: 0,
    players_count: 0,
  };

  store.tournaments.unshift(newTourn);
  getMemoryTournamentState(newTourn.id);
  return newTourn;
}

export async function updateTournament(tournamentId, data) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('ALTER TABLE auction_tournaments ADD COLUMN IF NOT EXISTS youtube_live_url TEXT');
        const res = await client.query(
          `UPDATE auction_tournaments SET
            tournament_name = COALESCE($2, tournament_name),
            season_year = COALESCE($3, season_year),
            venue = COALESCE($4, venue),
            default_purse = COALESCE($5, default_purse),
            min_bid_increment = COALESCE($6, min_bid_increment),
            min_squad_size = COALESCE($7, min_squad_size),
            max_squad_size = COALESCE($8, max_squad_size),
            status = COALESCE($9, status),
            youtube_live_url = CASE WHEN $10::text IS NOT NULL THEN $10::text ELSE youtube_live_url END,
            updated_at = NOW()
          WHERE id::text = $1 RETURNING *`,
          [
            String(tournamentId),
            data.tournament_name,
            data.season_year,
            data.venue,
            data.default_purse ? Number(data.default_purse) : null,
            data.min_bid_increment ? Number(data.min_bid_increment) : null,
            data.min_squad_size ? Number(data.min_squad_size) : null,
            data.max_squad_size ? Number(data.max_squad_size) : null,
            data.status,
            data.youtube_live_url !== undefined ? data.youtube_live_url : null,
          ]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB updateTournament failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const tourn = store.tournaments.find((t) => String(t.id) === String(tournamentId));
  if (tourn) {
    if (data.tournament_name) tourn.tournament_name = data.tournament_name;
    if (data.season_year) tourn.season_year = data.season_year;
    if (data.venue !== undefined) tourn.venue = data.venue;
    if (data.default_purse) tourn.default_purse = Number(data.default_purse);
    if (data.min_bid_increment) tourn.min_bid_increment = Number(data.min_bid_increment);
    if (data.min_squad_size) tourn.min_squad_size = Number(data.min_squad_size);
    if (data.max_squad_size) tourn.max_squad_size = Number(data.max_squad_size);
    if (data.status) tourn.status = data.status;
    if (data.youtube_live_url !== undefined) tourn.youtube_live_url = data.youtube_live_url;
  }
  return tourn;
}

export async function deleteTournament(tournamentId) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('DELETE FROM auction_tournaments WHERE id::text = $1', [String(tournamentId)]);
        return { success: true };
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB deleteTournament failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  store.tournaments = store.tournaments.filter((t) => String(t.id) !== String(tournamentId));
  store.teams = store.teams.filter((t) => String(t.tournament_id) !== String(tournamentId));
  store.players = store.players.filter((p) => String(p.tournament_id) !== String(tournamentId));
  delete store.states[tournamentId];
  return { success: true };
}

// ── TEAMS API ─────────────────────────────────────────────────────────────

export async function getAuctionTeams(tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const teamsRes = await client.query(
          `SELECT t.*, 
            COALESCE(json_agg(p.*) FILTER (WHERE p.id IS NOT NULL), '[]') as squad,
            COUNT(p.id)::int as squad_count
          FROM auction_teams t
          LEFT JOIN auction_players p ON p.sold_to_team_id = t.id
          WHERE t.is_active = true
            AND (t.tournament_id::text = $1 OR ($1 = '${DEFAULT_TOURNAMENT_ID}' AND t.tournament_id IS NULL))
          GROUP BY t.id
          ORDER BY t.display_order ASC, t.team_name ASC`,
          [String(targetTournamentId)]
        );
        return teamsRes.rows;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] Falling back to memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const filteredTeams = store.teams.filter(
    (t) => String(t.tournament_id) === String(targetTournamentId) && t.is_active !== false
  );

  return filteredTeams.map((t) => {
    const squad = store.players.filter((p) => p.sold_to_team_id === t.id);
    return { ...t, squad, squad_count: squad.length };
  });
}

export async function createAuctionTeam(data, tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId || data.tournament_id);
  const initialPurse = Number(data.initial_purse) || 100000;
  const teamCode = String(data.team_code || '').trim().toUpperCase();
  const teamName = String(data.team_name || '').trim();

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const res = await client.query(
          `INSERT INTO auction_teams (
            tournament_id, team_name, team_code, owner_name, coach_name, logo_url, primary_color,
            initial_purse, remaining_purse, min_squad_size, max_squad_size
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10) RETURNING *`,
          [
            targetTournamentId,
            teamName,
            teamCode,
            data.owner_name?.trim() || null,
            data.coach_name?.trim() || null,
            data.logo_url?.trim() || null,
            data.primary_color || '#0d6efd',
            initialPurse,
            Number(data.min_squad_size) || 8,
            Number(data.max_squad_size) || 12,
          ]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB insert team failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const newTeam = {
    id: `team-${Date.now()}`,
    tournament_id: targetTournamentId,
    team_name: teamName,
    team_code: teamCode,
    owner_name: data.owner_name?.trim() || '',
    coach_name: data.coach_name?.trim() || '',
    logo_url: data.logo_url?.trim() || '',
    primary_color: data.primary_color || '#0d6efd',
    initial_purse: initialPurse,
    remaining_purse: initialPurse,
    min_squad_size: Number(data.min_squad_size) || 8,
    max_squad_size: Number(data.max_squad_size) || 12,
    display_order: store.teams.length + 1,
    is_active: true,
    squad: [],
    squad_count: 0,
  };
  store.teams.push(newTeam);
  return newTeam;
}

export async function updateAuctionTeam(teamId, data) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('ALTER TABLE auction_teams ADD COLUMN IF NOT EXISTS pool VARCHAR(50)');
        const res = await client.query(
          `UPDATE auction_teams SET
            team_name = COALESCE($2, team_name),
            owner_name = COALESCE($3, owner_name),
            coach_name = COALESCE($4, coach_name),
            initial_purse = COALESCE($5, initial_purse),
            remaining_purse = COALESCE($6, remaining_purse),
            primary_color = COALESCE($7, primary_color),
            pool = CASE WHEN $8::text IS NOT NULL THEN $8::text ELSE pool END,
            updated_at = NOW()
          WHERE id::text = $1 RETURNING *`,
          [
            String(teamId),
            data.team_name,
            data.owner_name,
            data.coach_name,
            data.initial_purse ? Number(data.initial_purse) : null,
            data.remaining_purse ? Number(data.remaining_purse) : null,
            data.primary_color,
            data.pool !== undefined ? data.pool : null,
          ]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB update team failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const team = store.teams.find((t) => String(t.id) === String(teamId));
  if (team) {
    if (data.team_name !== undefined) team.team_name = data.team_name;
    if (data.owner_name !== undefined) team.owner_name = data.owner_name;
    if (data.coach_name !== undefined) team.coach_name = data.coach_name;
    if (data.initial_purse !== undefined) team.initial_purse = Number(data.initial_purse);
    if (data.remaining_purse !== undefined) team.remaining_purse = Number(data.remaining_purse);
    if (data.primary_color !== undefined) team.primary_color = data.primary_color;
    if (data.pool !== undefined) team.pool = data.pool;
  }
  return team;
}

export async function updateTournamentPools(tournamentId, poolAssignments = []) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);

  // Normalize pool assignments from either object { 'Pool A': ['id1', 'id2'] } or array [{ teamId, pool }]
  let list = [];
  if (Array.isArray(poolAssignments)) {
    list = poolAssignments;
  } else if (poolAssignments && typeof poolAssignments === 'object') {
    list = Object.entries(poolAssignments).flatMap(([poolName, teamIds]) =>
      (Array.isArray(teamIds) ? teamIds : []).map((tId) => ({
        teamId: typeof tId === 'object' ? tId.id : tId,
        pool: poolName,
      }))
    );
  }

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('ALTER TABLE auction_teams ADD COLUMN IF NOT EXISTS pool VARCHAR(50)');
        for (const item of list) {
          if (item && item.teamId) {
            await client.query('UPDATE auction_teams SET pool = $1 WHERE id::text = $2', [
              item.pool || null,
              String(item.teamId),
            ]);
          }
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB updateTournamentPools failed:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  for (const item of list) {
    if (item && item.teamId) {
      const team = store.teams.find((t) => String(t.id) === String(item.teamId));
      if (team) {
        team.pool = item.pool || null;
      }
    }
  }

  return getAuctionTeams(targetTournamentId);
}

export async function deleteAuctionTeam(teamId) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('UPDATE auction_teams SET is_active = false WHERE id::text = $1', [String(teamId)]);
        return { success: true };
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB delete team failed:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const team = store.teams.find((t) => String(t.id) === String(teamId));
  if (team) team.is_active = false;
  return { success: true };
}

// ── PLAYERS API ───────────────────────────────────────────────────────────

export async function getAuctionPlayers(filters = {}, tournamentId = null) {
  const { status, lot, position, category, player_category, sport_id, sportId } = filters;
  const targetTournamentId = await resolveTournamentUuid(tournamentId || filters.tournament_id);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        // Look up tournament sport to isolate players per tournament/sport
        let tournSportId = null;
        const tRes = await client.query('SELECT sport_id FROM auction_tournaments WHERE id::text = $1', [String(targetTournamentId)]);
        if (tRes.rows[0]) {
          tournSportId = tRes.rows[0].sport_id;
        }

        let query = `
          SELECT p.*, t.team_name as sold_team_name, t.team_code as sold_team_code, t.primary_color as sold_team_color
          FROM auction_players p
          LEFT JOIN auction_teams t ON t.id = p.sold_to_team_id
          WHERE (
            p.tournament_id::text = $1 
            OR ($1 = '${DEFAULT_TOURNAMENT_ID}' AND p.tournament_id IS NULL)
            OR (p.tournament_id IS NULL AND $2::text IS NOT NULL AND LOWER(p.sport_id) = LOWER($2))
          )
        `;
        const params = [String(targetTournamentId), tournSportId];

        if (status) {
          params.push(status);
          query += ` AND p.auction_status = $${params.length}`;
        }
        if (lot) {
          params.push(Number(lot));
          query += ` AND p.lot_number = $${params.length}`;
        }
        if (position) {
          params.push(position);
          query += ` AND p.playing_position = $${params.length}`;
        }
        const cat = category || player_category;
        if (cat) {
          params.push(cat.toLowerCase());
          const catIdx = `$${params.length}`;
          query += ` AND (LOWER(p.player_category) = ${catIdx} OR p.player_category ILIKE '%' || ${catIdx} || '%')`;
        }
        const sp = sport_id || sportId;
        if (sp) {
          params.push(sp.toLowerCase());
          query += ` AND LOWER(p.sport_id) = $${params.length}`;
        }

        query += ' ORDER BY p.bidding_order ASC, p.created_at ASC';

        const res = await client.query(query, params);
        return res.rows;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB get players failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  return store.players.filter((p) => {
    if (String(p.tournament_id) !== String(targetTournamentId)) return false;
    if (status && p.auction_status !== status) return false;
    if (lot && p.lot_number !== Number(lot)) return false;
    if (position && p.playing_position !== position) return false;
    const cat = category || player_category;
    if (cat && !String(p.player_category || '').toLowerCase().includes(cat.toLowerCase())) return false;
    return true;
  });
}

export async function createAuctionPlayer(data, tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId || data.tournament_id);

  let playerSportId = data.sport_id || null;
  if (!playerSportId && await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const tRes = await client.query('SELECT sport_id FROM auction_tournaments WHERE id::text = $1', [String(targetTournamentId)]);
        if (tRes.rows[0]) playerSportId = tRes.rows[0].sport_id;
      } finally {
        client.release();
      }
    } catch {
      // ignore
    }
  }
  if (!playerSportId) playerSportId = 'volleyball';

  const playerData = {
    tournament_id: targetTournamentId,
    sport_id: playerSportId,
    full_name: String(data.full_name || '').trim(),
    playing_position: String(data.playing_position || 'general_player').trim(),
    player_category: String(data.player_category || 'open_category').trim(),
    height_cm: data.height_cm ? Number(data.height_cm) : null,
    weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
    team_name: String(data.team_name || '').trim() || null,
    district: String(data.district || 'Palghar').trim(),
    lot_number: Number(data.lot_number) || 1,
    player_grade: String(data.player_grade || 'Grade A').trim(),
    base_price: Number(data.base_price) || 1000,
    photo_url: String(data.photo_url || '').trim() || null,
  };

  if (!playerData.full_name) throw new Error('Player full_name is required');

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const orderRes = await client.query(
          'SELECT COALESCE(MAX(bidding_order), 0) + 1 AS next_order FROM auction_players WHERE tournament_id::text = $1',
          [String(targetTournamentId)]
        );
        const bidding_order = orderRes.rows[0]?.next_order || 1;

        const res = await client.query(
          `INSERT INTO auction_players (
            tournament_id, sport_id, full_name, photo_url, playing_position, player_category,
            height_cm, weight_kg, team_name, district, lot_number,
            player_grade, base_price, bidding_order, auction_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'queued')
          RETURNING *`,
          [
            targetTournamentId,
            playerData.sport_id,
            playerData.full_name,
            playerData.photo_url,
            playerData.playing_position,
            playerData.player_category,
            playerData.height_cm,
            playerData.weight_kg,
            playerData.team_name,
            playerData.district,
            playerData.lot_number,
            playerData.player_grade,
            playerData.base_price,
            bidding_order,
          ]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB create player failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const tournPlayers = store.players.filter((p) => String(p.tournament_id) === String(targetTournamentId));
  const newPlayer = {
    id: `player-${Date.now()}`,
    ...playerData,
    current_bid: 0,
    sold_price: null,
    sold_to_team_id: null,
    auction_status: 'queued',
    bidding_order: tournPlayers.length + 1,
    bid_count: 0,
    created_at: new Date().toISOString(),
  };
  store.players.push(newPlayer);
  return newPlayer;
}

export async function updateAuctionPlayer(playerId, data) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const res = await client.query(
          `UPDATE auction_players SET
            base_price = COALESCE($2, base_price),
            lot_number = COALESCE($3, lot_number),
            player_grade = COALESCE($4, player_grade),
            bidding_order = COALESCE($5, bidding_order),
            photo_url = COALESCE($6, photo_url),
            full_name = COALESCE($7, full_name),
            playing_position = COALESCE($8, playing_position),
            player_category = COALESCE($9, player_category),
            team_name = COALESCE($10, team_name),
            district = COALESCE($11, district),
            height_cm = COALESCE($12, height_cm),
            weight_kg = COALESCE($13, weight_kg),
            sport_id = COALESCE($14, sport_id)
          WHERE id::text = $1 RETURNING *`,
          [
            String(playerId),
            data.base_price ? Number(data.base_price) : null,
            data.lot_number ? Number(data.lot_number) : null,
            data.player_grade || null,
            data.bidding_order ? Number(data.bidding_order) : null,
            data.photo_url !== undefined ? data.photo_url : null,
            data.full_name || null,
            data.playing_position || null,
            data.player_category || null,
            data.team_name || null,
            data.district || null,
            data.height_cm ? Number(data.height_cm) : null,
            data.weight_kg ? Number(data.weight_kg) : null,
            data.sport_id || null,
          ]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB update player failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const player = store.players.find((p) => String(p.id) === String(playerId));
  if (player) {
    if (data.base_price !== undefined) player.base_price = Number(data.base_price);
    if (data.lot_number !== undefined) player.lot_number = Number(data.lot_number);
    if (data.player_grade !== undefined) player.player_grade = data.player_grade;
    if (data.bidding_order !== undefined) player.bidding_order = Number(data.bidding_order);
    if (data.photo_url !== undefined) player.photo_url = data.photo_url;
    if (data.full_name !== undefined) player.full_name = data.full_name;
    if (data.playing_position !== undefined) player.playing_position = data.playing_position;
    if (data.player_category !== undefined) player.player_category = data.player_category;
    if (data.team_name !== undefined) player.team_name = data.team_name;
    if (data.district !== undefined) player.district = data.district;
    if (data.height_cm !== undefined) player.height_cm = Number(data.height_cm);
    if (data.weight_kg !== undefined) player.weight_kg = Number(data.weight_kg);
    if (data.sport_id !== undefined) player.sport_id = data.sport_id;
  }
  return player;
}

export async function deleteAuctionPlayer(playerId) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('DELETE FROM auction_players WHERE id::text = $1', [String(playerId)]);
        return { success: true };
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB delete player failed:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  store.players = store.players.filter((p) => String(p.id) !== String(playerId));
  return { success: true };
}

// ── IMPORT FROM REGISTRATIONS ─────────────────────────────────────────────

export async function importFromRegistrations(tournamentId = DEFAULT_TOURNAMENT_ID) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'volleyball_registrations'
          ) AS exists
        `);

        if (!tableCheck.rows[0]?.exists) {
          return { importedCount: 0, message: 'volleyball_registrations table not found. Use manual player addition.' };
        }

        const insertRes = await client.query(`
          INSERT INTO auction_players (
            tournament_id, registration_id, full_name, photo_url, playing_position, player_category,
            height_cm, weight_kg, team_name, district, base_price, player_grade, auction_status
          )
          SELECT 
            $1, r.id, r.full_name, r.photo_url, r.playing_position, r.player_category,
            r.height_cm, r.weight_kg, r.team_name, r.district,
            CASE 
              WHEN r.player_category = 'icon_player' THEN 5000
              WHEN r.player_category = 'palghar_open' THEN 3000
              ELSE 1500
            END as base_price,
            CASE 
              WHEN r.player_category = 'icon_player' THEN 'Icon'
              WHEN r.player_category = 'palghar_open' THEN 'Grade A'
              ELSE 'Grade B'
            END as player_grade,
            'queued' as auction_status
          FROM volleyball_registrations r
          WHERE r.registration_status = 'approved'
            AND r.id NOT IN (SELECT registration_id FROM auction_players WHERE registration_id IS NOT NULL)
          RETURNING *;
        `, [String(tournamentId)]);
        return { importedCount: insertRes.rowCount || 0 };
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB import from registrations failed:', err.message);
      return { importedCount: 0, message: err.message };
    }
  }

  return { importedCount: 0, message: 'Registrations table not available in offline/memory mode.' };
}

// ── LIVE AUCTION ENGINE ───────────────────────────────────────────────────

export async function getLiveAuctionState(tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);
  const teams = await getAuctionTeams(targetTournamentId);
  const tournament = await getTournamentById(targetTournamentId);

  let state = null;
  let activePlayer = null;
  let recentBids = [];

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const stateRes = await client.query(
          `SELECT * FROM auction_state WHERE tournament_id::text = $1 OR ($1 = '${DEFAULT_TOURNAMENT_ID}' AND tournament_id IS NULL) LIMIT 1`,
          [String(targetTournamentId)]
        );
        state = stateRes.rows[0] || null;

        if (state?.active_player_id) {
          const playerRes = await client.query('SELECT * FROM auction_players WHERE id = $1', [state.active_player_id]);
          activePlayer = playerRes.rows[0] || null;

          const bidsRes = await client.query(`
            SELECT b.*, t.team_name, t.team_code, t.primary_color
            FROM auction_bids b
            JOIN auction_teams t ON t.id = b.team_id
            WHERE b.player_id = $1
            ORDER BY b.placed_at DESC
            LIMIT 10
          `, [state.active_player_id]);
          recentBids = bidsRes.rows;
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB get live state failed, using memory store:', err.message);
    }
  }

  if (!state) {
    state = getMemoryTournamentState(targetTournamentId);
    const store = initMultiSportMemoryStore();
    store.players.forEach((p, idx) => {
      if (!p.photo_url) {
        p.photo_url = DEFAULT_PLAYER_PHOTOS[p.id] || `/images/volleyball/image${(idx % 6) + 4}.jpeg`;
      }
    });
    activePlayer = store.players.find((p) => String(p.id) === String(state.active_player_id)) || null;
    recentBids = store.bids
      .filter((b) => String(b.player_id) === String(state.active_player_id))
      .slice(-10)
      .reverse();
  }

  if (activePlayer && !activePlayer.photo_url) {
    activePlayer.photo_url = DEFAULT_PLAYER_PHOTOS[activePlayer.id] || '/images/volleyball/image4.jpeg';
  }

  const highestTeam = teams.find((t) => String(t.id) === String(state.current_highest_team_id)) || null;
  const lastNotification = state?.last_notification || g.__auctionNotifications__[targetTournamentId] || null;
  const history = g.__auctionNotificationHistory__[targetTournamentId] || [];

  // Compute tournament official top 10 sold players / bids
  const top10SoldPlayers = teams
    .flatMap((team) =>
      (team.squad || []).map((player) => ({
        ...player,
        winning_team_name: team.team_name,
        winning_team_code: team.team_code,
        winning_team_color: team.primary_color || '#0d6efd',
        winning_team_owner: team.owner_name,
        winning_team_id: team.id,
      }))
    )
    .filter((p) => p.sold_price && Number(p.sold_price) > 0)
    .sort((a, b) => {
      const priceDiff = Number(b.sold_price) - Number(a.sold_price);
      if (priceDiff !== 0) return priceDiff;
      return Number(b.base_price || 0) - Number(a.base_price || 0);
    })
    .slice(0, 10);

  return {
    state,
    tournament,
    youtubeLiveUrl: tournament?.youtube_live_url || '',
    activePlayer,
    highestTeam,
    recentBids,
    top10SoldPlayers,
    teams,
    lastNotification,
    notificationHistory: history.slice(0, 10),
    serverTime: new Date().toISOString(),
  };
}

export async function setActivePlayer(playerId, tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const playerRes = await client.query('SELECT * FROM auction_players WHERE id::text = $1', [String(playerId)]);
        const player = playerRes.rows[0];
        if (!player) throw new Error('Player not found');

        const playerTournId = player.tournament_id || targetTournamentId;

        try {
          await client.query('BEGIN');
          await client.query(
            "UPDATE auction_players SET auction_status = 'queued' WHERE auction_status = 'on_hammer' AND id::text != $1 AND tournament_id::text = $2",
            [String(playerId), String(playerTournId)]
          );
          await client.query("UPDATE auction_players SET auction_status = 'on_hammer' WHERE id::text = $1", [String(playerId)]);
          await client.query(`
            UPDATE auction_state SET
              active_player_id = $1,
              current_highest_bid = 0,
              current_highest_team_id = NULL,
              hammer_stage = 0,
              last_action = $2,
              updated_at = NOW()
            WHERE tournament_id::text = $3 OR ($3 = '${DEFAULT_TOURNAMENT_ID}' AND tournament_id IS NULL)
          `, [String(playerId), `Now on hammer: ${player.full_name} (Base ₹${Number(player.base_price).toLocaleString()})`, String(playerTournId)]);
          await client.query('COMMIT');

          return { success: true, player };
        } catch (txErr) {
          await client.query('ROLLBACK');
          throw txErr;
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB set active player failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const player = store.players.find((p) => String(p.id) === String(playerId));
  if (!player) throw new Error('Player not found');

  const resolvedTournId = player.tournament_id || targetTournamentId;
  const state = getMemoryTournamentState(resolvedTournId);

  store.players.forEach((p) => {
    if (String(p.tournament_id) === String(resolvedTournId) && p.auction_status === 'on_hammer' && String(p.id) !== String(playerId)) {
      p.auction_status = 'queued';
    }
  });

  player.auction_status = 'on_hammer';
  state.active_player_id = player.id;
  state.current_highest_bid = 0;
  state.current_highest_team_id = null;
  state.hammer_stage = 0;
  state.last_action = `Now on hammer: ${player.full_name} (Base ₹${Number(player.base_price).toLocaleString()})`;
  state.updated_at = new Date().toISOString();

  return { success: true, player };
}

export async function placeBid({ teamId, bidAmount, tournamentId = null }) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);
  const liveState = await getLiveAuctionState(targetTournamentId);
  const player = liveState.activePlayer;
  if (!player) throw new Error('No player is currently on the auction podium.');

  const team = liveState.teams.find((t) => String(t.id) === String(teamId));
  if (!team) throw new Error('Invalid team selected.');

  const basePrice = Number(player.base_price) || 1000;
  const currentBid = Number(liveState.state.current_highest_bid) || 0;
  const increment = Number(liveState.state.bid_increment || liveState.tournament?.min_bid_increment || 500);
  const nextMinimum = currentBid === 0 ? basePrice : currentBid + increment;

  const finalBidAmount = bidAmount ? Math.max(Number(bidAmount), nextMinimum) : nextMinimum;

  if (Number(team.remaining_purse) < finalBidAmount) {
    throw new Error(`Insufficient budget. ${team.team_name} has ₹${team.remaining_purse.toLocaleString()} remaining, but bid is ₹${finalBidAmount.toLocaleString()}.`);
  }

  if (team.squad_count >= team.max_squad_size) {
    throw new Error(`${team.team_name} has already reached the maximum squad limit of ${team.max_squad_size} players.`);
  }

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO auction_bids (player_id, team_id, bid_amount) VALUES ($1, $2, $3)`,
          [player.id, team.id, finalBidAmount]
        );
        await client.query(
          `UPDATE auction_players SET current_bid = $1, bid_count = bid_count + 1 WHERE id = $2`,
          [finalBidAmount, player.id]
        );
        await client.query(
          `UPDATE auction_state SET
            current_highest_bid = $1,
            current_highest_team_id = $2,
            hammer_stage = 0,
            last_action = $3,
            updated_at = NOW()
          WHERE tournament_id::text = $4 OR ($4 = '${DEFAULT_TOURNAMENT_ID}' AND tournament_id IS NULL)`,
          [finalBidAmount, team.id, `Bid: ₹${finalBidAmount.toLocaleString()} by ${team.team_code}`, String(targetTournamentId)]
        );
        await client.query('COMMIT');
        return { success: true, bidAmount: finalBidAmount, team };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB bid transaction failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const memPlayer = store.players.find((p) => String(p.id) === String(player.id));
  if (memPlayer) {
    memPlayer.current_bid = finalBidAmount;
    memPlayer.bid_count = (memPlayer.bid_count || 0) + 1;
  }

  store.bids.push({
    id: `bid-${Date.now()}`,
    player_id: player.id,
    team_id: team.id,
    bid_amount: finalBidAmount,
    placed_at: new Date().toISOString(),
    team_name: team.team_name,
    team_code: team.team_code,
    primary_color: team.primary_color,
  });

  const state = getMemoryTournamentState(targetTournamentId);
  state.current_highest_bid = finalBidAmount;
  state.current_highest_team_id = team.id;
  state.hammer_stage = 0;
  state.last_action = `Bid: ₹${finalBidAmount.toLocaleString()} by ${team.team_code}`;
  state.updated_at = new Date().toISOString();

  return { success: true, bidAmount: finalBidAmount, team };
}

export async function advanceHammer(stage, tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);
  const allowed = [0, 1, 2, 3];
  if (!allowed.includes(stage)) throw new Error('Invalid hammer stage');

  let actionText = 'Podium Open';
  if (stage === 1) actionText = 'Going ONCE...';
  if (stage === 2) actionText = 'Going TWICE...';
  if (stage === 3) actionText = 'SOLD!';

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query(
          `UPDATE auction_state SET hammer_stage = $1, last_action = $2, updated_at = NOW()
           WHERE tournament_id::text = $3 OR ($3 = '${DEFAULT_TOURNAMENT_ID}' AND tournament_id IS NULL)`,
          [stage, actionText, String(targetTournamentId)]
        );
        return { success: true, stage, actionText };
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB hammer stage failed, using memory store:', err.message);
    }
  }

  const state = getMemoryTournamentState(targetTournamentId);
  state.hammer_stage = stage;
  state.last_action = actionText;
  state.updated_at = new Date().toISOString();

  return { success: true, stage, actionText };
}

export async function finalizeSale(tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);
  const liveState = await getLiveAuctionState(targetTournamentId);
  const player = liveState.activePlayer;
  const team = liveState.highestTeam;
  const winningBid = Number(liveState.state.current_highest_bid);

  if (!player || !team || winningBid <= 0) {
    throw new Error('Cannot finalize sale without an active player, bidding team, and positive bid.');
  }

  const soldMessage = `${player.full_name} sold to ${team.team_name} at ₹${winningBid.toLocaleString()}`;

  const soldNotification = {
    id: `notif-${Date.now()}`,
    type: 'sold',
    tournamentId: targetTournamentId,
    message: soldMessage,
    playerName: player.full_name,
    teamName: team.team_name,
    teamCode: team.team_code,
    teamColor: team.primary_color || '#0d6efd',
    price: winningBid,
    formattedPrice: `₹${winningBid.toLocaleString()}`,
    photoUrl: player.photo_url || player.photo || player.image_url || '',
    photo_url: player.photo_url || player.photo || player.image_url || '',
    category: player.player_category || '',
    playingPosition: player.playing_position || '',
    playerGrade: player.player_grade || '',
    lotNumber: player.lot_number || 1,
    timestamp: new Date().toISOString(),
  };

  g.__auctionNotifications__[targetTournamentId] = soldNotification;
  if (!g.__auctionNotificationHistory__[targetTournamentId]) g.__auctionNotificationHistory__[targetTournamentId] = [];
  g.__auctionNotificationHistory__[targetTournamentId].unshift(soldNotification);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE auction_teams SET remaining_purse = remaining_purse - $1, updated_at = NOW() WHERE id = $2`,
          [winningBid, team.id]
        );
        await client.query(
          `UPDATE auction_players SET 
            auction_status = 'sold',
            sold_price = $1,
            sold_to_team_id = $2,
            auctioned_at = NOW()
          WHERE id = $3`,
          [winningBid, team.id, player.id]
        );
        await client.query(
          `UPDATE auction_state SET
            active_player_id = NULL,
            current_highest_bid = 0,
            current_highest_team_id = NULL,
            hammer_stage = 0,
            last_action = $1,
            last_notification = $2::jsonb,
            updated_at = NOW()
          WHERE tournament_id::text = $3 OR ($3 = '${DEFAULT_TOURNAMENT_ID}' AND tournament_id IS NULL)`,
          [soldMessage, JSON.stringify(soldNotification), String(targetTournamentId)]
        );
        await client.query('COMMIT');
        return { success: true, player, team, winningBid, message: soldMessage, notification: soldNotification };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB finalize sale failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const memTeam = store.teams.find((t) => String(t.id) === String(team.id));
  if (memTeam) {
    memTeam.remaining_purse = Math.max(0, memTeam.remaining_purse - winningBid);
  }

  const memPlayer = store.players.find((p) => String(p.id) === String(player.id));
  if (memPlayer) {
    memPlayer.auction_status = 'sold';
    memPlayer.sold_price = winningBid;
    memPlayer.sold_to_team_id = team.id;
    memPlayer.auctioned_at = new Date().toISOString();
  }

  store.history.push({
    type: 'sale',
    tournament_id: targetTournamentId,
    player_id: player.id,
    team_id: team.id,
    amount: winningBid,
    timestamp: new Date().toISOString(),
  });

  const state = getMemoryTournamentState(targetTournamentId);
  state.active_player_id = null;
  state.current_highest_bid = 0;
  state.current_highest_team_id = null;
  state.hammer_stage = 0;
  state.last_action = soldMessage;
  state.last_notification = soldNotification;
  state.updated_at = new Date().toISOString();

  return { success: true, player, team, winningBid, message: soldMessage, notification: soldNotification };
}

export async function markPlayerUnsold(tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);
  const liveState = await getLiveAuctionState(targetTournamentId);
  const player = liveState.activePlayer;
  if (!player) throw new Error('No player is currently on the auction podium.');

  const unsoldMessage = `${player.full_name} remained UNSOLD and moved to the unsold pool.`;

  const unsoldNotification = {
    id: `notif-${Date.now()}`,
    type: 'unsold',
    tournamentId: targetTournamentId,
    message: unsoldMessage,
    playerName: player.full_name,
    photoUrl: player.photo_url || '',
    playingPosition: player.playing_position || '',
    playerGrade: player.player_grade || '',
    basePrice: player.base_price || 1000,
    timestamp: new Date().toISOString(),
  };

  g.__auctionNotifications__[targetTournamentId] = unsoldNotification;
  if (!g.__auctionNotificationHistory__[targetTournamentId]) g.__auctionNotificationHistory__[targetTournamentId] = [];
  g.__auctionNotificationHistory__[targetTournamentId].unshift(unsoldNotification);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE auction_players SET auction_status = 'unsold', auctioned_at = NOW() WHERE id = $1`,
          [player.id]
        );
        await client.query(
          `UPDATE auction_state SET
            active_player_id = NULL,
            current_highest_bid = 0,
            current_highest_team_id = NULL,
            hammer_stage = 0,
            last_action = $1,
            last_notification = $2::jsonb,
            updated_at = NOW()
          WHERE tournament_id::text = $3 OR ($3 = '${DEFAULT_TOURNAMENT_ID}' AND tournament_id IS NULL)`,
          [unsoldMessage, JSON.stringify(unsoldNotification), String(targetTournamentId)]
        );
        await client.query('COMMIT');
        return { success: true, player, message: unsoldMessage, notification: unsoldNotification };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB mark unsold failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const memPlayer = store.players.find((p) => String(p.id) === String(player.id));
  if (memPlayer) {
    memPlayer.auction_status = 'unsold';
    memPlayer.auctioned_at = new Date().toISOString();
  }

  const state = getMemoryTournamentState(targetTournamentId);
  state.active_player_id = null;
  state.current_highest_bid = 0;
  state.current_highest_team_id = null;
  state.hammer_stage = 0;
  state.last_action = unsoldMessage;
  state.last_notification = unsoldNotification;
  state.updated_at = new Date().toISOString();

  return { success: true, player, message: unsoldMessage, notification: unsoldNotification };
}

export async function undoLastAction(tournamentId = null) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const recentRes = await client.query(`
          SELECT p.*, t.team_name, t.team_code
          FROM auction_players p
          LEFT JOIN auction_teams t ON t.id = p.sold_to_team_id
          WHERE p.auction_status IN ('sold', 'unsold') AND p.auctioned_at IS NOT NULL
            AND (p.tournament_id::text = $1 OR ($1 = '${DEFAULT_TOURNAMENT_ID}' AND p.tournament_id IS NULL))
          ORDER BY p.auctioned_at DESC
          LIMIT 1
        `, [String(targetTournamentId)]);

        if (recentRes.rows.length === 0) {
          return { success: false, message: 'No recorded sales or outcomes to undo in database.' };
        }

        const lastPlayer = recentRes.rows[0];
        await client.query('BEGIN');

        let undoMsg = '';
        const undoNotification = {
          id: `notif-${Date.now()}`,
          type: 'undo',
          tournamentId: targetTournamentId,
          timestamp: new Date().toISOString(),
        };

        if (lastPlayer.auction_status === 'sold') {
          const soldAmount = Number(lastPlayer.sold_price) || 0;
          const soldTeamId = lastPlayer.sold_to_team_id;

          if (soldTeamId && soldAmount > 0) {
            await client.query(
              `UPDATE auction_teams SET remaining_purse = remaining_purse + $1, updated_at = NOW() WHERE id = $2`,
              [soldAmount, soldTeamId]
            );
          }

          await client.query(
            `UPDATE auction_players SET 
              auction_status = 'on_hammer',
              sold_price = NULL,
              sold_to_team_id = NULL,
              auctioned_at = NULL
            WHERE id = $1`,
            [lastPlayer.id]
          );

          undoMsg = `Reverted sale of ${lastPlayer.full_name}. Purse ₹${soldAmount.toLocaleString()} restored to ${lastPlayer.team_name || 'team'}.`;
          undoNotification.message = undoMsg;

          await client.query(
            `UPDATE auction_state SET
              active_player_id = $1,
              current_highest_bid = $2,
              current_highest_team_id = $3,
              hammer_stage = 0,
              last_action = $4,
              last_notification = $5::jsonb,
              updated_at = NOW()
            WHERE tournament_id::text = $6 OR ($6 = '${DEFAULT_TOURNAMENT_ID}' AND tournament_id IS NULL)`,
            [lastPlayer.id, soldAmount, soldTeamId, undoMsg, JSON.stringify(undoNotification), String(targetTournamentId)]
          );
        } else if (lastPlayer.auction_status === 'unsold') {
          await client.query(
            `UPDATE auction_players SET 
              auction_status = 'on_hammer',
              auctioned_at = NULL
            WHERE id = $1`,
            [lastPlayer.id]
          );

          undoMsg = `Reverted unsold status of ${lastPlayer.full_name}. Back on hammer podium.`;
          undoNotification.message = undoMsg;

          await client.query(
            `UPDATE auction_state SET
              active_player_id = $1,
              current_highest_bid = 0,
              current_highest_team_id = NULL,
              hammer_stage = 0,
              last_action = $2,
              last_notification = $3::jsonb,
              updated_at = NOW()
            WHERE tournament_id::text = $4 OR ($4 = '${DEFAULT_TOURNAMENT_ID}' AND tournament_id IS NULL)`,
            [lastPlayer.id, undoMsg, JSON.stringify(undoNotification), String(targetTournamentId)]
          );
        }

        await client.query('COMMIT');

        g.__auctionNotifications__[targetTournamentId] = undoNotification;
        if (!g.__auctionNotificationHistory__[targetTournamentId]) g.__auctionNotificationHistory__[targetTournamentId] = [];
        g.__auctionNotificationHistory__[targetTournamentId].unshift(undoNotification);

        return { success: true, message: undoMsg, notification: undoNotification };
      } catch (err) {
        await client.query('ROLLBACK');
        console.warn('[auction-db] DB undo failed:', err.message);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB connection error during undo:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const lastHistoryIndex = store.history
    .map((h, i) => ({ h, i }))
    .filter((x) => String(x.h.tournament_id) === String(targetTournamentId))
    .pop();

  if (!lastHistoryIndex) {
    return { success: false, message: 'No recorded action to undo for this tournament.' };
  }

  const [lastHistory] = store.history.splice(lastHistoryIndex.i, 1);

  if (lastHistory.type === 'sale') {
    const team = store.teams.find((t) => String(t.id) === String(lastHistory.team_id));
    const player = store.players.find((p) => String(p.id) === String(lastHistory.player_id));

    if (team) team.remaining_purse += lastHistory.amount;
    if (player) {
      player.auction_status = 'on_hammer';
      player.sold_price = null;
      player.sold_to_team_id = null;
    }

    const undoMsg = `Reverted sale of ${player?.full_name || 'player'}. Purse restored to ${team?.team_name || 'team'}.`;

    const undoNotification = {
      id: `notif-${Date.now()}`,
      type: 'undo',
      tournamentId: targetTournamentId,
      message: undoMsg,
      timestamp: new Date().toISOString(),
    };
    g.__auctionNotifications__[targetTournamentId] = undoNotification;
    if (!g.__auctionNotificationHistory__[targetTournamentId]) g.__auctionNotificationHistory__[targetTournamentId] = [];
    g.__auctionNotificationHistory__[targetTournamentId].unshift(undoNotification);

    const state = getMemoryTournamentState(targetTournamentId);
    state.active_player_id = lastHistory.player_id;
    state.current_highest_bid = lastHistory.amount;
    state.current_highest_team_id = lastHistory.team_id;
    state.hammer_stage = 0;
    state.last_action = undoMsg;
    state.last_notification = undoNotification;
    state.updated_at = new Date().toISOString();

    return { success: true, message: undoMsg, notification: undoNotification };
  }

  return { success: false, message: 'Nothing to undo.' };
}

// ── REVERT SALE & STATUS CONTROLS ─────────────────────────────────────────

export async function markSoldPlayerUnsold(playerId) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('BEGIN');
        const pRes = await client.query('SELECT * FROM auction_players WHERE id::text = $1', [String(playerId)]);
        const player = pRes.rows[0];
        if (!player) throw new Error('Player not found');

        const soldAmount = Number(player.sold_price) || 0;
        const soldTeamId = player.sold_to_team_id;

        if (soldTeamId && soldAmount > 0) {
          await client.query(
            'UPDATE auction_teams SET remaining_purse = remaining_purse + $1, updated_at = NOW() WHERE id = $2',
            [soldAmount, soldTeamId]
          );
        }

        const updateRes = await client.query(
          `UPDATE auction_players SET
            auction_status = 'unsold',
            sold_price = NULL,
            sold_to_team_id = NULL,
            auctioned_at = NOW()
          WHERE id::text = $1 RETURNING *`,
          [String(playerId)]
        );
        await client.query('COMMIT');
        return { success: true, player: updateRes.rows[0], refundedAmount: soldAmount, refundedTeamId: soldTeamId };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB markSoldPlayerUnsold failed:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const player = store.players.find((p) => String(p.id) === String(playerId));
  if (!player) throw new Error('Player not found');

  const soldAmount = Number(player.sold_price) || 0;
  const soldTeamId = player.sold_to_team_id;
  if (soldTeamId && soldAmount > 0) {
    const team = store.teams.find((t) => String(t.id) === String(soldTeamId));
    if (team) team.remaining_purse += soldAmount;
  }
  player.auction_status = 'unsold';
  player.sold_price = null;
  player.sold_to_team_id = null;
  player.auctioned_at = new Date().toISOString();
  return { success: true, player, refundedAmount: soldAmount, refundedTeamId: soldTeamId };
}

export async function changePlayerStatus(playerId, newStatus, options = {}) {
  const allowed = ['queued', 'unsold', 'on_hammer', 'sold'];
  if (!allowed.includes(newStatus)) throw new Error('Invalid auction status: ' + newStatus);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('BEGIN');
        const pRes = await client.query('SELECT * FROM auction_players WHERE id::text = $1', [String(playerId)]);
        const player = pRes.rows[0];
        if (!player) throw new Error('Player not found');

        const oldStatus = player.auction_status;
        const oldSoldPrice = Number(player.sold_price) || 0;
        const oldTeamId = player.sold_to_team_id;

        // If player was sold, and changing to non-sold, refund previous team
        if (oldStatus === 'sold' && newStatus !== 'sold' && oldTeamId && oldSoldPrice > 0) {
          await client.query(
            'UPDATE auction_teams SET remaining_purse = remaining_purse + $1, updated_at = NOW() WHERE id = $2',
            [oldSoldPrice, oldTeamId]
          );
        }

        let finalSoldPrice = player.sold_price;
        let finalTeamId = player.sold_to_team_id;

        if (newStatus === 'sold') {
          finalTeamId = options.sold_to_team_id || options.soldToTeamId || oldTeamId;
          const rawPrice = options.sold_price !== undefined ? options.sold_price : options.soldPrice;
          finalSoldPrice = rawPrice !== undefined ? Number(rawPrice) : oldSoldPrice;

          // If was already sold to same team, adjust difference
          if (oldStatus === 'sold' && oldTeamId === finalTeamId) {
            const diff = finalSoldPrice - oldSoldPrice;
            if (diff !== 0) {
              await client.query(
                'UPDATE auction_teams SET remaining_purse = remaining_purse - $1, updated_at = NOW() WHERE id = $2',
                [diff, finalTeamId]
              );
            }
          } else {
            // New team purchase
            if (finalTeamId && finalSoldPrice > 0) {
              await client.query(
                'UPDATE auction_teams SET remaining_purse = remaining_purse - $1, updated_at = NOW() WHERE id = $2',
                [finalSoldPrice, finalTeamId]
              );
            }
          }
        } else {
          finalSoldPrice = null;
          finalTeamId = null;
        }

        const isFinalStatus = newStatus === 'sold' || newStatus === 'unsold';
        const updateRes = await client.query(
          `UPDATE auction_players SET
            auction_status = $2::text,
            sold_price = $3,
            sold_to_team_id = $4,
            auctioned_at = CASE WHEN $5::boolean THEN NOW() ELSE NULL END
          WHERE id::text = $1 RETURNING *`,
          [String(playerId), newStatus, finalSoldPrice, finalTeamId, isFinalStatus]
        );
        await client.query('COMMIT');
        return { success: true, player: updateRes.rows[0] };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB changePlayerStatus failed, using memory store:', err.message);
    }
  }

  const store = initMultiSportMemoryStore();
  const player = store.players.find((p) => String(p.id) === String(playerId));
  if (!player) throw new Error('Player not found');

  const oldStatus = player.auction_status;
  const oldSoldPrice = Number(player.sold_price) || 0;
  const oldTeamId = player.sold_to_team_id;

  if (oldStatus === 'sold' && newStatus !== 'sold' && oldTeamId && oldSoldPrice > 0) {
    const prevTeam = store.teams.find((t) => String(t.id) === String(oldTeamId));
    if (prevTeam) {
      prevTeam.remaining_purse = (Number(prevTeam.remaining_purse) || 0) + oldSoldPrice;
    }
  }

  player.auction_status = newStatus;
  if (newStatus === 'sold') {
    const rawPrice = options.sold_price !== undefined ? options.sold_price : options.soldPrice;
    player.sold_price = rawPrice !== undefined ? Number(rawPrice) : oldSoldPrice;
    player.sold_to_team_id = options.sold_to_team_id || options.soldToTeamId || oldTeamId;
    player.auctioned_at = new Date().toISOString();

    const newTeam = store.teams.find((t) => String(t.id) === String(player.sold_to_team_id));
    if (newTeam && oldTeamId === player.sold_to_team_id) {
      const diff = player.sold_price - oldSoldPrice;
      newTeam.remaining_purse = (Number(newTeam.remaining_purse) || 0) - diff;
    } else if (newTeam) {
      newTeam.remaining_purse = (Number(newTeam.remaining_purse) || 0) - player.sold_price;
    }
  } else {
    player.sold_price = null;
    player.sold_to_team_id = null;
    player.auctioned_at = newStatus === 'unsold' ? new Date().toISOString() : null;
  }

  return { success: true, player };
}

export async function seedTournamentDefaultTeams(tournamentId) {
  const targetTournamentId = await resolveTournamentUuid(tournamentId);
  const tournament = await getTournamentById(targetTournamentId);
  if (!tournament) throw new Error('Tournament not found');

  const sportId = tournament.sport_id || 'volleyball';
  const defaultPurse = Number(tournament.default_purse) || 100000;
  const minSquad = Number(tournament.min_squad_size) || 8;
  const maxSquad = Number(tournament.max_squad_size) || 12;

  const starterTemplates = {
    football: [
      { name: 'Coastal Strikers FC', code: 'CSF', owner: 'Farooq Merchant', coach: 'Alberto Gomes', color: '#10b981', pool: 'Pool A' },
      { name: 'Sahyadri United FC', code: 'SUN', owner: 'Rohan Deshmukh', coach: 'Ganesh Sawant', color: '#2563eb', pool: 'Pool A' },
      { name: 'Palghar Blue Tigers', code: 'PBT', owner: 'Nitin Meher', coach: 'Sanjay Bhoir', color: '#06b6d4', pool: 'Pool B' },
      { name: 'Tarapur Titans FC', code: 'TTF', owner: 'Vivek Joshi', coach: 'Denzil Dsouza', color: '#ea580c', pool: 'Pool B' },
    ],
    volleyball: [
      { name: 'Palghar Smashers', code: 'PSM', owner: 'Sunil Patil', coach: 'Rajesh Gharat', color: '#f59e0b', pool: 'Pool A' },
      { name: 'Boisar Blasters', code: 'BBL', owner: 'Mahesh Tare', coach: 'Pravin Raut', color: '#06b6d4', pool: 'Pool A' },
      { name: 'Dahanu Spikers', code: 'DSP', owner: 'Ketan Vaze', coach: 'Amol More', color: '#10b981', pool: 'Pool B' },
      { name: 'Manor Aces', code: 'MAC', owner: 'Sachin Jadhav', coach: 'Devendra Koli', color: '#8b5cf6', pool: 'Pool B' },
    ],
    kabaddi: [
      { name: 'Dahanu Dhurandhar', code: 'DDH', owner: 'Baban Patil', coach: 'Shrikant Jadhav', color: '#dc2626', pool: 'Pool A' },
      { name: 'Boisar Bulls', code: 'BBU', owner: 'Ajit Tamore', coach: 'Pandurang Koli', color: '#f59e0b', pool: 'Pool A' },
      { name: 'Palghar Panthers', code: 'PAN', owner: 'Dinesh Chaudhari', coach: 'Ramdas Gharat', color: '#7c3aed', pool: 'Pool B' },
      { name: 'Manor Marathas', code: 'MMR', owner: 'Kashinath Pawar', coach: 'Vilas Mhatre', color: '#ea580c', pool: 'Pool B' },
    ],
    cricket: [
      { name: 'Palghar Super Kings', code: 'PSK', owner: 'Hemant Patil', coach: 'Vinit Indulkar', color: '#eab308', pool: 'Pool A' },
      { name: 'Boisar Royals', code: 'BRO', owner: 'Ashok Shah', coach: 'Pradeep Sundaram', color: '#2563eb', pool: 'Pool A' },
      { name: 'Dahanu Indians', code: 'DIN', owner: 'Chetan Vaze', coach: 'Sagar Naik', color: '#0284c7', pool: 'Pool B' },
    ],
    khokho: [
      { name: 'Palghar Chasers', code: 'PCH', owner: 'Narendra Tandel', coach: 'Santosh Kadam', color: '#8b5cf6', pool: 'Pool A' },
      { name: 'Sahyadri Runners', code: 'SRU', owner: 'Bhushan Patil', coach: 'Umesh More', color: '#10b981', pool: 'Pool B' },
    ],
    badminton: [
      { name: 'Palghar Smash Masters', code: 'PSM', owner: 'Deepak Merchant', coach: 'Arun Gawade', color: '#ec4899', pool: 'Pool A' },
      { name: 'Shuttle Stars Boisar', code: 'SSB', owner: 'Kavita Tare', coach: 'Nitin Sawant', color: '#06b6d4', pool: 'Pool B' },
    ],
  };

  const list = starterTemplates[sportId] || starterTemplates.volleyball;
  const created = [];
  for (const t of list) {
    const newTeam = await createAuctionTeam({
      team_name: t.name,
      team_code: t.code,
      owner_name: t.owner,
      coach_name: t.coach,
      primary_color: t.color,
      initial_purse: defaultPurse,
      min_squad_size: minSquad,
      max_squad_size: maxSquad,
      pool_group: t.pool,
    }, targetTournamentId);
    created.push(newTeam);
  }
  return created;
}
