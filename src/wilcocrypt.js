import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'crypto';
import { encode as msgpack_encode, decode as msgpack_decode } from '@msgpack/msgpack';
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
  constructor(message, code = 'WILCOCRYPT_ERROR') {
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
wilcocrypt._.VERSION = '2.0.0';

/**
 * Minimum allowed password length.
 * @type {number}
 */
wilcocrypt._.MIN_PASSWORD_LENGTH = 6;

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
 * @param {string} cipherHex
 * @param {string} authTagHex
 * @param {Buffer} key
 * @param {Buffer} iv
 * @returns {Buffer}
 */
wilcocrypt._.decryptData = function (cipherHex, authTagHex, key, iv) {
  wilcocrypt._.assertKeyAndIv(key, iv);

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    return Buffer.concat([
      decipher.update(Buffer.from(cipherHex, 'hex')),
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
   Packing layer (internal)
========================= */

/**
 * Packs an object using MessagePack + gzip and writes it to disk.
 *
 * @param {Object} data
 * @param {string} filePath
 */
wilcocrypt._.packToFile = function (data, filePath) {
  const packed = msgpack_encode(data);
  const compressed = gzipSync(packed, { level: 9 });
  writeFileSync(filePath, compressed);
};

/**
 * Reads and unpacks a WilcoCrypt file from disk.
 *
 * @param {string} filePath
 * @returns {Object}
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
 * Encrypts a file and writes a `.enc` file to disk.
 *
 * @param {string} filePath
 * @param {string} password
 */
wilcocrypt.encryptFile = function (filePath, password) {
  wilcocrypt._.assertPassword(password);

  const fileData = readFileSync(filePath);
  const iv = randomBytes(12);
  const salt = randomBytes(16);

  const key = scryptSync(password, salt, 32);

  const { ciphertext, authTag } = wilcocrypt._.encryptData(fileData, key, iv);

  const envelope = {
    payload: ciphertext.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    version: wilcocrypt._.VERSION
  };

  wilcocrypt._.packToFile(envelope, `${filePath}.enc`);
};

/**
 * Decrypts a `.enc` file and returns its contents.
 *
 * @param {string} filePath
 * @param {string} password
 * @returns {Buffer}
 */
wilcocrypt.decryptFile = function (filePath, password) {
  wilcocrypt._.assertPassword(password);

  const envelope = wilcocrypt._.unpackFromFile(filePath);

  if (envelope.version !== wilcocrypt._.VERSION) {
    throw new WilcoCryptError(
      `Unsupported WilcoCrypt version: ${envelope.version}`,
      'UNSUPPORTED_VERSION'
    );
  }

  if (!envelope.payload || !envelope.authTag || !envelope.salt || !envelope.iv) {
    throw new WilcoCryptError(
      'Corrupted encrypted file (missing required fields)',
      'CORRUPTED_FILE'
    );
  }

  const key = scryptSync(
    password,
    Buffer.from(envelope.salt, 'hex'),
    32
  );

  return wilcocrypt._.decryptData(
    envelope.payload,
    envelope.authTag,
    key,
    Buffer.from(envelope.iv, 'hex')
  );
};

export default wilcocrypt;
