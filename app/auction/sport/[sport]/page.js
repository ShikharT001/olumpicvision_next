import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import TournamentsManager from '@/components/auction/TournamentsManager';
import '@/app/auction/auction.css';
import { getTournaments } from '@/lib/auction-db';
import { getSportById } from '@/lib/sports-config';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole } from '../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const sport = getSportById(params.sport);
  return {
    title: `${sport.name} Tournaments & Auctions | Olympic Vision`,
    description: `Browse and manage ${sport.name} tournaments, franchise team budgets, and live auctions.`,
  };
}

export default async function SportTournamentsPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const sportKey = params.sport;
  const sport = getSportById(sportKey);

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/sport/${sportKey}`} />;
  }

  const role = await getAuctionRole();
  const isAdmin = await isAuctionAdmin();
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
          <span>© 2026 Olympic Vision • {sport.name} Tournaments</span>
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
