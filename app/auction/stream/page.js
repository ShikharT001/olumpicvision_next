import { redirect } from 'next/navigation';
import { getTournaments, getTournamentById } from '@/lib/auction-db';

export const metadata = {
  title: 'YouTube Live Stream & Auction Screen | Olympic Vision',
  description: 'Watch the real shooting live auction happening with real-time bidding details, active player cards, and team purse boards.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionStreamRedirectPage(props) {
  const searchParams = await props.searchParams;
  let tournamentId = searchParams?.tournamentId;

  if (tournamentId) {
    const tourn = await getTournamentById(tournamentId);
    if (tourn) {
      redirect(`/auction/t/${tourn.id}/stream`);
    }
  }

  const all = await getTournaments();
  const defaultTourn = all[0];

  if (defaultTourn) {
    redirect(`/auction/t/${defaultTourn.id}/stream`);
  }

  redirect('/auction');
}
