import { notFound } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `Tournament Pools & Spin Wheel | ${tournament.tournament_name}`
      : 'Tournament Pools & Spin Wheel',
    description: 'Interactive spin-wheel circular pie chart to assign tournament teams into Group A, Group B, and beyond.',
  };
}

export default async function TournamentPoolsPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params.tournamentId;

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/t/${tournamentId}/pools`} />;
  }

  const session = await getAuctionSession();
  const role = session.role;
  const loggedTeam = session.team;
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const initialTeams = await getAuctionTeams(tournament.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
      <main className="flex-grow-1">
        <TeamSquadsDashboard
          initialTeams={initialTeams}
          tournament={tournament}
          tournamentId={tournament.id}
          initialTab="pools"
          isAdmin={session.isAdmin}
          loggedTeam={loggedTeam}
          initialTeamId={searchParams?.teamId}
        />
      </main>
    </div>
  );
}
