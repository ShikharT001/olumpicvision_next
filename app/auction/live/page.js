import BigScreenStage from '@/components/auction/BigScreenStage';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getLiveAuctionState, getTournamentById, getTournaments } from '@/lib/auction-db';
import { isAuctionAuthenticated } from '../actions';

export const metadata = {
  title: 'Stage Live Display | Multi-Sport Live Auction',
  description: '16:9 Big-screen projector stage view for live auctions.',
};

export const dynamic = 'force-dynamic';

export default async function BigScreenStagePage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    const tournParam = searchParams?.tournamentId ? `?tournamentId=${searchParams.tournamentId}` : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/live${tournParam}`} />;
  }

  let tournament = null;
  if (searchParams?.tournamentId) {
    tournament = await getTournamentById(searchParams.tournamentId);
  }
  if (!tournament) {
    const all = await getTournaments();
    tournament = all[0] || null;
  }

  const initialData = await getLiveAuctionState(tournament?.id);

  return (
    <BigScreenStage
      initialData={initialData}
      tournament={tournament}
      tournamentId={tournament?.id}
    />
  );
}
