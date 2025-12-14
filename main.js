import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'crypto';
import { encode as msgpack_encode, decode as msgpack_decode } from '@msgpack/msgpack';
import { gzipSync, gunzipSync } from 'zlib';
import { readFileSync, writeFileSync } from 'fs';

const wilcocrypt = {};
wilcocrypt._ = {};

/* =========================
   Internal constants
========================= */

/**
 * Internal Wilcocrypt version.
 * Used for compatibility checks during decryption.
 * @private
 * @type {string}
 */
wilcocrypt._.VERSION = '2.0.0';

/* =========================
   Internal helpers
========================= */

/**
 * Validates AES-256-CBC key and IV buffers.
 *
 * @private
 * @param {Buffer} key - 32-byte encryption key
 * @param {Buffer} iv - 16-byte initialization vector
 * @throws {Error} If key or IV are invalid
 */
wilcocrypt._.assertKeyAndIv = function (key, iv) {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('Invalid encryption key (expected 32-byte Buffer)');
  }
  if (!Buffer.isBuffer(iv) || iv.length !== 16) {
    throw new Error('Invalid IV (expected 16-byte Buffer)');
  }
};

/* =========================
   Crypto layer (internal)
========================= */

/**
 * Encrypts plaintext using AES-256-CBC.
 *
 * @private
 * @param {string} plainText - UTF-8 plaintext
 * @param {Buffer} key - 32-byte encryption key
 * @param {Buffer} iv - 16-byte initialization vector
 * @returns {string} Encrypted data as a hex string
 */
wilcocrypt._.encryptData = function (plainText, key, iv) {
  wilcocrypt._.assertKeyAndIv(key, iv);

  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final()
  ]);

  return encrypted.toString('hex');
};

/**
 * Decrypts AES-256-CBC encrypted hex data.
 *
 * @private
 * @param {string} cipherHex - Encrypted data as hex string
 * @param {Buffer} key - 32-byte encryption key
 * @param {Buffer} iv - 16-byte initialization vector
 * @returns {string} Decrypted UTF-8 plaintext
 * @throws {Error} If decryption fails (invalid password or corrupted data)
 */
wilcocrypt._.decryptData = function (cipherHex, key, iv) {
  wilcocrypt._.assertKeyAndIv(key, iv);

  try {
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, 'hex')),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch {
    throw new Error('Decryption failed (invalid password or corrupted data)');
  }
};

/* =========================
   Packing layer (internal)
========================= */

/**
 * Packs an object using MessagePack and gzip compression,
 * then writes it to disk.
 *
 * @private
 * @param {Object} data - Serializable object
 * @param {string} filePath - Output file path
 */
wilcocrypt._.packToFile = function (data, filePath) {
  const packed = msgpack_encode(data);
  const compressed = gzipSync(packed, { level: 9 });
  writeFileSync(filePath, compressed);
};

/**
 * Reads a packed Wilcocrypt file from disk and unpacks it.
 *
 * @private
 * @param {string} filePath - Input file path
 * @returns {Object} Unpacked object
 */
wilcocrypt._.unpackFromFile = function (filePath) {
  const file = readFileSync(filePath);
  const decompressed = gunzipSync(file);
  return msgpack_decode(decompressed);
};

/* =========================
   Public API
========================= */

/**
 * Encrypts a UTF-8 text file and writes an encrypted `.enc` file to disk.
 *
 * @public
 * @param {string} filePath - Path to the input file
 * @param {string} password - Password used for key derivation (scrypt)
 * @throws {Error} If the input file cannot be read
 */
wilcocrypt.encryptFile = function (filePath, password) {
  const fileData = readFileSync(filePath, 'utf8');

  const iv = randomBytes(16);
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);

  const encrypted = wilcocrypt._.encryptData(fileData, key, iv);

  const envelope = {
    payload: encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    version: wilcocrypt._.VERSION
  };

  wilcocrypt._.packToFile(envelope, `${filePath}.enc`);
};

/**
 * Decrypts a Wilcocrypt `.enc` file and returns its plaintext contents.
 *
 * @public
 * @param {string} filePath - Path to the encrypted file
 * @param {string} password - Password used for key derivation (scrypt)
 * @returns {string} Decrypted file contents (UTF-8)
 * @throws {Error} If the version is missing or unsupported
 * @throws {Error} If the password is invalid or data is corrupted
 */
wilcocrypt.decryptFile = function (filePath, password) {
  const envelope = wilcocrypt._.unpackFromFile(filePath);

  if (!envelope.version) {
    throw new Error('Missing Wilcocrypt version');
  }

  if (envelope.version !== wilcocrypt._.VERSION) {
    throw new Error(
      `Unsupported Wilcocrypt version: ${envelope.version}`
    );
  }

  const key = scryptSync(password, Buffer.from(envelope.salt, 'hex'), 32);
  const iv = Buffer.from(envelope.iv, 'hex');

  return wilcocrypt._.decryptData(envelope.payload, key, iv);
};

export default wilcocrypt;
