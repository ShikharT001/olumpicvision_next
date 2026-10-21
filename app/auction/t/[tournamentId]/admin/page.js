import { notFound } from 'next/navigation';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import AuctioneerConsole from '@/components/auction/AuctioneerConsole';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getLiveAuctionState } from '@/lib/auction-db';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `Auctioneer Podium | ${tournament.tournament_name}`
      : 'Auctioneer Console',
    description: 'Podium controls, physical paddle attribution, and live hammer gavel.',
  };
}

export default async function TournamentAdminPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params.tournamentId;

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/t/${tournamentId}/admin`} />;
  }

  const role = await getAuctionRole();
  const isAdmin = await isAuctionAdmin();

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  const initialData = await getLiveAuctionState(tournament.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role={role} tournament={tournament} />
      <main className="flex-grow-1">
        <AuctioneerConsole
          initialData={initialData}
          role={role}
          isAdmin={isAdmin}
          tournament={tournament}
          tournamentId={tournament.id}
        />
      </main>
    </div>
  );
}
