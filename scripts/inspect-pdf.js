/**
 * Inspect the PDF certificate to understand its structure.
 * Run: node scripts/inspect-pdf.js
 */
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function main() {
    const pdfPath = path.join(__dirname, '../Pdf_and_excel/White and Navy Elegant Minimalist Certificate of Achievement_20260903_195557_0000.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    console.log('Pages:', pdfDoc.getPageCount());
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    console.log(`Page size: ${width.toFixed(1)} x ${height.toFixed(1)} pts`);
    console.log(`Page size: ${(width / 72).toFixed(2)}" x ${(height / 72).toFixed(2)}"`);
    console.log(`Page size: ${(width * 2.54 / 72).toFixed(2)}cm x ${(height * 2.54 / 72).toFixed(2)}cm`);

    // Check for form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log('\nForm fields:', fields.length);
    fields.forEach(f => console.log(' -', f.constructor.name, '|', f.getName()));

    // Check annotations
    const annots = page.node.lookupMaybe(page.node.context.enumerateIndirectObjects(), 'Annots');
    console.log('\nNote: Page rotation:', page.getRotation().angle);
}

main().catch(console.error);
