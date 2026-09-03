const XLSX = require('xlsx');
const fs = require('fs');
const wb = XLSX.readFile('./Pdf_and_excel/MARATHON_REPORT_COMBINED.xlsx');

let output = '';
wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    output += '\n===== Sheet: ' + name + ' =====\n';
    output += 'Total rows: ' + data.length + '\n';
    for (let i = 0; i < Math.min(15, data.length); i++) {
        output += 'Row' + i + ': ' + JSON.stringify(data[i]) + '\n';
    }
});

fs.writeFileSync('./scripts/excel-output.txt', output);
console.log('Written to scripts/excel-output.txt');
