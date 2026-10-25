import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(root,'dist/sqsmorph.js'),'utf8');
const css = fs.readFileSync(path.join(root,'dist/sqsmorph.css'),'utf8');
const required = [
  'data-sqsp-section="product-list"',
  'data-sqsp-section="product-detail"',
  'data-sqsp-block="summary"',
  'data-sqsp-section="auto-layout"',
  'product-editorial',
  'detail-sticky',
  'summary-cards',
  'team-hover',
  'testimonial-luxe',
  'SQSMorph'
];
const missing = required.filter((x) => !js.includes(x) && !css.includes(x));
if (missing.length) {
  console.error('Missing required artifacts:', missing);
  process.exit(1);
}
const cssBalance = (css.match(/{/g)||[]).length - (css.match(/}/g)||[]).length;
if (cssBalance !== 0) {
  console.error('CSS brace imbalance:', cssBalance);
  process.exit(1);
}
console.log('SQS Morph self-test passed.');
console.log('JS bytes:', Buffer.byteLength(js));
console.log('CSS bytes:', Buffer.byteLength(css));
