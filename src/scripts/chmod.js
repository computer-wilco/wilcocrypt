import { chmodSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const projectRoot = resolve(import.meta.dirname, '../..');
const distDir = join(projectRoot, 'dist');

if (process.platform === 'win32') {
  process.exit(0);
}

if (!existsSync(distDir)) {
  process.exit(0);
}

const files = [
  join(distDir, 'cli.js'),
  join(distDir, 'cli.min.js')
];

for (const file of files) {
  if (existsSync(file)) {
    chmodSync(file, 0o755);
  }
}
