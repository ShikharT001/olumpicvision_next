/**
 * Final precision test for KM number placement.
 * Tests multiple y-factors and uses the confirmed x=445
 * Run: node scripts/find-km-final.js
 */
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function main() {
    const pdfPath = path.join(__dirname, '../Pdf_and_excel/White and Navy Elegant Minimalist Certificate of Achievement_20260904_083441_0000.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    console.log(`Page dimensions: ${width} x ${height} pts`);

    // Test Y values around the confirmed X=445 zone
    // Y 0.428 was suggested by the subagent
    const yFactors = [0.425, 0.428, 0.430, 0.433, 0.435];

    yFactors.forEach((yf, i) => {
        const y = height * yf;
        // Draw "11" at x=430 (left side of blank, so they don't overlap)
        const xBase = 290 + i * 30;
        page.drawText('11', {
            x: xBase,
            y: y,
            size: 14,
            font,
            color: rgb(0, 0, 1), // blue
        });
        page.drawText(`y=${yf}`, {
            x: xBase,
            y: y + 16,
            size: 6,
            font,
            color: rgb(1, 0.5, 0),
        });
    });

    // Also draw a red "11" at the confirmed X=445 with each yFactor
    yFactors.forEach((yf) => {
        const y = height * yf;
        page.drawText('11', {
            x: 445,
            y: y,
            size: 14,
            font,
            color: rgb(1, 0, 0),
        });
    });

    const outputPath = path.join(__dirname, 'test-km-final.pdf');
    fs.writeFileSync(outputPath, await pdfDoc.save());
    console.log('Written to', outputPath);
}

main().catch(console.error);
