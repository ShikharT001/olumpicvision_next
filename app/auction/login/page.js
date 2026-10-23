import { redirect } from 'next/navigation';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import { isAuctionAuthenticated, getAuctionSession } from '../actions';
import { getTournaments, getAuctionTeams, getTournamentById } from '@/lib/auction-db';
import '@/app/auction/auction.css';

export const metadata = {
  title: 'Auction Portal Login | Registered Teams & Admin Access',
  description: 'Confidential sign-in portal for registered tournament franchise teams and auctioneers.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionLoginPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  const session = await getAuctionSession();
  const role = session.role;
  const loggedTeam = session.team;

  // If already authenticated:
  if (isAuthed) {
    if (role === 'team' && loggedTeam?.id) {
      const tournId = loggedTeam.tournamentId || session.tournamentId;
      if (tournId) {
        redirect(`/auction/t/${tournId}/teams?teamId=${loggedTeam.id}&tab=squads`);
      }
      redirect('/auction/teams');
    }
    redirect('/auction');
  }

  const allTournaments = await getTournaments();
  // Attach teams to tournaments for instant selection
  const tournamentsWithTeams = await Promise.all(
    allTournaments.map(async (t) => {
      const teams = await getAuctionTeams(t.id);
      return { ...t, teams };
    })
  );

  let initialTournament = null;
  let tournamentTeams = [];
  if (searchParams?.tournamentId) {
    initialTournament = await getTournamentById(searchParams.tournamentId);
    if (initialTournament) {
      tournamentTeams = await getAuctionTeams(initialTournament.id);
    }
  }

  const initialRole = searchParams?.role === 'admin' ? 'admin' : 'team';
  const returnTo = searchParams?.returnTo || (initialRole === 'team' ? '/auction/teams' : '/auction');
  const errorParam = searchParams?.error || '';

  return (
    <AuctionLoginGate
      tournament={initialTournament}
      tournamentTeams={tournamentTeams}
      allTournaments={tournamentsWithTeams}
      errorMessage={errorParam}
      returnTo={returnTo}
      initialRole={initialRole}
    />
  );
}
