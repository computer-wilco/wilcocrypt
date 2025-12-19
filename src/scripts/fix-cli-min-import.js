import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const projectRoot = resolve(import.meta.dirname, '../..');
const distDir = join(projectRoot, 'dist');
const cliMinPath = join(distDir, 'cli.min.js');

if (!existsSync(cliMinPath)) {
  process.exit(0);
}

let code = readFileSync(cliMinPath, 'utf8');

const from = `./wilcocrypt.js`;
const to = `./wilcocrypt.min.js`;

if (!code.includes(from)) {
  process.exit(0);
}

code = code.replace(from, to);

writeFileSync(cliMinPath, code);
