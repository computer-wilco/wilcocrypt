# WilcoCrypt

**WilcoCrypt** is a simple and secure file encryption tool for Node.js.  
It provides a clear public API for encrypting and decrypting files, while advanced users can access internal helpers via `wilcocrypt._` if needed.

---

## Features

- AES-256-CBC file encryption
- Scrypt password-based key derivation
- MessagePack + gzip for compact storage
- Version support
- Safe error handling for wrong passwords or corrupted data
- Clear separation between public API and internal helpers
- Command-line interface (CLI) for quick file encryption/decryption

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

### Internal functions (optional)

Advanced users can access internal helpers via `wilcocrypt._`:

```js
const iv = Buffer.from('...');
const key = Buffer.from('...');
const encrypted = wilcocrypt._.encryptData('Hello', key, iv);
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


# Internal: unpack raw envelope
wilcocrypt --unpack document.txt.enc
```

The CLI will securely prompt for a password (input is masked).

---

## License

WilcoCrypt is released under the **[GPL-3.0-only](https://www.gnu.org/licenses/gpl-3.0.html)** license.  

**In short:**  
- You can use WilcoCrypt for personal, educational, or commercial purposes.  
- You may modify the code and distribute your modifications.  
- Any software that includes WilcoCrypt (or derivatives) must also be released under GPL-3.0-only.  
- You **cannot** distribute it under a proprietary license.  
- There is **no warranty**; use the software at your own risk.

---

## Version

- Current version: **2.0.0**
- Version 1.0.0 is deprecated; do not use it
