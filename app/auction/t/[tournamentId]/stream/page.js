import { notFound } from 'next/navigation';
import YouTubeLiveAuctionStream from '@/components/auction/YouTubeLiveAuctionStream';
import '@/app/auction/auction.css';
import { getTournamentById, getLiveAuctionState, getAuctionTeams } from '@/lib/auction-db';
import { getAuctionSession } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `YouTube Live Stream & Auction Screen | ${tournament.tournament_name}`
      : 'YouTube Live Stream & Auction Screen',
    description: 'Watch the real shooting live auction happening with real-time bidding details, active player cards, and team purse boards.',
  };
}

export default async function TournamentStreamPage(props) {
  const params = await props.params;
  const tournamentId = params.tournamentId;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const session = await getAuctionSession();
  const initialData = await getLiveAuctionState(tournament.id);

  return (
    <YouTubeLiveAuctionStream
      initialData={initialData}
      tournament={tournament}
      tournamentId={tournament.id}
      role={session.role || 'guest'}
      isAdmin={session.isAdmin}
      loggedTeam={session.team}
    />
  );
}
