import fs from 'node:fs';
const required = [
  'src/app.js',
  'modules/product-grid.js',
  'styles/product-grid.css',
  'config/sm_demo_product_v02.json',
  'vercel.json'
];
for (const file of required) {
  if (!fs.existsSync(new URL('../' + file, import.meta.url))) throw new Error('Missing ' + file);
}
const css = fs.readFileSync(new URL('../styles/product-grid.css', import.meta.url), 'utf8');
for (const preset of ['bento-featured','editorial-overlay','split-catalog']) {
  if (!css.includes(`data-sqm-product="${preset}"`)) throw new Error('Missing CSS preset ' + preset);
}
const config = JSON.parse(fs.readFileSync(new URL('../config/sm_demo_product_v02.json', import.meta.url), 'utf8'));
if (config.features[0].type !== 'product-grid') throw new Error('Bad demo config');
console.log('Self-test passed.');
