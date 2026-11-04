import { notFound } from 'next/navigation';
import BigScreenStage from '@/components/auction/BigScreenStage';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getLiveAuctionState, getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, getAuctionSession } from '@/app/auction/actions';

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

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const tournamentTeams = await getAuctionTeams(tournament.id);

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorParam = searchParams?.error || '';
    return (
      <AuctionLoginGate
        tournament={tournament}
        tournamentTeams={tournamentTeams}
        errorMessage={errorParam}
        returnTo={`/auction/t/${tournamentId}/live`}
      />
    );
  }

  const session = await getAuctionSession();
  if (session.role === 'team' && session.team?.id) {
    const isRegistered = tournamentTeams.some((t) => String(t.id) === String(session.team.id));
    if (!isRegistered) {
      return (
        <AuctionLoginGate
          tournament={tournament}
          tournamentTeams={tournamentTeams}
          errorMessage={`Your team session (${session.team.name}) is not registered for ${tournament.tournament_name}.`}
          returnTo={`/auction/t/${tournamentId}/live`}
        />
      );
    }
  }

  const initialData = await getLiveAuctionState(tournament.id);

  return (
    <BigScreenStage
      initialData={initialData}
      tournament={tournament}
      tournamentId={tournament.id}
    />
  );
}
