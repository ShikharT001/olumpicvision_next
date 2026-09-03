/**
 * Generate a test certificate with name placement guides.
 * Run: node scripts/test-certificate.js
 * Then open scripts/test-cert.pdf to check placement.
 */
require('dotenv').config({ path: '.env.local' });

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit').default || require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

async function main() {
    const pdfPath = path.join(__dirname, '../Pdf_and_excel/White and Navy Elegant Minimalist Certificate of Achievement_20260903_195557_0000.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    console.log(`Size: ${width} x ${height}`);

    // Try to embed a Windows font
    let font;
    const fontPaths = [
        'C:/Windows/Fonts/Palatia.ttf',
        'C:/Windows/Fonts/georgia.ttf',
        'C:/Windows/Fonts/Garamond.ttf',
        'C:/Windows/Fonts/times.ttf',
        'C:/Windows/Fonts/arial.ttf',
        'C:/Windows/Fonts/calibri.ttf',
    ];

    for (const fp of fontPaths) {
        if (fs.existsSync(fp)) {
            try {
                const fontData = fs.readFileSync(fp);
                font = await pdfDoc.embedFont(fontData, { subset: true });
                console.log('Using font:', fp);
                break;
            } catch (e) {
                console.log('Failed', fp, e.message);
            }
        }
    }
    if (!font) {
        font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        console.log('Using: HelveticaBold');
    }

    const name = 'SREEVALSAKUMAR PALAZHY';
    const category = 'OPEN MENS - 11KM';
    const bibNo = 'BIB # 101';

    const nameFontSize = 36;
    const subFontSize = 14;

    const navyColor = rgb(0.09, 0.18, 0.39);
    const goldColor = rgb(0.72, 0.53, 0.11);

    // Draw horizontal guide lines every 10% to help identify positions
    for (let pct = 10; pct <= 90; pct += 10) {
        const y = height * (pct / 100);
        page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, color: rgb(1, 0, 0), opacity: 0.4 });
        page.drawText(`${pct}%`, { x: 5, y: y + 2, size: 8, font, color: rgb(1, 0, 0), opacity: 0.6 });
    }

    // Test name at different vertical positions
    const testPositions = [0.48, 0.44, 0.40, 0.36];
    testPositions.forEach((pct, i) => {
        const y = height * pct;
        const nameWidth = font.widthOfTextAtSize(name, nameFontSize);
        page.drawText(name, {
            x: (width - nameWidth) / 2,
            y,
            size: nameFontSize,
            font,
            color: navyColor,
            opacity: 0.3 + i * 0.2,
        });
        page.drawText(`← at ${(pct * 100).toFixed(0)}%`, {
            x: 10,
            y,
            size: 8,
            font,
            color: rgb(0, 0.5, 0),
        });
    });

    const outputPath = path.join(__dirname, 'test-cert.pdf');
    fs.writeFileSync(outputPath, await pdfDoc.save());
    console.log('Written to', outputPath);
}

main().catch(err => { console.error(err); process.exit(1); });
