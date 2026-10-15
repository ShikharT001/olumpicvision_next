import BigScreenStage from '@/components/auction/BigScreenStage';
import '@/app/auction/auction.css';
import { getLiveAuctionState } from '@/lib/auction-db';

export const metadata = {
  title: 'Stage Live Display | PDVL 2026 Auction',
  description: '16:9 Big-screen projector stage view for Palghar District Volleyball League live auction.',
};

export const dynamic = 'force-dynamic';

export default async function BigScreenStagePage() {
  const initialData = await getLiveAuctionState();

  return <BigScreenStage initialData={initialData} />;
}
