import { execFileSync } from 'child_process';
import { platform, arch } from 'process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, '../..');

const platformMap = {
  linux: 'linux',
  win32: 'windows',
  darwin: 'macos'
};

const archMap = {
  x64: 'x64',
  arm64: 'arm64'
};

const p = platformMap[platform];
const a = archMap[arch];

if (!p || !a) {
  console.error(`Unsupported platform/arch: ${platform} ${arch}`);
  process.exit(1);
}

const nodePath = join(
  projectRoot,
  'node-binaries',
  `${p}-${a}`,
  platform === 'win32' ? 'node.exe' : 'node'
);

const seaConfigPath = join(
  projectRoot,
  'sea',
  'sea-config.json'
);

if (!existsSync(nodePath)) {
  console.error(`Node binary not found: ${nodePath}`);
  console.error(`Expected folder: node-binaries/${p}-${a}/`);
  process.exit(1);
}

if (!existsSync(seaConfigPath)) {
  console.error(`SEA config not found: ${seaConfigPath}`);
  process.exit(1);
}

console.log(`Using Node binary: ${nodePath}`);

execFileSync(
  nodePath,
  ['--experimental-sea-config', seaConfigPath],
  {
    stdio: 'inherit',
    cwd: projectRoot
  }
);
