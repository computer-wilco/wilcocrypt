# WilcoCrypt

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/standard/semistandard)

> **The `master` branch may be unstable during active development.**
> For production use, always install from [npm](https://www.npmjs.com/package/wilcocrypt) or use a tagged [GitHub Release](https://github.com/computer-wilco/wilcocrypt/releases).

A simple, modern Node.js encryption library and CLI tool. AES-256-GCM, password-based key derivation via scrypt, optional gzip compression, and a streaming API for large files.

---

## Features

- AES-256-GCM authenticated encryption
- scrypt key derivation with a random salt per encryption
- Optional gzip compression before encryption
- Streaming API for large files (`encryptFileStream` / `decryptFileStream`)
- CLI with interactive password prompt
- TypeScript types included
- semistandard code style

---

## Installation

```bash
npm install wilcocrypt
```

Requires Node.js 18 or later.

---

## Quick Start

```js
import wilcocrypt from 'wilcocrypt';

// Encrypt / decrypt a Buffer
const encrypted = wilcocrypt.encryptData(Buffer.from('Hello!'), 'my-password');
const decrypted = wilcocrypt.decryptData(encrypted, 'my-password');

// Encrypt a file → writes file.txt.enc
wilcocrypt.encryptFile('file.txt', 'my-password');

// Decrypt to Buffer
const buf = wilcocrypt.decryptFile('file.txt.enc', 'my-password');

// Decrypt directly to disk
wilcocrypt.decryptFile('file.txt.enc', 'my-password', 'output.txt');

// Stream API (memory-efficient for large files)
await wilcocrypt.encryptFileStream('big.zip', 'big.zip.enc', 'my-password');
await wilcocrypt.decryptFileStream('big.zip.enc', 'big.zip', 'my-password');
```

---

## CLI

```bash
# Encrypt
wilcocrypt -e secret.txt
# → prompts for password, writes secret.txt.enc

# Decrypt to stdout
wilcocrypt -d secret.txt.enc

# Decrypt to a file
wilcocrypt -d secret.txt.enc -o secret.txt
```

See `wilcocrypt --help` for all options.

---

## Binary Payload Format

```
[ HEADER (10) ] [ VERSION (dynamic) ] [ salt (16) ] [ iv (12) ] [ ciphertext ] [ authTag (16) ]
```

The auth tag is appended at the end for streaming compatibility. See [DOCS.md](./DOCS.md#binary-payload-format) for the full layout.

> **Note:** The format changed in v2.2.0. Payloads from v2.1.x are not compatible.

---

## Error Handling

All errors are instances of `WilcoCryptError` with a machine-readable `code` property.

```js
import wilcocrypt from 'wilcocrypt';
const { WilcoCryptError } = wilcocrypt._;

try {
  wilcocrypt.decryptData(payload, 'wrong');
} catch (err) {
  if (err instanceof WilcoCryptError) {
    console.error(err.code);    // e.g. DECRYPTION_FAILED
    console.error(err.message);
  }
}
```

Common codes: `WEAK_PASSWORD`, `INVALID_HEADER`, `VERSION_MISMATCH`, `DECRYPTION_FAILED`, `INVALID_FILE_EXTENSION`.

---

## Documentation

Full API reference, CLI docs, payload format, TypeScript usage, and security notes: **[DOCS.md](./DOCS.md)**

Changelog: **[CHANGELOG.md](./CHANGELOG.md)**

---

## License

Licensed under **GPL-3.0-only**.
