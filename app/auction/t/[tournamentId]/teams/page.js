import { notFound } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamSquadsDashboard from '@/components/auction/TeamSquadsDashboard';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionRole } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `Team Squads & Purse | ${tournament.tournament_name}`
      : 'Team Squads & Purse',
    description: 'Track team purse spending, remaining budget, and acquired rosters.',
  };
}

export default async function TournamentTeamsPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params.tournamentId;

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/t/${tournamentId}/teams`} />;
  }

  const role = await getAuctionRole();
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const initialTeams = await getAuctionTeams(tournament.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} />
      <main className="flex-grow-1">
        <TeamSquadsDashboard
          initialTeams={initialTeams}
          tournament={tournament}
          tournamentId={tournament.id}
        />
      </main>
    </div>
  );
}
