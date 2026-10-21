import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionTeams, getTournamentById, getTournaments } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionRole } from '../actions';

export const metadata = {
  title: 'Team Squads & Remaining Purse | Multi-Sport Live Auction',
  description: 'Track team purse spending, remaining budget, and acquired rosters.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionTeamsPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/teams${tournParam}`} />;
  }

  const role = await getAuctionRole();

  let tournament = null;
  if (searchParams?.tournamentId) {
    tournament = await getTournamentById(searchParams.tournamentId);
  }
  if (!tournament) {
    const all = await getTournaments();
    tournament = all[0] || null;
  }

  const initialTeams = await getAuctionTeams(tournament?.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} />
      <main className="flex-grow-1">
        <TeamSquadsDashboard
          initialTeams={initialTeams}
          tournament={tournament}
          tournamentId={tournament?.id}
          initialTab={searchParams?.tab || 'squads'}
          isAdmin={role === 'admin'}
        />
      </main>
    </div>
  );
}
