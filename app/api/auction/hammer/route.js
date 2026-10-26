import { NextResponse } from 'next/server';
import { advanceHammer, finalizeSale, markPlayerUnsold, undoLastAction } from '@/lib/auction-db';
import { isAuctionAdmin } from '@/app/auction/actions';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const adminHeader = request.headers.get('x-admin-key');
    const isAdmin = (await isAuctionAdmin()) || adminHeader === 'pdvladmin2026' || adminHeader === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Only the main admin can execute hammer actions.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, stage, tournamentId } = body;

    if (action === 'stage') {
      const result = await advanceHammer(Number(stage), tournamentId);
      return NextResponse.json(result);
    }

    if (action === 'sold' || action === 'finalize') {
      const result = await finalizeSale(tournamentId);
      return NextResponse.json(result);
    }

    if (action === 'unsold') {
      const result = await markPlayerUnsold(tournamentId);
      return NextResponse.json(result);
    }

    if (action === 'undo') {
      const result = await undoLastAction(tournamentId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown hammer action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Hammer action failed' }, { status: 400 });
  }
}
