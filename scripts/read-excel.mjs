import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import for xlsx
const XLSX = await import('../node_modules/xlsx/xlsx.mjs').catch(() => null);

if (!XLSX) {
    // Try CommonJS style
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const XLSXcjs = require('../node_modules/xlsx/dist/xlsx.full.min.js');

    const wb = XLSXcjs.readFile(join(__dirname, '../Pdf_and_excel/MARATHON_REPORT_COMBINED.xlsx'));
    console.log('Sheets:', wb.SheetNames);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSXcjs.utils.sheet_to_json(ws, { header: 1 });
    console.log('Headers:', JSON.stringify(data[0]));
    console.log('Row 1:', JSON.stringify(data[1]));
    console.log('Row 2:', JSON.stringify(data[2]));
    console.log('Total rows:', data.length);

    if (wb.SheetNames.length > 1) {
        wb.SheetNames.forEach(name => {
            const s = wb.Sheets[name];
            const d = XLSXcjs.utils.sheet_to_json(s, { header: 1 });
            console.log(`\nSheet "${name}" headers:`, JSON.stringify(d[0]));
        });
    }
}
