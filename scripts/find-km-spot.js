const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function main() {
    const pdfPath = path.join(__dirname, '../Pdf_and_excel/White and Navy Elegant Minimalist Certificate of Achievement_20260903_195557_0000.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    const y = height * 0.435; // slightly lower

    // Test across the whole page to just SEE the coordinates
    for (let x = 300; x <= 500; x += 20) {
        page.drawText('11', {
            x: x,
            y: y,
            size: 14,
            font,
            color: rgb(1, 0, 0),
        });
        page.drawText(`${x}`, {
            x: x,
            y: y + 15,
            size: 6,
            font,
            color: rgb(0, 1, 0),
        });
    }

    const outputPath = path.join(__dirname, 'test-km-placement3.pdf');
    fs.writeFileSync(outputPath, await pdfDoc.save());
    console.log('Written to', outputPath);
}

main().catch(console.error);
