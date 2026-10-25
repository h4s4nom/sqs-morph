import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : copy(s, d);
  }
}

copy(path.join(root, 'src/app.js'), path.join(dist, 'app.js'));
copyDir(path.join(root, 'modules'), path.join(dist, 'modules'));
copyDir(path.join(root, 'styles'), path.join(dist, 'styles'));
copyDir(path.join(root, 'config'), path.join(dist, 'config'));
copy(path.join(root, 'test/index.html'), path.join(dist, 'index.html'));
copy(path.join(root, 'test/fixture.html'), path.join(dist, 'fixture.html'));
console.log('Built SQS Morph Product Runtime v0.2.1 → dist/');
