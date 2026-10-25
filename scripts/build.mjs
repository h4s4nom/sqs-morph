import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const parts = [
  'src/core/namespace.js',
  'src/core/utils.js',
  'src/core/registry.js',
  'src/core/engine.js',
  'src/adapters/product-list.js',
  'src/adapters/product-detail.js',
  'src/adapters/summary.js',
  'src/adapters/auto-layout.js',
  'src/presets/presets.js',
  'src/core/designer.js',
  'src/core/runtime.js'
];
const banner = '/* SQS Morph v0.1.0 | Squarespace 7.1 structured component skin runtime */\n';
const js = banner + parts.map((p) => fs.readFileSync(path.join(root,p),'utf8')).join('\n\n');
const css = fs.readFileSync(path.join(root,'src/styles/sqsmorph.css'),'utf8');
fs.writeFileSync(path.join(root,'dist/sqsmorph.js'), js);
fs.writeFileSync(path.join(root,'dist/sqsmorph.css'), css);
const styleLoader = `/* SQS Morph self-contained bundle */\n(function(){\n  if(!document.getElementById('sqsmorph-runtime-style')){\n    var s=document.createElement('style');\n    s.id='sqsmorph-runtime-style';\n    s.textContent=${JSON.stringify(css)};\n    (document.head||document.documentElement).appendChild(s);\n  }\n})();\n`;
fs.writeFileSync(path.join(root,'dist/sqsmorph.bundle.js'), styleLoader + js);
console.log('Built dist/sqsmorph.js, dist/sqsmorph.css, and dist/sqsmorph.bundle.js');
