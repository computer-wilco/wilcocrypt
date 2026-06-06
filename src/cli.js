#!/usr/bin/env node
import { Command } from "commander";
import wilcocrypt from "./wilcocrypt.js";

/* =========================
   Helpers
========================= */

function promptPassword(promptText = "Password: ") {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    if (!stdin.isTTY) {
      throw new wilcocrypt._.WilcoCryptError(
        "Password prompt requires a TTY",
        "NO_TTY",
      );
    }

    stdout.write(promptText);

    let password = "";

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    function onData(char) {
      if (char === "\r" || char === "\n") {
        stdout.write("\n");
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        resolve(password);
        return;
      }

      if (char === "\u0003") {
        stdout.write("\n");
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.exit(1);
      }

      if (char === "\u007f" || char === "\b") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write("\b \b");
        }
        return;
      }

      password += char;
      stdout.write("*");
    }

    stdin.on("data", onData);
  });
}

/* =========================
   CLI setup
========================= */

const program = new Command();

program
  .name("wilcocrypt")
  .description("File encryption tool")
  .version(wilcocrypt._.VERSION, "--version", "Show version")

  .option("-e, --encrypt <file>", "Encrypt file")
  .option("-d, --decrypt <file>", "Decrypt file")
  .option(
    "-o, --output <file>",
    "Write output to file instead of stdout (decrypt only)",
  )
  .option(
    "--stdout",
    "Write decrypted output to stdout (default behavior, explicit flag)",
  )

  .helpOption("-h, --help", "Display help");

program.parse(process.argv);

const options = program.opts();

/* =========================
   Validation
========================= */

const actions = [options.encrypt, options.decrypt].filter(Boolean);

if (actions.length === 0) {
  program.help();
}

if (actions.length > 1) {
  console.error("error: please specify only one action (-e or -d)");
  process.exit(1);
}

if (options.output && options.stdout) {
  console.error("error: --output and --stdout are mutually exclusive");
  process.exit(1);
}

if (options.output && options.encrypt) {
  console.error("error: --output is only supported for decryption");
  process.exit(1);
}

/* =========================
   Actions
========================= */

(async () => {
  try {
    if (options.encrypt) {
      const password = await promptPassword("Encryption password: ");
      wilcocrypt.encryptFile(options.encrypt, password);
      console.log(`Encrypted: ${options.encrypt}.enc`);
      return;
    }

    if (options.decrypt) {
      const password = await promptPassword("Decryption password: ");

      if (options.output) {
        wilcocrypt.decryptFile(options.decrypt, password, options.output);
        console.log(`Decrypted: ${options.output}`);
      } else {
        const result = wilcocrypt.decryptFile(options.decrypt, password);
        process.stdout.write(result);
      }
    }
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
})();
