import { redirect } from 'next/navigation';
import AuctionLoginGate from '@/components/auction/AuctionLoginGate';
import { isAuctionAuthenticated, getAuctionRole } from '../actions';
import '@/app/auction/auction.css';

export const metadata = {
  title: 'Auction Portal Login | Team & Admin Access',
  description: 'Confidential sign-in portal for franchise team representatives and main tournament auctioneers.',
};

export const dynamic = 'force-dynamic';

export default async function AuctionLoginPage(props) {
  const searchParams = await props.searchParams;
  const isAuthed = await isAuctionAuthenticated();
  const role = await getAuctionRole();

  // If already authenticated, redirect them directly
  if (isAuthed) {
    if (role === 'team') {
      redirect('/auction/teams');
    }
    redirect('/auction');
  }

  const errorMessage = searchParams?.error === 'invalid' ? 'Incorrect passcode PIN. Please verify and try again.' : '';
  const initialRole = searchParams?.role === 'admin' ? 'admin' : 'team';
  const returnTo = searchParams?.returnTo || (initialRole === 'team' ? '/auction/teams' : '/auction');

  return (
    <AuctionLoginGate
      errorMessage={errorMessage}
      returnTo={returnTo}
      initialRole={initialRole}
    />
  );
}
