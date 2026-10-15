import BigScreenStage from '@/components/auction/BigScreenStage';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import '@/app/auction/auction.css';
import { getLiveAuctionState } from '@/lib/auction-db';
import { isAuctionAuthenticated } from '../actions';

export const metadata = {
  title: 'Stage Live Display | PDVL 2026 Auction',
  description: '16:9 Big-screen projector stage view for Palghar District Volleyball League live auction.',
};

export const dynamic = 'force-dynamic';

export default async function BigScreenStagePage({ searchParams }) {
  const isAuthed = await isAuctionAuthenticated();
  if (!isAuthed) {
    const resolvedParams = await searchParams;
    const errorMessage = resolvedParams?.error === 'invalid' ? 'Incorrect passcode. Please verify and try again.' : '';
    return <AuctionLoginGate errorMessage={errorMessage} returnTo="/auction/live" />;
  }

  const initialData = await getLiveAuctionState();

  return <BigScreenStage initialData={initialData} />;
}
