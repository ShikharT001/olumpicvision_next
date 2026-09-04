import { query } from '@/lib/postgres';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

// ── Helper: extract numeric KM distance from category string ───────────────
// Handles both:
//   - Excel-imported labels: "OPEN MENS - 11KM", "U14 BOYS - 3KM", "COUPLES - 1KM"
//   - Registration form codes: "open_men", "u14", "senior", "couple"
function getCategoryKm(category) {
    if (!category) return '';
    const cat = category.toLowerCase().trim();

    // 1. Parse the number directly from strings like "11KM", "3KM", "8 KM" etc.
    //    This covers all Excel-imported categories automatically.
    const kmMatch = cat.match(/(\d+)\s*km/i);
    if (kmMatch) return kmMatch[1];

    // 2. Fallback for registration form category codes (stored in registrations table)
    if (cat === 'u14') return '3';
    if (cat === 'u17') return '5';
    if (cat === 'u19') return '6';
    if (cat === 'open_men') return '11';
    if (cat === 'open_women') return '8';
    if (cat === 'senior') return '1';
    if (cat === 'couple') return '1';

    return '';
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const bib = searchParams.get('bib');

    if (!bib || isNaN(Number(bib))) {
        return new Response('Invalid BIB number', { status: 400 });
    }

    try {
        // ── 1. Fetch participant ──────────────────────────────────────────────
        const result = await query(
            `SELECT bib_number, full_name, race_group, category, organization, date_of_birth, age
       FROM marathon_participants
       WHERE bib_number = $1`,
            [Number(bib)]
        );

        if (result.rows.length === 0) {
            return new Response('Participant not found', { status: 404 });
        }

        const participant = result.rows[0];

        // ── 2. Load the PDF template ──────────────────────────────────────────
        const pdfPath = path.join(
            process.cwd(),
            'Pdf_and_excel',
            'White and Navy Elegant Minimalist Certificate of Achievement_20260904_083441_0000.pdf'
        );

        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        pdfDoc.registerFontkit(fontkit);

        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
        // Page size: 595.5 × 842.25 pts (A4)

        // ── 3. Embed fonts ────────────────────────────────────────────────────
        let nameFont;
        const orderedFontPaths = [
            'C:/Windows/Fonts/georgiab.ttf',   // Georgia Bold
            'C:/Windows/Fonts/georgia.ttf',    // Georgia Regular
            'C:/Windows/Fonts/timesbd.ttf',    // Times New Roman Bold
            'C:/Windows/Fonts/times.ttf',
            'C:/Windows/Fonts/arialbd.ttf',
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/calibri.ttf',
        ];

        for (const fp of orderedFontPaths) {
            if (fs.existsSync(fp)) {
                try {
                    const fontData = fs.readFileSync(fp);
                    nameFont = await pdfDoc.embedFont(fontData, { subset: true });
                    break;
                } catch {
                    // try next
                }
            }
        }
        // Final fallback to built-in
        if (!nameFont) nameFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // ── 4. Prepare values ─────────────────────────────────────────────────
        const name = participant.full_name.toUpperCase();
        const kmStr = getCategoryKm(participant.category); // e.g. "11", "3", "8", "1"

        // Navy colour matching the certificate design
        const navyColor = rgb(0.09, 0.18, 0.39);

        // ── 5. Auto-scale name font to fit within the name underline ──────────
        const maxNameWidth = width * 0.76;
        let nameFontSize = 34;
        while (nameFontSize > 12) {
            const w = nameFont.widthOfTextAtSize(name, nameFontSize);
            if (w <= maxNameWidth) break;
            nameFontSize -= 1;
        }

        // ── 6. Center the name on the page (confirmed at Y = 48% from bottom) ─
        const nameWidth = nameFont.widthOfTextAtSize(name, nameFontSize);
        const nameY = height * 0.48;

        // ── 7. KM number overlay ──────────────────────────────────────────────
        // Template text: "HAS SUCCESSFULLY COMPLETED THE _____ KM"
        // The blank gap sits between:
        //   Right edge of "THE " ≈ X 425  (in 595.5 pt wide page)
        //   Left  edge of "KM"   ≈ X 468
        //   Gap centre            ≈ X 446.5
        // Visually calibrated using browser inspection on test PDFs.
        //
        // Baseline Y of that text row = height * 0.428  (confirmed via inspection)
        const KM_FONT_SIZE = 14;
        const kmTextWidth = nameFont.widthOfTextAtSize(kmStr, KM_FONT_SIZE);
        const kmX = 446.5 - kmTextWidth / 2;   // centred in the gap
        const kmY = height * 0.428;             // on the baseline

        // ── 8. Draw the participant's name ────────────────────────────────────
        page.drawText(name, {
            x: (width - nameWidth) / 2,
            y: nameY,
            size: nameFontSize,
            font: nameFont,
            color: navyColor,
        });

        // ── 9. Draw the KM number in the blank gap ────────────────────────────
        if (kmStr) {
            page.drawText(kmStr, {
                x: kmX,
                y: kmY,
                size: KM_FONT_SIZE,
                font: nameFont,
                color: navyColor,
            });
        }

        // ── 10. Serialize and return as a downloadable PDF ────────────────────
        const modifiedPdfBytes = await pdfDoc.save();

        const safeName = participant.full_name
            .replace(/[^a-z0-9 _\-]/gi, '')
            .trim()
            .replace(/\s+/g, '_');
        const filename = `Marathon_Certificate_BIB_${bib}_${safeName}.pdf`;

        return new Response(modifiedPdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
                'Cache-Control': 'no-store',
                'Content-Length': String(modifiedPdfBytes.byteLength),
            },
        });
    } catch (err) {
        console.error('Certificate generation error:', err);
        return new Response('Failed to generate certificate: ' + err.message, { status: 500 });
    }
}
