import { notFound } from 'next/navigation';
import Link from 'next/link';
import AuctionNavbar from '@/components/auction/AuctionNavbar';
import TeamsManager from '@/components/auction/TeamsManager';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getTournamentById, getAuctionTeams } from '@/lib/auction-db';
import { isAuctionAuthenticated, isAuctionAdmin, getAuctionRole, getAuctionSession } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const tournament = await getTournamentById(params.tournamentId);
  return {
    title: tournament
      ? `Manage Teams & Budgets | ${tournament.tournament_name}`
      : 'Manage Teams & Budgets',
    description: 'Configure participating franchise teams, starting purses, and squad limits.',
  };
}

export default async function TournamentManageTeamsPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const tournamentId = params.tournamentId;

  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo={`/auction/t/${tournamentId}/manage-teams`} />;
  }

  const session = await getAuctionSession();
  const role = session.role;
  const isAdmin = session.isAdmin;
  const loggedTeam = session.team;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  if (!isAdmin) {
    return (
      <div className="auction-shell min-vh-100 d-flex flex-column">
        <AuctionNavbar role={role} tournament={tournament} team={loggedTeam} />
        <main className="container my-auto py-5 text-center">
          <div className="auction-card p-4 p-md-5 mx-auto text-center" style={{ maxWidth: 540 }}>
            <div className="fs-1 mb-2">🛡️</div>
            <span className="badge bg-danger text-white rounded-pill px-3 py-1 text-xs fw-extrabold text-uppercase mb-3">
              Admin Privileges Required
            </span>
            <h3 className="h4 fw-extrabold text-white mb-2">
              Team &amp; Budget Configuration is Restricted
            </h3>
            <p className="text-secondary small mb-4 leading-relaxed">
              Teams and purses can only be modified by the Main Administrator. You can view all live squads and remaining purses on the public team board.
            </p>
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
              <Link href={`/auction/t/${tournamentId}/teams`} className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold">
                Go to Team Squads Board →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const initialTeams = await getAuctionTeams(tournament.id);

  return (
    <div className="auction-shell min-vh-100 d-flex flex-column" data-bs-theme="dark">
      <AuctionNavbar role="admin" tournament={tournament} />
      <main className="flex-grow-1">
        <TeamsManager
          initialTeams={initialTeams}
          tournament={tournament}
          tournamentId={tournament.id}
        />
      </main>
    </div>
  );
}
