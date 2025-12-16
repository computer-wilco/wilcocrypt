import { Command } from 'commander';
import wilcocrypt from './wilcocrypt.js';

/* =========================
   Helpers
========================= */

function promptPassword(promptText = 'Password: ') {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(promptText);

    let password = '';

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    function onData(char) {
      if (char === '\r' || char === '\n') {
        stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        resolve(password);
        return;
      }

      if (char === '\u0003') {
        stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.exit(1);
      }

      if (char === '\u007f' || char === '\b') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }

      password += char;
      stdout.write('*');
    }

    stdin.on('data', onData);
  });
}

/* =========================
   CLI setup
========================= */

const program = new Command();

program
  .name('wilcocrypt')
  .description('File encryption tool (AES-256-CBC)')
  .version(wilcocrypt._.VERSION, '--version', 'Show version')

  .option('-e, --encrypt <file>', 'Encrypt file')
  .option('-d, --decrypt <file>', 'Decrypt file')
  .option('--unpack <file>', '[internal] Unpack encrypted file and print raw envelope')

  .helpOption('-h, --help', 'Display help');

program.parse(process.argv);

const options = program.opts();

/* =========================
   Validation
========================= */

const actions = [
  options.encrypt,
  options.decrypt,
  options.unpack
].filter(Boolean);

if (actions.length === 0) {
  program.help();
}

if (actions.length > 1) {
  console.error('error: please specify only one action (-e, -d or --unpack)');
  process.exit(1);
}

/* =========================
   Actions
========================= */

(async () => {
  try {
    if (options.encrypt) {
      const password = await promptPassword('Encryption password: ');
      wilcocrypt.encryptFile(options.encrypt, password);
      console.log(`Encrypted: ${options.encrypt}.enc`);
      return;
    }

    if (options.decrypt) {
      const password = await promptPassword('Decryption password: ');
      const result = wilcocrypt.decryptFile(options.decrypt, password);
      console.log(`${result}`);
      return;
    }

    if (options.unpack) {
      const envelope = wilcocrypt._.unpackFromFile(options.unpack);
      console.log(JSON.stringify(envelope, null, 2));
      return;
    }
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
})();
