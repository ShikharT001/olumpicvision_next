import { query } from '@/lib/postgres';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const bib = searchParams.get('bib');

    if (!bib || isNaN(Number(bib))) {
        return Response.json({ error: 'Invalid BIB number' }, { status: 400 });
    }

    try {
        const result = await query(
            `SELECT bib_number, full_name, race_group, category, organization, date_of_birth, age
       FROM marathon_participants
       WHERE bib_number = $1`,
            [Number(bib)]
        );

        if (result.rows.length === 0) {
            return Response.json({ error: 'Participant not found' }, { status: 404 });
        }

        return Response.json({ participant: result.rows[0] });
    } catch (err) {
        console.error('Lookup error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
