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
  getLiveAuctionState,
} from '@/lib/auction-db';
import { getSportById } from '@/lib/sports-config';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole } from './actions';

export const metadata = {
  title: 'Olympic Vision Multi-Sport Live Auction Hub | Confidential Portal',
  description: 'Confidential Multi-Sport Player Auction System for Volleyball, Football, Kabaddi, Kho-Kho, Cricket, Badminton & More.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionHubPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();

  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    const sportParam = searchParams?.sport ? `?sport=${searchParams.sport}` : '';
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    const returnTo = `/auction${sportParam || tournParam}`;
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={returnTo} />;
  }

  const role = await getAuctionRole();
  const isAdmin = await isAuctionAdmin();

  // Mode 1: A specific tournament is requested via query param (?tournamentId=...)
  if (searchParams?.tournamentId) {
    const tournament = await getTournamentById(searchParams.tournamentId);
    if (tournament) {
      const liveState = await getLiveAuctionState(tournament.id);
      return (
        <div className="auction-shell d-flex flex-column min-vh-100" data-bs-theme="dark">
          <AuctionNavbar role={role} tournament={tournament} />
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
        <AuctionNavbar role={role} />
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
      <AuctionNavbar role={role} />
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
