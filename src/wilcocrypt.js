import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Main WilcoCrypt namespace.
 */
const wilcocrypt = {};

/**
 * Internal WilcoCrypt utilities and constants.
 */
wilcocrypt._ = {};

/* =========================
   Custom Error
========================= */

/**
 * Custom error class for all WilcoCrypt-specific errors.
 */
class WilcoCryptError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} [code=WILCOCRYPT_ERROR] - Machine-readable error code
   */
  constructor (message, code = 'WILCOCRYPT_ERROR') {
    super(message);
    this.name = 'WilcoCryptError';
    this.code = code;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WilcoCryptError);
    }
  }
}

wilcocrypt._.WilcoCryptError = WilcoCryptError;

/* =========================
   Internal constants
========================= */

/**
 * Internal WilcoCrypt version.
 * Must match exactly during decryption.
 * @type {string}
 */
wilcocrypt._.VERSION = '2.1.1';

/**
 * Minimum allowed password length.
 * @type {number}
 */
wilcocrypt._.MIN_PASSWORD_LENGTH = 6;

/**
 * Internal header for encrypted payloads.
 * @type {Buffer}
 */
wilcocrypt._.HEADER = Buffer.from([23, 9, 12, 3, 15, 3, 18, 25, 16, 20]);

/* =========================
   Internal helpers
========================= */

/**
 * Validates AES-256-GCM key and IV.
 *
 * @param {Buffer} key
 * @param {Buffer} iv
 * @throws {WilcoCryptError}
 */
wilcocrypt._.assertKeyAndIv = function (key, iv) {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new WilcoCryptError(
      'Invalid encryption key (expected 32-byte Buffer)',
      'INVALID_KEY'
    );
  }

  if (!Buffer.isBuffer(iv) || iv.length !== 12) {
    throw new WilcoCryptError(
      'Invalid IV (expected 12-byte Buffer for GCM)',
      'INVALID_IV'
    );
  }
};

/**
 * Validates password strength.
 *
 * @param {string} password
 * @throws {WilcoCryptError}
 */
wilcocrypt._.assertPassword = function (password) {
  if (typeof password !== 'string' || password.length < wilcocrypt._.MIN_PASSWORD_LENGTH) {
    throw new WilcoCryptError(
      `Password must be at least ${wilcocrypt._.MIN_PASSWORD_LENGTH} characters`,
      'WEAK_PASSWORD'
    );
  }
};

/**
 * Constant-time buffer comparison.
 * Reserved for future extensions.
 *
 * @param {Buffer} a
 * @param {Buffer} b
 * @returns {boolean}
 */
wilcocrypt._.constantTimeEqual = function (a, b) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
};

/* =========================
   Crypto layer (internal)
========================= */

/**
 * Encrypts raw data using AES-256-GCM.
 *
 * @param {Buffer} plainData
 * @param {Buffer} key
 * @param {Buffer} iv
 * @returns {{ciphertext: Buffer, authTag: Buffer}}
 */
wilcocrypt._.encryptData = function (plainData, key, iv) {
  wilcocrypt._.assertKeyAndIv(key, iv);

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainData),
    cipher.final()
  ]);

  return {
    ciphertext: encrypted,
    authTag: cipher.getAuthTag()
  };
};

/**
 * Decrypts AES-256-GCM encrypted data.
 *
 * @param {Buffer} cipherBuffer
 * @param {Buffer} authTagBuffer
 * @param {Buffer} key
 * @param {Buffer} iv
 * @returns {Buffer}
 */
wilcocrypt._.decryptData = function (cipherBuffer, authTagBuffer, key, iv) {
  wilcocrypt._.assertKeyAndIv(key, iv);

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTagBuffer);

    return Buffer.concat([
      decipher.update(cipherBuffer),
      decipher.final()
    ]);
  } catch {
    throw new WilcoCryptError(
      'Decryption failed (invalid password, corrupted data, or tampered file)',
      'DECRYPTION_FAILED'
    );
  }
};

/* =========================
   Public API
========================= */

/**
 * Encrypts data using password-based AES-256-GCM.
 *
 * @param {Buffer} plaindata - Raw data to encrypt
 * @param {string} password - Password used for key derivation
 * @param {boolean} [gzip=true] - Whether to compress data before encryption
 * @returns {Buffer} Binary-encoded encrypted payload
 * @throws {WilcoCryptError} If password is invalid
 */
wilcocrypt.encryptData = function (plaindata, password, gzip = true) {
  wilcocrypt._.assertPassword(password);

  const gzipData = gzip ? gzipSync(plaindata) : plaindata;
  const iv = randomBytes(12);
  const salt = randomBytes(16);

  const key = scryptSync(password, salt, 32);

  const { ciphertext, authTag } = wilcocrypt._.encryptData(gzipData, key, iv);

  return Buffer.concat([
    wilcocrypt._.HEADER, // 10 bytes
    salt, // 16 bytes
    iv, // 12 bytes
    authTag, // 16 bytes
    ciphertext // the rest
  ]);
};

/**
 * Decrypts encrypted data using password-based AES-256-GCM.
 *
 * @param {Buffer} encryptedData - Binary-encoded encrypted payload
 * @param {string} password - Password used for decryption
 * @param {boolean} [gzip=true] - Whether to decompress after decryption
 * @returns {Buffer} Decrypted raw data
 * @throws {WilcoCryptError} On invalid format, wrong password, version mismatch, or decompression failure
 */
wilcocrypt.decryptData = function (encryptedBuffer, password, gzip = true) {
  wilcocrypt._.assertPassword(password);

  const fileHeader = encryptedBuffer.subarray(0, 10);
  if (!fileHeader.equals(wilcocrypt._.HEADER)) {
    throw new WilcoCryptError('Invalid WilcoCrypt header', 'INVALID_HEADER');
  }

  let offset = 10;
  const salt = encryptedBuffer.subarray(offset, offset += 16);
  const iv = encryptedBuffer.subarray(offset, offset += 12);
  const authTag = encryptedBuffer.subarray(offset, offset += 16);
  const ciphertext = encryptedBuffer.subarray(offset);

  const key = scryptSync(password, salt, 32);

  const decrypted = wilcocrypt._.decryptData(ciphertext, authTag, key, iv);

  return gzip ? gunzipSync(decrypted) : decrypted;
};

/**
 * Encrypts a file and writes the result to `<filePath>.enc`.
 *
 * @param {string} filePath - Path to the file to encrypt
 * @param {string} password - Password used for encryption
 * @param {boolean} [gzip=true] - Whether to compress before encryption
 * @returns {void}
 * @throws {WilcoCryptError} If password is invalid
 */
wilcocrypt.encryptFile = function (filePath, password, gzip = true) {
  const fileData = readFileSync(filePath);
  const encryptedData = wilcocrypt.encryptData(fileData, password, gzip);
  writeFileSync(`${filePath}.enc`, encryptedData);
};

/**
 * Decrypts an encrypted `.enc` file.
 *
 * @param {string} filePath - Path to the `.enc` file
 * @param {string} password - Password used for decryption
 * @param {boolean} [gzip=true] - Whether to decompress after decryption
 * @returns {Buffer} Decrypted file contents
 * @throws {WilcoCryptError} If file extension is invalid or decryption fails
 */
wilcocrypt.decryptFile = function (filePath, password, gzip = true) {
  if (!filePath.endsWith('.enc')) {
    throw new WilcoCryptError(
      'Invalid file extension (expected .enc)',
      'INVALID_FILE_EXTENSION'
    );
  }

  const encryptedData = readFileSync(filePath);
  return wilcocrypt.decryptData(encryptedData, password, gzip);
};

export default wilcocrypt;
