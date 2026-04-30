# WilcoCrypt

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/standard/semistandard)

**WilcoCrypt** is a small, secure, and predictable encryption library for Node.js.

It is designed around strong defaults, minimal dependencies, and consistent behavior across environments — from servers to low-end devices like Raspberry Pi.

---

## Features

- AES-256-GCM authenticated encryption
- Password-based key derivation using scrypt
- Optional gzip compression before encryption
- Compact binary format using MessagePack
- Built-in versioning and compatibility checks
- Clear and consistent error handling
- Simple, dependency-light design
- CLI for quick file encryption and decryption

---

## Installation

```bash
npm install wilcocrypt
```

### CLI (global)

```bash
npm install -g wilcocrypt
```

---

## Usage (Node.js)

```js
import wilcocrypt from 'wilcocrypt';

// Encrypt a file
wilcocrypt.encryptFile('document.txt', 'myStrongPassword');

// Decrypt a file
const content = wilcocrypt.decryptFile('document.txt.enc', 'myStrongPassword');

console.log(content);
```

### Working with Buffers

```js
import wilcocrypt from 'wilcocrypt';

const data = Buffer.from('Hello world');

// Encrypt
const encrypted = wilcocrypt.encryptData(data, 'password');

// Decrypt
const decrypted = wilcocrypt.decryptData(encrypted, 'password');

console.log(decrypted.toString());
```

---

## CLI Usage

```bash
# Encrypt
wilcocrypt -e file.txt
wilcocrypt --encrypt file.txt

# Decrypt
wilcocrypt -d file.txt.enc
wilcocrypt --decrypt file.txt.enc
```

The CLI will securely prompt for a password (input is masked).

---

## Internal API

Advanced users can access internal helpers via:

```js
wilcocrypt._
```

These APIs are **not stable** and may change between versions.

---

## Format Overview

Encrypted output is stored as a MessagePack-encoded object containing:

- payload (ciphertext, hex)
- authTag (hex)
- salt (hex)
- iv (hex)
- version

---

## Version

- Current version: **2.1.1**
- Encrypted data must match the exact version

---

## Security Notes

- Always use strong, unique passwords
- Losing the password means permanent data loss
- Do not modify encrypted files manually
- Compression can be disabled if not needed

---

## License

Licensed under **GPL-3.0-only**.
