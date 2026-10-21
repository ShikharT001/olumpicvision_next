import { notFound } from 'next/navigation';
import BigScreenStage from '@/components/auction/BigScreenStage';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getLiveAuctionState } from '@/lib/auction-db';
import { isAuctionAuthenticated } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `Live Stage Display | ${tournament.tournament_name}`
      : 'Stage Live Display',
    description: '16:9 Big-screen projector stage view for live auction.',
  };
}

export default async function TournamentBigScreenStagePage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params.tournamentId;

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/t/${tournamentId}/live`} />;
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const initialData = await getLiveAuctionState(tournament.id);

  return (
    <BigScreenStage
      initialData={initialData}
      tournament={tournament}
      tournamentId={tournament.id}
    />
  );
}
