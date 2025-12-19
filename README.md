# WilcoCrypt

**WilcoCrypt** is a simple and secure file encryption tool for Node.js.  
It offers both a clean programmatic API and a practical command-line interface (CLI) for everyday use.

The library focuses on strong defaults, portability, and predictable behavior across environments
(including low-end devices such as Raspberry Pi and Android/Termux).

---

## Features

- AES-256-GCM authenticated encryption
- Password-based key derivation using scrypt
- MessagePack + gzip for compact encrypted files
- Built-in versioning and compatibility checks
- Clear and consistent error handling
- Clean separation between public API and internal helpers
- Command-line interface (CLI) for quick file encryption and decryption

---

## Installation

```bash
npm install wilcocrypt
```

### CLI Installation

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

---

## Internal helpers (optional)

Advanced users can access internal helpers via `wilcocrypt._`.
These APIs are considered internal and may change between versions.

```js
const iv = Buffer.from('...');
const key = Buffer.from('...');
const encrypted = wilcocrypt._.encryptData(Buffer.from('Hello'), key, iv);
```

---

## CLI Usage

Once installed globally:

```bash
# Encrypt a file
wilcocrypt -e document.txt
wilcocrypt --encrypt document.txt

# Decrypt a file
wilcocrypt -d document.txt.enc
wilcocrypt --decrypt document.txt.enc

# Internal: unpack raw encrypted envelope
wilcocrypt --unpack document.txt.enc
```

The CLI will securely prompt for a password (input is masked).

---

## Version

- Current version: **2.0.0**
- Version 1.x is deprecated and should not be used

---

## License

WilcoCrypt is released under the **GPL-3.0-only** license.

You are free to:
- Use the software for any purpose
- Study how it works and modify it
- Redistribute the software
- Distribute modified versions

Under the condition that:
- Any distributed derivative work is also licensed under GPL-3.0-only
- The source code remains available to users

This software is provided **without any warranty**.
Use it at your own risk.

For full license text, see:
https://www.gnu.org/licenses/gpl-3.0.html
