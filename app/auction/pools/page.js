import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getAuctionTeams, getTournamentById, getTournaments } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '../actions';

export const metadata = {
  title: 'Tournament Pools & Spin Wheel Draw | Multi-Sport Live Auction',
  description: 'Interactive spin-wheel circular pie chart to assign tournament teams into Group A, Group B, and beyond.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionPoolsPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/pools${tournParam}`} />;
  }

  const session = await getAuctionSession();
  const role = session.role;
  const loggedTeam = session.team;

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
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <main className="flex-grow-1">
        <TeamSquadsDashboard
          initialTeams={initialTeams}
          tournament={tournament}
          tournamentId={tournament?.id}
          initialTab="pools"
          isAdmin={session.isAdmin}
          loggedTeam={loggedTeam}
          initialTeamId={searchParams?.teamId}
        />
      </main>
    </div>
  );
}
