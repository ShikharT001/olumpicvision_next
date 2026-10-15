import { NextResponse } from 'next/server';
import { advanceHammer, finalizeSale, markPlayerUnsold, undoLastAction } from '@/lib/auction-db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, stage } = body;

    if (action === 'stage') {
      const result = await advanceHammer(Number(stage));
      return NextResponse.json(result);
    }

    if (action === 'sold') {
      const result = await finalizeSale();
      return NextResponse.json(result);
    }

    if (action === 'unsold') {
      const result = await markPlayerUnsold();
      return NextResponse.json(result);
    }

    if (action === 'undo') {
      const result = await undoLastAction();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown hammer action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Hammer action failed' }, { status: 400 });
  }
}
