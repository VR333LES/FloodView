import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelFilePath = path.join(__dirname, '../../Street Flooding Manhattan.xlsx');
const outputPath = path.join(__dirname, '../../public/floodData.json');

const workbook = XLSX.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
console.log('Excel converted to JSON successfully!');