// Fails if orb.min.js grows past its gzip budget, so size creep is a deliberate choice.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = 12 * 1024;
const bytes = gzipSync(readFileSync(new URL('../orb.min.js', import.meta.url)), { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`orb.min.js: ${kb(bytes)} gzipped (budget ${kb(BUDGET)})`);
if (bytes > BUDGET) { console.error('Over budget. Trim the library, or raise BUDGET in scripts/size.mjs on purpose.'); process.exit(1); }
