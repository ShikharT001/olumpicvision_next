import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionTeams, getTournamentById, getTournaments } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '../actions';

export const metadata = {
  title: 'Team Squads & Remaining Purse | Multi-Sport Live Auction',
  description: 'Track team purse spending, remaining budget, and acquired rosters.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionTeamsPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  const session = await getAuctionSession();
  const role = session.role;
  const loggedTeam = session.team;

  // If logged in as a registered team, directly load their tournament auction screen!
  if (isAuthed && role === 'team' && loggedTeam?.id) {
    const tId = loggedTeam.tournamentId || session.tournamentId;
    if (tId) {
      redirect(`/auction/t/${tId}/teams?teamId=${loggedTeam.id}&tab=squads`);
    }
  }

  const allTournaments = await getTournaments();

  if (!isAuthed) {
    const errorParam = searchParams?.error || '';
    const tournamentsWithTeams = await Promise.all(
      allTournaments.map(async (t) => {
        const teams = await getAuctionTeams(t.id);
        return { ...t, teams };
      })
    );
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    return (
      <AuctionLoginGate
        allTournaments={tournamentsWithTeams}
        errorMessage={errorParam}
        returnTo={`/auction/teams${tournParam}`}
      />
    );
  }

  let tournament = null;
  if (searchParams?.tournamentId) {
    tournament = await getTournamentById(searchParams.tournamentId);
  }

  // If no tournament specified and multiple tournaments exist, show clean tournament selector
  if (!tournament && allTournaments.length > 1) {
    return (
      <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
        <AuctionNavbar role={role} team={loggedTeam} />
        <main className="flex-grow-1 container py-5">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 760 }}>
            <span className="badge badge-cyan px-3 py-1.5 rounded-pill text-xs fw-extrabold text-uppercase mb-2 shadow-sm">
              🛡️ FRANCHISE SQUADS & PURSE
            </span>
            <h1 className="fs-2 fw-black text-white mb-2 tracking-tight">
              Select Your Tournament
            </h1>
            <p className="text-white-50 small mb-0">
              Multiple championships are currently active. Choose your sport and tournament to inspect franchise rosters, remaining purse balances, and live podium outcomes.
            </p>
          </div>

          <div className="row g-3 justify-content-center">
            {allTournaments.map((t) => (
              <div key={t.id} className="col-12 col-md-6 col-lg-4">
                <div className="auction-card h-100 p-4 d-flex flex-column transition-all hover-translate-y">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge badge-cyan px-2.5 py-1 rounded-pill text-xs fw-bold">
                      {t.sportConfig?.icon || '🏅'} {t.sport_name || 'Championship'}
                    </span>
                    <span className="badge bg-secondary bg-opacity-30 text-white-50 text-xs rounded-pill">
                      {t.season_year || '2026/27'}
                    </span>
                  </div>

                  <h3 className="fs-5 fw-extrabold text-white mb-1">
                    {t.tournament_name}
                  </h3>
                  <p className="text-white-50 text-xs mb-3 flex-grow-1 text-truncate">
                    {t.venue ? `📍 ${t.venue}` : 'Championship Auction'}
                  </p>

                  <div className="d-flex align-items-center justify-content-between py-2 border-top border-secondary border-opacity-20 text-xs text-white-50 mb-3">
                    <span>Teams: <strong className="text-white">{t.teams_count || 8}</strong></span>
                    <span>Purse: <strong className="text-warning font-monospace">₹{Number(t.default_purse || 100000).toLocaleString()}</strong></span>
                  </div>

                  <Link
                    href={`/auction/t/${t.id || t.slug}/teams`}
                    className="btn btn-sm btn-info text-dark rounded-pill py-2 fw-bold text-xs w-100 text-center shadow-sm"
                  >
                    Enter Squads & Purse ➔
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Fallback to first tournament if only 1 exists
  if (!tournament) {
    tournament = allTournaments[0] || null;
  }

  const initialTeams = await getAuctionTeams(tournament?.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <main className="flex-grow-1">
        <TeamSquadsDashboard
          initialTeams={initialTeams}
          tournament={tournament}
          tournamentId={tournament?.id}
          initialTab={searchParams?.tab || 'squads'}
          isAdmin={session.isAdmin}
          loggedTeam={loggedTeam}
          initialTeamId={searchParams?.teamId || (role === 'team' ? loggedTeam?.id : null)}
        />
      </main>
    </div>
  );
}
