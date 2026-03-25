import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pricingPath = path.join(__dirname, '..', 'pricing.txt');
const fileContent = fs.readFileSync(pricingPath, 'utf-8');
const lines = fileContent.trim().split('\n');

console.log('Total lines:', lines.length);
console.log('\nFirst 5 lines:');
lines.slice(0, 6).forEach((line, i) => {
  console.log(`Line ${i}:`, JSON.stringify(line));
  const match = line.match(/^([^,]+),"([^"]*)"$/);
  console.log(`  Match:`, match ? 'YES' : 'NO');
  if (match) {
    console.log(`  Name: "${match[1]}", Price: "${match[2]}"`);
  }
  console.log('');
});
