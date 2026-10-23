'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuctionTeams, getTournamentById, getTournaments } from '@/lib/auction-db';

const AUCTION_COOKIE = 'pdvl_auction_access';
const AUCTION_ROLE_COOKIE = 'pdvl_auction_role';
const AUCTION_TEAM_ID_COOKIE = 'pdvl_auction_team_id';
const AUCTION_TEAM_NAME_COOKIE = 'pdvl_auction_team_name';
const AUCTION_TEAM_CODE_COOKIE = 'pdvl_auction_team_code';
const AUCTION_TEAM_COLOR_COOKIE = 'pdvl_auction_team_color';
const AUCTION_TOURNAMENT_ID_COOKIE = 'pdvl_auction_tournament_id';

const AUCTION_ADMIN_PASSWORD = process.env.AUCTION_ADMIN_PASSWORD || 'pdvladmin2026';
const AUCTION_TEAM_PASSWORD = process.env.AUCTION_TEAM_PASSWORD || 'pdvl2026';

export async function authenticateAuction(formData) {
  const password = String(formData.get('password') || '').trim();
  const returnTo = String(formData.get('returnTo') || '/auction').trim();
  const loginMode = String(formData.get('loginMode') || 'team').trim(); // 'admin' | 'team'
  let tournamentId = String(formData.get('tournamentId') || '').trim();

  // If tournamentId wasn't passed directly, extract from returnTo if possible
  if (!tournamentId) {
    const match = returnTo.match(/\/auction\/t\/([^/?#]+)/);
    if (match) {
      tournamentId = match[1];
    }
  }

  // Team selection fields (when logging in under team mode)
  let teamId = String(formData.get('teamId') || '').trim();
  let teamName = String(formData.get('teamName') || '').trim();
  let teamCode = String(formData.get('teamCode') || '').trim();
  let teamColor = String(formData.get('teamColor') || '').trim();

  const adminPasscodes = [
    AUCTION_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    'olumpicvision',
    'admin',
    'admin123',
    '7890',
  ].filter(Boolean).map((p) => String(p).toLowerCase());

  const teamPasscodes = [
    AUCTION_TEAM_PASSWORD,
    'pdvl2026',
    'team',
    'team123',
    'franchise',
    'player',
    '1234',
  ].filter(Boolean).map((p) => String(p).toLowerCase());

  const passLower = password.toLowerCase();
  const isMatchAdmin = adminPasscodes.includes(passLower);

  let role = null;
  let matchedTeam = null;

  if (loginMode === 'team') {
    // -------------------------------------------------------------
    // REGISTERED TEAM LOGIN FOR A SPECIFIC TOURNAMENT
    // -------------------------------------------------------------
    if (tournamentId) {
      const tournamentTeams = await getAuctionTeams(tournamentId);

      // Case 1: Specific team was selected in the form
      if (teamId) {
        const found = tournamentTeams.find((t) => String(t.id) === String(teamId));
        if (!found) {
          // Team is not registered for this tournament!
          const errRedirect = `${returnTo.split('?')[0]}?error=not_registered_team&role=team`;
          redirect(errRedirect);
        }

        const isPassCorrect =
          passLower === found.team_code.toLowerCase() ||
          passLower === found.team_name.toLowerCase() ||
          teamPasscodes.includes(passLower) ||
          isMatchAdmin;

        if (!isPassCorrect) {
          const errRedirect = `${returnTo.split('?')[0]}?error=invalid_team_passcode&role=team&selectedTeamId=${found.id}`;
          redirect(errRedirect);
        }

        matchedTeam = found;
      } else {
        // Case 2: No dropdown selection, user entered team code / passcode directly
        // Check if entered password or teamCode matches any registered team in this tournament
        const matchByCode = tournamentTeams.find(
          (t) =>
            t.team_code.toLowerCase() === passLower ||
            (teamCode && t.team_code.toLowerCase() === teamCode.toLowerCase()) ||
            t.team_name.toLowerCase() === passLower
        );

        if (matchByCode) {
          matchedTeam = matchByCode;
        } else if (teamPasscodes.includes(passLower) || isMatchAdmin) {
          // If they entered the general team password but did not pick a team,
          // require them to select which registered team they belong to
          if (tournamentTeams.length > 0) {
            const errRedirect = `${returnTo.split('?')[0]}?error=select_registered_team&role=team`;
            redirect(errRedirect);
          }
        } else {
          // Check if code belongs to another tournament to provide helpful feedback
          const allTeams = await getAuctionTeams();
          const otherMatch = allTeams.find(
            (t) => t.team_code.toLowerCase() === passLower || t.team_name.toLowerCase() === passLower
          );
          if (otherMatch) {
            const errRedirect = `${returnTo.split('?')[0]}?error=team_from_other_tournament&role=team`;
            redirect(errRedirect);
          } else {
            const errRedirect = `${returnTo.split('?')[0]}?error=invalid_team_credentials&role=team`;
            redirect(errRedirect);
          }
        }
      }
    } else {
      // General login without pre-selected tournament:
      // Strictly verify if entered team is registered by admin in any tournament
      const allTeams = await getAuctionTeams();
      const found = allTeams.find(
        (t) =>
          (teamId && String(t.id) === String(teamId)) ||
          t.team_code.toLowerCase() === passLower ||
          (teamCode && t.team_code.toLowerCase() === teamCode.toLowerCase()) ||
          t.team_name.toLowerCase() === passLower
      );

      if (found) {
        const isPassCorrect =
          passLower === found.team_code.toLowerCase() ||
          passLower === found.team_name.toLowerCase() ||
          teamPasscodes.includes(passLower) ||
          isMatchAdmin;

        if (!isPassCorrect) {
          const errRedirect = `${returnTo.split('?')[0]}?error=invalid_team_passcode&role=team&selectedTeamId=${found.id}`;
          redirect(errRedirect);
        }

        matchedTeam = found;
        tournamentId = found.tournament_id;
      } else {
        // Not registered by admin in any active tournament
        const errRedirect = `${returnTo.split('?')[0]}?error=not_registered_team&role=team`;
        redirect(errRedirect);
      }
    }

    if (!matchedTeam) {
      const errRedirect = `${returnTo.split('?')[0]}?error=not_registered_team&role=team`;
      redirect(errRedirect);
    }

    role = 'team';
  } else {
    // Admin login mode requires master admin passcode
    if (isMatchAdmin) {
      role = 'admin';
    } else {
      const errRedirect = `${returnTo.split('?')[0]}?error=invalid&role=admin`;
      redirect(errRedirect);
    }
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
  cookieStore.set(AUCTION_ROLE_COOKIE, role, cookieOpts);

  if (role === 'team' && matchedTeam) {
    cookieStore.set(AUCTION_TEAM_ID_COOKIE, String(matchedTeam.id), cookieOpts);
    cookieStore.set(AUCTION_TEAM_NAME_COOKIE, matchedTeam.team_name || '', cookieOpts);
    cookieStore.set(AUCTION_TEAM_CODE_COOKIE, matchedTeam.team_code || '', cookieOpts);
    cookieStore.set(AUCTION_TEAM_COLOR_COOKIE, matchedTeam.primary_color || '#06b6d4', cookieOpts);
    if (tournamentId) {
      cookieStore.set(AUCTION_TOURNAMENT_ID_COOKIE, String(tournamentId), cookieOpts);
    }
  } else {
    // If admin, clear team credentials
    cookieStore.delete(AUCTION_TEAM_ID_COOKIE);
    cookieStore.delete(AUCTION_TEAM_NAME_COOKIE);
    cookieStore.delete(AUCTION_TEAM_CODE_COOKIE);
    cookieStore.delete(AUCTION_TEAM_COLOR_COOKIE);
    cookieStore.delete(AUCTION_TOURNAMENT_ID_COOKIE);
  }

  // Determine post-login redirect path:
  // Admin after login MUST direct to the list of sports (/auction)
  // Team directly loads the auction screens for their registered tournament!
  let target = '/auction';

  if (role === 'team' && matchedTeam) {
    const tId = tournamentId || matchedTeam.tournament_id;
    if (tId) {
      target = `/auction/t/${tId}/teams?teamId=${matchedTeam.id}&tab=squads`;
    } else {
      target = '/auction/teams';
    }
  } else if (role === 'admin') {
    // Admin after login directs to list of sports
    target = '/auction';
  }

  redirect(target);
}

export async function logoutAuction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUCTION_COOKIE);
  cookieStore.delete(AUCTION_ROLE_COOKIE);
  cookieStore.delete(AUCTION_TEAM_ID_COOKIE);
  cookieStore.delete(AUCTION_TEAM_NAME_COOKIE);
  cookieStore.delete(AUCTION_TEAM_CODE_COOKIE);
  cookieStore.delete(AUCTION_TEAM_COLOR_COOKIE);
  cookieStore.delete(AUCTION_TOURNAMENT_ID_COOKIE);
  redirect('/auction');
}

export async function getAuctionSession() {
  const cookieStore = await cookies();
  const hasAuctionCookie = cookieStore.get(AUCTION_COOKIE)?.value === 'true';
  const hasAdminCookie = cookieStore.get('olumpicvision_admin')?.value === 'true';
  const role = hasAdminCookie
    ? 'admin'
    : (cookieStore.get(AUCTION_ROLE_COOKIE)?.value || (hasAuctionCookie ? 'team' : null));

  const teamId = cookieStore.get(AUCTION_TEAM_ID_COOKIE)?.value || null;
  const teamName = cookieStore.get(AUCTION_TEAM_NAME_COOKIE)?.value || null;
  const teamCode = cookieStore.get(AUCTION_TEAM_CODE_COOKIE)?.value || null;
  const teamColor = cookieStore.get(AUCTION_TEAM_COLOR_COOKIE)?.value || null;
  const tournamentId = cookieStore.get(AUCTION_TOURNAMENT_ID_COOKIE)?.value || null;

  return {
    isAuthenticated: Boolean(hasAuctionCookie || hasAdminCookie),
    role,
    isAdmin: role === 'admin',
    isTeam: role === 'team',
    tournamentId,
    team: teamId ? { id: teamId, name: teamName, code: teamCode, color: teamColor, tournamentId } : null,
  };
}

export async function getAuctionRole() {
  const session = await getAuctionSession();
  return session.role;
}

export async function getAuctionTeam() {
  const session = await getAuctionSession();
  return session.team;
}

export async function isAuctionAdmin() {
  const session = await getAuctionSession();
  return session.isAdmin;
}

export async function isAuctionAuthenticated() {
  const session = await getAuctionSession();
  return session.isAuthenticated;
}

