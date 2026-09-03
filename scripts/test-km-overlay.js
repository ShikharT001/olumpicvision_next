/**
 * Generate a test certificate with KM number placement.
 * Tests all category codes to confirm correct KM values.
 * Run: node scripts/test-km-overlay.js
 */
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit').default || require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

// Same logic as the route
function getCategoryKm(category) {
    if (!category) return '';
    const cat = category.toLowerCase().trim();
    if (cat === 'u14') return '3';
    if (cat === 'u17') return '5';
    if (cat === 'u19') return '6';
    if (cat === 'open_men') return '11';
    if (cat === 'open_women') return '8';
    if (cat === 'senior') return '1';
    if (cat === 'couple') return '1';
    const match = cat.match(/(\d+)\s*km/i);
    if (match) return match[1];
    const numMatch = cat.match(/(\d+)/);
    return numMatch ? numMatch[1] : '';
}

async function generateCert(category, name) {
    const pdfPath = path.join(__dirname, '../Pdf_and_excel/White and Navy Elegant Minimalist Certificate of Achievement_20260903_195557_0000.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    let nameFont;
    const fontPaths = [
        'C:/Windows/Fonts/georgiab.ttf',
        'C:/Windows/Fonts/georgia.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
        'C:/Windows/Fonts/arial.ttf',
    ];
    for (const fp of fontPaths) {
        if (fs.existsSync(fp)) {
            try {
                nameFont = await pdfDoc.embedFont(fs.readFileSync(fp), { subset: true });
                break;
            } catch { }
        }
    }
    if (!nameFont) nameFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const navyColor = rgb(0.09, 0.18, 0.39);
    const kmStr = getCategoryKm(category);

    // Name
    const maxNameWidth = width * 0.76;
    let nameFontSize = 34;
    while (nameFontSize > 12) {
        if (nameFont.widthOfTextAtSize(name, nameFontSize) <= maxNameWidth) break;
        nameFontSize -= 1;
    }
    const nameWidth = nameFont.widthOfTextAtSize(name, nameFontSize);
    page.drawText(name, {
        x: (width - nameWidth) / 2,
        y: height * 0.48,
        size: nameFontSize,
        font: nameFont,
        color: navyColor,
    });

    // KM
    const KM_FONT_SIZE = 14;
    const kmTextWidth = nameFont.widthOfTextAtSize(kmStr, KM_FONT_SIZE);
    const kmX = 446.5 - kmTextWidth / 2;
    const kmY = height * 0.428;
    if (kmStr) {
        page.drawText(kmStr, {
            x: kmX,
            y: kmY,
            size: KM_FONT_SIZE,
            font: nameFont,
            color: navyColor,
        });
    }

    return pdfDoc.save();
}

async function main() {
    const testCases = [
        { category: 'open_men', name: 'RAJESH KUMAR SHARMA', label: 'open_men' },
        { category: 'open_women', name: 'PRIYA DEVI SINGH', label: 'open_women' },
        { category: 'u14', name: 'ANANYA PATEL', label: 'u14' },
        { category: 'u17', name: 'RAHUL MEHTA', label: 'u17' },
        { category: 'u19', name: 'NEHA GUPTA', label: 'u19' },
        { category: 'senior', name: 'SURESH PATIL', label: 'senior' },
        { category: 'couple', name: 'AMIT & SUNITA JOSHI', label: 'couple' },
    ];

    console.log('Category → KM mapping:');
    testCases.forEach(t => {
        console.log(`  ${t.category.padEnd(12)} → ${getCategoryKm(t.category)} km`);
    });

    // Generate a test cert for open_men (11km) as the visual check
    const testCase = testCases[0];
    const pdfBytes = await generateCert(testCase.category, testCase.name);
    const outPath = path.join(__dirname, 'test-km-overlay.pdf');
    fs.writeFileSync(outPath, pdfBytes);
    console.log(`\nTest certificate written: ${outPath}`);
    console.log(`Category: ${testCase.category} → KM: ${getCategoryKm(testCase.category)}`);
    console.log(`Name: ${testCase.name}`);
}

main().catch(console.error);
