# WilcoCrypt Documentation

Complete reference for the WilcoCrypt API, CLI, and binary format.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [encryptData](#encryptdata)
  - [decryptData](#decryptdata)
  - [encryptFile](#encryptfile)
  - [decryptFile](#decryptfile)
  - [encryptDataAsync](#encryptdataasync)
  - [decryptDataAsync](#decryptdataasync)
  - [encryptFileAsync](#encryptfileasync)
  - [decryptFileAsync](#decryptfileasync)
  - [encryptFileStream](#encryptfilestream)
  - [decryptFileStream](#decryptfilestream)
  - [Internal Namespace (`_`)](#internal-namespace-_)
- [CLI Reference](#cli-reference)
- [Binary Payload Format](#binary-payload-format)
- [Error Handling](#error-handling)
- [TypeScript](#typescript)
- [Security Notes](#security-notes)

---

## Installation

```bash
npm install wilcocrypt
```

Requires Node.js 18 or later (uses `stream/promises` and `fs/promises`).

---

## Quick Start

```js
import wilcocrypt from "wilcocrypt";

// Encrypt a Buffer
const data = Buffer.from("Hello, world!");
const encrypted = wilcocrypt.encryptData(data, "my-password");

// Decrypt it back
const decrypted = wilcocrypt.decryptData(encrypted, "my-password");
console.log(decrypted.toString()); // Hello, world!

// Encrypt a file (writes file.txt.enc)
wilcocrypt.encryptFile("file.txt", "my-password");

// Decrypt a file (returns Buffer)
const contents = wilcocrypt.decryptFile("file.txt.enc", "my-password");

// Decrypt a file directly to disk
wilcocrypt.decryptFile("file.txt.enc", "my-password", "output.txt");

// Async API
const encryptedAsync = await wilcocrypt.encryptDataAsync(
  Buffer.from("Hello!"),
  "my-password",
);

const decryptedAsync = await wilcocrypt.decryptDataAsync(
  encryptedAsync,
  "my-password",
);

// Async file API
await wilcocrypt.encryptFileAsync(
  "file.txt",
  "my-password",
);

await wilcocrypt.decryptFileAsync(
  "file.txt.enc",
  "my-password",
  "output.txt",
);
```

---

## API Reference

### `encryptData(plaindata, password, gzip?)`

Encrypts a Buffer using password-based AES-256-GCM. The password is never stored; a random salt is generated for every encryption call.

| Parameter   | Type      | Default | Description                                |
| ----------- | --------- | ------- | ------------------------------------------ |
| `plaindata` | `Buffer`  | —       | Raw data to encrypt                        |
| `password`  | `string`  | —       | Password for key derivation (min. 6 chars) |
| `gzip`      | `boolean` | `true`  | Compress data before encryption            |

**Returns:** `Buffer` — the encrypted payload in the [binary format](#binary-payload-format).

**Throws:** `WilcoCryptError` with code `WEAK_PASSWORD` if the password is too short.

```js
const encrypted = wilcocrypt.encryptData(Buffer.from("secret"), "passw0rd");
```

---

### `decryptData(encryptedBuffer, password, gzip?)`

Decrypts a payload produced by `encryptData`. Validates the header and version before attempting decryption.

| Parameter         | Type      | Default | Description                     |
| ----------------- | --------- | ------- | ------------------------------- |
| `encryptedBuffer` | `Buffer`  | —       | Payload from `encryptData`      |
| `password`        | `string`  | —       | Password used during encryption |
| `gzip`            | `boolean` | `true`  | Decompress after decryption     |

**Returns:** `Buffer` — the original plaintext data.

**Throws:**

| Code                | Reason                                         |
| ------------------- | ---------------------------------------------- |
| `WEAK_PASSWORD`     | Password shorter than 6 characters             |
| `INVALID_HEADER`    | Not a valid WilcoCrypt payload                 |
| `VERSION_MISMATCH`  | Payload was encrypted with a different version |
| `DECRYPTION_FAILED` | Wrong password, tampered or corrupt data       |

```js
const plain = wilcocrypt.decryptData(encrypted, "passw0rd");
```

---

### `encryptFile(filePath, password, gzip?)`

Reads a file, encrypts it, and writes the result to `<filePath>.enc`. Uses `encryptData` internally, so the entire file is loaded into memory. For large files, use [`encryptFileStream`](#encryptfilestream) instead.

| Parameter  | Type      | Default | Description                 |
| ---------- | --------- | ------- | --------------------------- |
| `filePath` | `string`  | —       | Path to the source file     |
| `password` | `string`  | —       | Password for key derivation |
| `gzip`     | `boolean` | `true`  | Compress before encryption  |

**Returns:** `void`

```js
wilcocrypt.encryptFile("document.pdf", "passw0rd");
// Creates document.pdf.enc
```

---

### `decryptFile(filePath, password, outputPath?, gzip?)`

Decrypts a `.enc` file. If `outputPath` is provided, the result is written to disk and `undefined` is returned. Otherwise the decrypted `Buffer` is returned.

| Parameter    | Type      | Default     | Description                                |
| ------------ | --------- | ----------- | ------------------------------------------ |
| `filePath`   | `string`  | —           | Path to the `.enc` file                    |
| `password`   | `string`  | —           | Password used during encryption            |
| `outputPath` | `string`  | `undefined` | Optional path to write decrypted output to |
| `gzip`       | `boolean` | `true`      | Decompress after decryption                |

> The legacy 3-argument form `decryptFile(filePath, password, gzip)` is still fully supported, but will be deprecated in the next release.

**Returns:** `Buffer` when no `outputPath` is given, `undefined` otherwise.

**Throws:** `WilcoCryptError` with code `INVALID_FILE_EXTENSION` if `filePath` does not end in `.enc`.

```js
// Return as Buffer
const buf = wilcocrypt.decryptFile("document.pdf.enc", "passw0rd");

// Write directly to disk
wilcocrypt.decryptFile("document.pdf.enc", "passw0rd", "document.pdf");
```

---

### `encryptDataAsync(plaindata, password, gzip?)`

Asynchronous version of `encryptData`.

Encrypts a Buffer using password-based AES-256-GCM. The password is never stored; a random salt is generated for every encryption call.

| Parameter   | Type      | Default | Description                                |
| ----------- | --------- | ------- | ------------------------------------------ |
| `plaindata` | `Buffer`  | —       | Raw data to encrypt                        |
| `password`  | `string`  | —       | Password for key derivation (min. 6 chars) |
| `gzip`      | `boolean` | `true`  | Compress data before encryption            |

**Returns:** `Promise<Buffer>` — the encrypted payload in the binary format.

**Throws:** `WilcoCryptError` with code `WEAK_PASSWORD` if the password is too short.

```js
const encrypted = await wilcocrypt.encryptDataAsync(
  Buffer.from("secret"),
  "passw0rd",
);
```

---

### `decryptDataAsync(encryptedBuffer, password, gzip?)`

Asynchronous version of `decryptData`.

Decrypts a payload produced by `encryptDataAsync` or `encryptData`. Validates the header and version before attempting decryption.

| Parameter         | Type      | Default | Description                     |
| ----------------- | --------- | ------- | ------------------------------- |
| `encryptedBuffer` | `Buffer`  | —       | Payload from `encryptData`      |
| `password`        | `string`  | —       | Password used during encryption |
| `gzip`            | `boolean` | `true`  | Decompress after decryption     |

**Returns:** `Promise<Buffer>` — the original plaintext data.

**Throws:**

| Code                | Reason                                         |
| ------------------- | ---------------------------------------------- |
| `WEAK_PASSWORD`     | Password shorter than 6 characters             |
| `INVALID_HEADER`    | Not a valid WilcoCrypt payload                 |
| `VERSION_MISMATCH`  | Payload was encrypted with a different version |
| `DECRYPTION_FAILED` | Wrong password, tampered or corrupt data       |

```js
const plain = await wilcocrypt.decryptDataAsync(
  encrypted,
  "passw0rd",
);
```

---

### `encryptFileAsync(filePath, password, gzip?)`

Asynchronous version of `encryptFile`.

Reads a file, encrypts it, and writes the result to `<filePath>.enc`.

| Parameter  | Type      | Default | Description                 |
| ---------- | --------- | ------- | --------------------------- |
| `filePath` | `string`  | —       | Path to the source file     |
| `password` | `string`  | —       | Password for key derivation |
| `gzip`     | `boolean` | `true`  | Compress before encryption  |

**Returns:** `Promise<void>`

```js
await wilcocrypt.encryptFileAsync(
  "document.pdf",
  "passw0rd",
);
```

---

### `decryptFileAsync(filePath, password, outputPath?, gzip?)`

Asynchronous version of `decryptFile`.

If `outputPath` is provided, the result is written to disk and `undefined` is returned. Otherwise the decrypted `Buffer` is returned.

| Parameter    | Type      | Default     | Description                                |
| ------------ | --------- | ----------- | ------------------------------------------ |
| `filePath`   | `string`  | —           | Path to the `.enc` file                    |
| `password`   | `string`  | —           | Password used during encryption            |
| `outputPath` | `string`  | `undefined` | Optional path to write decrypted output to |
| `gzip`       | `boolean` | `true`      | Decompress after decryption                |

**Returns:** `Promise<Buffer>` when no `outputPath` is given, `Promise<undefined>` otherwise.

**Throws:** Same error codes as `decryptFile`.

```js
// Return as Buffer
const buf = await wilcocrypt.decryptFileAsync(
  "document.pdf.enc",
  "passw0rd",
);

// Write directly to disk
await wilcocrypt.decryptFileAsync(
  "document.pdf.enc",
  "passw0rd",
  "document.pdf",
);
```

---

### `encryptFileStream(inputPath, outputPath, password, gzip?)`

Streaming equivalent of `encryptFile`. Reads from `inputPath` and writes to `outputPath` chunk by chunk — suitable for large files where loading everything into memory is impractical.

| Parameter    | Type      | Default | Description                   |
| ------------ | --------- | ------- | ----------------------------- |
| `inputPath`  | `string`  | —       | Path to the source file       |
| `outputPath` | `string`  | —       | Path for the encrypted output |
| `password`   | `string`  | —       | Password for key derivation   |
| `gzip`       | `boolean` | `true`  | Compress before encryption    |

**Returns:** `Promise<void>`

```js
await wilcocrypt.encryptFileStream(
  "bigfile.zip",
  "bigfile.zip.enc",
  "passw0rd",
);
```

---

### `decryptFileStream(inputPath, outputPath, password, gzip?)`

Streaming equivalent of `decryptFile`. Header and version are validated before the stream starts. If decryption fails at any point, the partially written output file is deleted automatically.

| Parameter    | Type      | Default | Description                       |
| ------------ | --------- | ------- | --------------------------------- |
| `inputPath`  | `string`  | —       | Path to the `.enc` file           |
| `outputPath` | `string`  | —       | Path to write decrypted output to |
| `password`   | `string`  | —       | Password used during encryption   |
| `gzip`       | `boolean` | `true`  | Decompress after decryption       |

**Returns:** `Promise<void>`

**Throws:** Same error codes as `decryptData`, plus automatic cleanup of `outputPath` on failure.

```js
await wilcocrypt.decryptFileStream(
  "bigfile.zip.enc",
  "bigfile.zip",
  "passw0rd",
);
```

---

### Internal Namespace (`_`)

The `wilcocrypt._` namespace exposes internal helpers. These are not intended for normal use but are part of the public surface for advanced use cases and testing.

| Member                                                | Type       | Description                                                   |
| ----------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| `_.VERSION`                                           | `string`   | Current version string, embedded in every payload             |
| `_.MIN_PASSWORD_LENGTH`                               | `number`   | Minimum accepted password length (6)                          |
| `_.HEADER`                                            | `Buffer`   | 10-byte magic bytes identifying a WilcoCrypt payload          |
| `_.WilcoCryptError`                                   | `class`    | The error class (also importable from TypeScript types)       |
| `_.assertKeyAndIv(key, iv)`                           | `function` | Throws if key or IV are not valid Buffers of the right length |
| `_.assertPassword(password)`                          | `function` | Throws `WEAK_PASSWORD` if password is too short               |
| `_.constantTimeEqual(a, b)`                           | `function` | Constant-time Buffer comparison, returns `boolean`            |
| `_.encryptData(plainData, key, iv)`                   | `function` | Raw AES-256-GCM encryption, returns `{ ciphertext, authTag }` |
| `_.decryptData(cipherBuffer, authTagBuffer, key, iv)` | `function` | Raw AES-256-GCM decryption, returns `Buffer`                  |

---

## CLI Reference

Install globally or use via `npx`:

```bash
npm install -g wilcocrypt
wilcocrypt --help
```

### Options

| Flag                   | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `-e, --encrypt <file>` | Encrypt the given file, writes `<file>.enc`           |
| `-d, --decrypt <file>` | Decrypt the given `.enc` file                         |
| `-o, --output <file>`  | Write decrypted output to `<file>` instead of stdout  |
| `--stdout`             | Explicitly write decrypted output to stdout (default) |
| `--version`            | Show WilcoCrypt version                               |
| `-h, --help`           | Show help                                             |

Only one of `-e` or `-d` may be used at a time. The `--output` and `--stdout` flags are mutually exclusive. `--output` is only valid with `-d`.

### Examples

```bash
# Encrypt a file
wilcocrypt -e secret.txt
# → prompts for password, writes secret.txt.enc

# Decrypt to stdout (pipe-friendly)
wilcocrypt -d secret.txt.enc
# → prompts for password, writes to stdout

# Decrypt to a file
wilcocrypt -d secret.txt.enc -o secret.txt
# → prompts for password, writes to secret.txt
```

Passwords are entered interactively with character masking (`*`). The CLI requires a TTY; piping passwords in is intentionally not supported.

---

## Binary Payload Format

Every payload produced in WilcoCrypt v2.2.x has the following binary layout:

```
[ HEADER    ]  10 bytes   — magic bytes: 23 9 12 3 15 3 18 25 16 20
[ VERSION   ]  dynamic    — UTF-8 version string (e.g. "2.2.0"), 5 bytes for current version
[ salt      ]  16 bytes   — random salt for scrypt key derivation
[ iv        ]  12 bytes   — random IV for AES-256-GCM
[ ciphertext]  variable   — AES-256-GCM encrypted (and optionally gzip-compressed) data
[ authTag   ]  16 bytes   — GCM authentication tag
```

The auth tag is placed at the end to allow the streaming API to append it after the pipeline finishes, without needing to seek backwards in the output stream.

> **Compatibility note:** The format changed between v2.1.x and v2.2.0. Files encrypted with v2.1.x cannot be decrypted with v2.2.0 and will throw a `VERSION_MISMATCH` or `INVALID_HEADER` error.

---

## Error Handling

All errors thrown by WilcoCrypt are instances of `WilcoCryptError`, which extends `Error` with a `code` property.

```js
import wilcocrypt from "wilcocrypt";
const { WilcoCryptError } = wilcocrypt._;

try {
  wilcocrypt.decryptData(payload, "wrong-password");
} catch (err) {
  if (err instanceof WilcoCryptError) {
    console.error(err.code); // e.g. DECRYPTION_FAILED
    console.error(err.message); // human-readable
  }
}
```

### Error Codes

| Code                     | Thrown by                                     | Cause                                                  |
| ------------------------ | --------------------------------------------- | ------------------------------------------------------ |
| `WEAK_PASSWORD`          | All public methods                            | Password shorter than 6 characters                     |
| `INVALID_HEADER`         | `decryptData`, `decryptFile`, stream variants | Payload does not start with the WilcoCrypt magic bytes |
| `VERSION_MISMATCH`       | `decryptData`, `decryptFile`, stream variants | Payload version does not match current version         |
| `DECRYPTION_FAILED`      | `decryptData`, `decryptFile`, stream variants | Wrong password, tampered data, or corruption           |
| `INVALID_FILE_EXTENSION` | `decryptFile`                                 | File path does not end with `.enc`                     |
| `INVALID_KEY`            | `_.assertKeyAndIv`                            | Key is not a 32-byte Buffer                            |
| `INVALID_IV`             | `_.assertKeyAndIv`                            | IV is not a 12-byte Buffer                             |
| `NO_TTY`                 | CLI password prompt                           | stdin is not a TTY                                     |

---

## TypeScript

WilcoCrypt ships with `wilcocrypt.d.ts`. No `@types` package needed.

```ts
import wilcocrypt, {
  WilcoCryptError,
} from "wilcocrypt";

const encrypted: Buffer =
  wilcocrypt.encryptData(
    Buffer.from("hi"),
    "passw0rd",
  );

const encryptedAsync: Buffer =
  await wilcocrypt.encryptDataAsync(
    Buffer.from("hi"),
    "passw0rd",
  );

// decryptFile overloads
const buf: Buffer =
  wilcocrypt.decryptFile(
    "file.enc",
    "passw0rd",
  );

wilcocrypt.decryptFile(
  "file.enc",
  "passw0rd",
  "output.txt",
);

// async overloads
const asyncBuf: Buffer =
  await wilcocrypt.decryptFileAsync(
    "file.enc",
    "passw0rd",
  );

await wilcocrypt.decryptFileAsync(
  "file.enc",
  "passw0rd",
  "output.txt",
);

// streams
await wilcocrypt.encryptFileStream(
  "in.txt",
  "in.txt.enc",
  "passw0rd",
);

await wilcocrypt.decryptFileStream(
  "in.txt.enc",
  "out.txt",
  "passw0rd",
);
```

---

## Security Notes

- **Key derivation** uses [scrypt](https://nodejs.org/api/crypto.html#cryptoscryptsyncpassword-salt-keylen-options) with a 16-byte random salt generated fresh for every encryption. The same password will produce a different key each time.
- **Authenticated encryption** via AES-256-GCM means any tampering with the ciphertext or auth tag will cause decryption to fail with `DECRYPTION_FAILED`.
- **No password is stored** anywhere in the payload. There is no way to recover a lost password.
- **The `gzip` flag must match** between encryption and decryption. If data was encrypted without compression (`gzip: false`), decryption must also use `gzip: false`.
- See [SECURITY.md](./SECURITY.md) for the responsible disclosure policy.
