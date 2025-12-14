# WilcoCrypt

**WilcoCrypt** is a simple and secure file encryption tool for Node.js.  
It provides a clear public API for encrypting and decrypting files, while advanced users can access internal helpers via \`wilcocrypt._\` if needed.

---

## Features

- AES-256-CBC file encryption
- Scrypt password-based key derivation
- MessagePack + gzip for compact storage
- Version support (\`2.0.0\`)
- Safe error handling for wrong passwords or corrupted data
- Clear separation between public API and internal helpers

---

## Installation

```bash
npm install wilcocrypt
```

---

## Usage

```js
import wilcocrypt from 'wilcocrypt';

// Encrypt a file
wilcocrypt.encryptFile('document.txt', 'myStrongPassword');

// Decrypt a file
const content = wilcocrypt.decryptFile('document.txt.enc', 'myStrongPassword');
console.log(content);
```

### Internal functions (optional)

Advanced users can access internal helpers via `wilcocrypt._`:

```js
const iv = Buffer.from('...');
const key = Buffer.from('...');
const encrypted = wilcocrypt._.encryptData('Hello', key, iv);
```

---

## License

WilcoCrypt is released under the **[GPL-3.0-only](https://www.gnu.org/licenses/gpl-3.0.html)** license.  

In short:  
- You may use, modify, and distribute the software  
- Derived works must also be released under the same license  
- No warranty; use at your own risk

---

## Version

- Current version: **2.0.0**
- Version 1.0.0 is deprecated; do not use it
