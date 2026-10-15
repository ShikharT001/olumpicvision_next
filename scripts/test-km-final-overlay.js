/**
 * Final certificate test — uses the exact category strings from the Excel import.
 * Run: node scripts/test-km-final-overlay.js
 */
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit').default || require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

// Same logic as the route
function getCategoryKm(category) {
    if (!category) return '';
    const cat = category.toLowerCase().trim();
    const kmMatch = cat.match(/(\d+)\s*km/i);
    if (kmMatch) return kmMatch[1];
    if (cat === 'u14') return '3';
    if (cat === 'u17') return '5';
    if (cat === 'u19') return '6';
    if (cat === 'open_men') return '11';
    if (cat === 'open_women') return '8';
    if (cat === 'senior') return '1';
    if (cat === 'couple') return '1';
    return '';
}

// Test all real Excel category strings
const categories = [
    'OPEN MENS - 11KM',
    'OPEN WOMENS - 8KM',
    'U19 BOYS - 6KM',
    'U19 GIRLS - 6KM',
    'U17 BOYS - 5KM',
    'U17 GIRLS - 5KM',
    'U14 BOYS - 3KM',
    'U14 GIRLS - 3KM',
    '55+ SENIOR CITIZEN - 1KM MENS',
    '55+ SENIOR CITIZEN - 1KM WOMENS',
    'COUPLES - 1KM',
];

console.log('Category → KM extraction test:');
let allPassed = true;
const expected = { 'OPEN MENS - 11KM': '11', 'OPEN WOMENS - 8KM': '8', 'U19 BOYS - 6KM': '6', 'U19 GIRLS - 6KM': '6', 'U17 BOYS - 5KM': '5', 'U17 GIRLS - 5KM': '5', 'U14 BOYS - 3KM': '3', 'U14 GIRLS - 3KM': '3', '55+ SENIOR CITIZEN - 1KM MENS': '1', '55+ SENIOR CITIZEN - 1KM WOMENS': '1', 'COUPLES - 1KM': '1' };
categories.forEach(cat => {
    const km = getCategoryKm(cat);
    const pass = km === expected[cat];
    if (!pass) allPassed = false;
    console.log(`  ${pass ? '✅' : '❌'} "${cat}" → "${km}" (expected "${expected[cat]}")`);
});
console.log(allPassed ? '\n✅ All tests passed!' : '\n❌ Some tests FAILED');

// Generate a test certificate using the "OPEN MENS - 11KM" category
async function generateCert() {
    const pdfPath = path.join(__dirname, '../Pdf_and_excel/White and Navy Elegant Minimalist Certificate of Achievement_20260904_083441_0000.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    let nameFont;
    for (const fp of ['C:/Windows/Fonts/georgiab.ttf', 'C:/Windows/Fonts/georgia.ttf', 'C:/Windows/Fonts/arialbd.ttf', 'C:/Windows/Fonts/arial.ttf']) {
        if (fs.existsSync(fp)) {
            try { nameFont = await pdfDoc.embedFont(fs.readFileSync(fp), { subset: true }); break; } catch { }
        }
    }
    if (!nameFont) nameFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const navyColor = rgb(0.09, 0.18, 0.39);
    const category = 'OPEN MENS - 11KM';
    const name = 'SREEVALSAKUMAR PALAZHY';
    const kmStr = getCategoryKm(category);

    // Name
    let nameFontSize = 34;
    while (nameFontSize > 12 && nameFont.widthOfTextAtSize(name, nameFontSize) > width * 0.76) nameFontSize--;
    const nameWidth = nameFont.widthOfTextAtSize(name, nameFontSize);
    page.drawText(name, { x: (width - nameWidth) / 2, y: height * 0.48, size: nameFontSize, font: nameFont, color: navyColor });

    // KM number
    const KM_FONT_SIZE = 14;
    const kmTextWidth = nameFont.widthOfTextAtSize(kmStr, KM_FONT_SIZE);
    const kmX = 446.5 - kmTextWidth / 2;
    const kmY = height * 0.428;
    page.drawText(kmStr, { x: kmX, y: kmY, size: KM_FONT_SIZE, font: nameFont, color: navyColor });

    const outPath = path.join(__dirname, 'test-km-final-overlay.pdf');
    fs.writeFileSync(outPath, await pdfDoc.save());
    console.log(`\n📄 Test certificate: ${outPath}`);
    console.log(`   Name: ${name}`);
    console.log(`   Category: ${category} → KM: ${kmStr}`);
    console.log(`   KM text drawn at X=${kmX.toFixed(1)}, Y=${kmY.toFixed(1)}`);
}

generateCert().catch(console.error);
