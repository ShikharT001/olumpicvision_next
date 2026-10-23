import { redirect } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import SportSelector from '@/components/auction/SportSelector';
import TournamentsManager from '@/components/auction/TournamentsManager';
import TournamentHub from '@/components/auction/TournamentHub';
import '@/app/auction/auction.css';
import {
  getSports,
  getTournaments,
  getTournamentById,
  getAuctionTeams,
  getLiveAuctionState,
} from '@/lib/auction-db';
import { getSportById } from '@/lib/sports-config';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole, getAuctionSession } from './actions';

export const metadata = {
  title: 'Olympic Vision Multi-Sport Live Auction Hub | Confidential Portal',
  description: 'Confidential Multi-Sport Player Auction System for Volleyball, Football, Kabaddi, Kho-Kho, Cricket, Badminton & More.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionHubPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  const session = await getAuctionSession();
  const role = session.role;
  const isAdmin = session.isAdmin;
  const loggedTeam = session.team;

  // For registered teams, directly load the auction screens for their tournament (teams never get sport/tournament screen)
  if (isAuthed && role === 'team' && loggedTeam?.id) {
    const tId = loggedTeam.tournamentId || session.tournamentId;
    if (tId) {
      redirect(`/auction/t/${tId}/teams?teamId=${loggedTeam.id}&tab=squads`);
    } else {
      redirect('/auction/teams');
    }
  }

  if (!isAuthed) {
    const errorParam = searchParams?.error || '';
    const sportParam = searchParams?.sport ? `?sport=${searchParams.sport}` : '';
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    const returnTo = `/auction${sportParam || tournParam}`;
    const all = await getTournaments();
    const tournamentsWithTeams = await Promise.all(
      all.map(async (t) => {
        const teams = await getAuctionTeams(t.id);
        return { ...t, teams };
      })
    );
    let tourn = null;
    let tournTeams = [];
    if (searchParams?.tournamentId) {
      tourn = await getTournamentById(searchParams.tournamentId);
      if (tourn) tournTeams = await getAuctionTeams(tourn.id);
    }
    return (
      <AuctionLoginGate
        tournament={tourn}
        tournamentTeams={tournTeams}
        allTournaments={tournamentsWithTeams}
        errorMessage={errorParam}
        returnTo={returnTo}
      />
    );
  }

  // Mode 1: A specific tournament is requested via query param (?tournamentId=...)
  if (searchParams?.tournamentId) {
    const tournament = await getTournamentById(searchParams.tournamentId);
    if (tournament) {
      const liveState = await getLiveAuctionState(tournament.id);
      return (
        <div className="auction-shell d-flex flex-column min-vh-100" data-bs-theme="dark">
          <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
          <TournamentHub
            tournament={tournament}
            liveState={liveState}
            role={role}
            isAdmin={isAdmin}
          />
          <footer className="mt-auto py-3 border-top border-secondary border-opacity-10 text-center text-secondary small">
            <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
              <span>© 2026 {tournament.tournament_name} • Olympic Vision</span>
              <span>
                Multi-Sport Auction Engine by{' '}
                <a href="https://thetechnocyte.com" target="_blank" rel="noreferrer" className="text-info text-decoration-none fw-semibold">
                  Technocyte
                </a>
              </span>
            </div>
          </footer>
        </div>
      );
    }
  }

  // Mode 2: A specific sport is selected (?sport=volleyball | football | kabaddi ...)
  if (searchParams?.sport) {
    const sport = getSportById(searchParams.sport);
    const tournaments = await getTournaments(sport.id);

    return (
      <div className="auction-shell d-flex flex-column min-vh-100" data-bs-theme="dark">
        <AuctionNavbar role={role} team={loggedTeam} />
        <TournamentsManager
          sport={sport}
          initialTournaments={tournaments}
          role={role}
          isAdmin={isAdmin}
        />
        <footer className="mt-auto py-3 border-top border-secondary border-opacity-10 text-center text-secondary small">
          <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
            <span>© 2026 Olympic Vision • {sport.name} Championships</span>
            <span>
              Multi-Sport Auction Engine by{' '}
              <a href="https://thetechnocyte.com" target="_blank" rel="noreferrer" className="text-info text-decoration-none fw-semibold">
                Technocyte
              </a>
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // Mode 3: Game / Sport Selection Screen (Default Root)
  const sports = await getSports();
  const allTournaments = await getTournaments();

  return (
    <div className="auction-shell d-flex flex-column min-vh-100" data-bs-theme="dark">
      <AuctionNavbar role={role} team={loggedTeam} />
      <SportSelector
        sports={sports}
        tournaments={allTournaments}
        role={role}
        isAdmin={isAdmin}
      />
      <footer className="mt-auto py-3 border-top border-secondary border-opacity-10 text-center text-secondary small">
        <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <span>© 2026 Olympic Vision Multi-Sport Auction System</span>
          <span>
            Designed &amp; Developed by{' '}
            <a href="https://thetechnocyte.com" target="_blank" rel="noreferrer" className="text-info text-decoration-none fw-semibold">
              Technocyte
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
