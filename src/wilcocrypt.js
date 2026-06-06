import {
  randomBytes,
  scryptSync,
  scrypt,
  createCipheriv,
  createDecipheriv,
} from "crypto";
import { gzipSync, gunzipSync, createGzip, createGunzip } from "zlib";
import {
  readFileSync,
  writeFileSync,
  createReadStream,
  createWriteStream,
  promises as fsPromises,
} from "fs";
import { pipeline } from "stream/promises";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

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
  constructor(message, code = "WILCOCRYPT_ERROR") {
    super(message);
    this.name = "WilcoCryptError";
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
wilcocrypt._.VERSION = "2.2.0";

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
      "Invalid encryption key (expected 32-byte Buffer)",
      "INVALID_KEY",
    );
  }

  if (!Buffer.isBuffer(iv) || iv.length !== 12) {
    throw new WilcoCryptError(
      "Invalid IV (expected 12-byte Buffer)",
      "INVALID_IV",
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
  if (
    typeof password !== "string" ||
    password.length < wilcocrypt._.MIN_PASSWORD_LENGTH
  ) {
    throw new WilcoCryptError(
      `Password must be at least ${wilcocrypt._.MIN_PASSWORD_LENGTH} characters`,
      "WEAK_PASSWORD",
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

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainData), cipher.final()]);

  return {
    ciphertext: encrypted,
    authTag: cipher.getAuthTag(),
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
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTagBuffer);

    return Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
  } catch {
    throw new WilcoCryptError(
      "Decryption failed (invalid password, corrupted data, or tampered file)",
      "DECRYPTION_FAILED",
    );
  }
};

/* =========================
   Public API
========================= */

/**
 * Encrypts data using password-based AES-256-GCM.
 *
 * Output format:
 * [HEADER (10 bytes)] + [VERSION (dynamic)] + [salt (16)] + [iv (12)] + [ciphertext] + [authTag (16)]
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
  const versionBuf = Buffer.from(wilcocrypt._.VERSION);

  return Buffer.concat([
    wilcocrypt._.HEADER, // 10 bytes
    versionBuf, // dynamic
    salt, // 16 bytes
    iv, // 12 bytes
    ciphertext, // variable
    authTag, // 16 bytes (at the end for streaming compatibility)
  ]);
};

/**
 * Encrypts data asynchronously using password-based AES-256-GCM.
 *
 * Output format:
 * [HEADER (10 bytes)] + [VERSION (dynamic)] + [salt (16)] + [iv (12)] + [ciphertext] + [authTag (16)]
 *
 * @param {Buffer} plaindata - Raw data to encrypt
 * @param {string} password - Password used for key derivation
 * @param {boolean} [gzip=true] - Whether to compress data before encryption
 * @returns {Promise<Buffer>} Binary-encoded encrypted payload
 * @throws {WilcoCryptError} If password is invalid
 */
wilcocrypt.encryptDataAsync = async function (
  plaindata,
  password,
  gzip = true,
) {
  wilcocrypt._.assertPassword(password);

  const gzipData = gzip ? gzipSync(plaindata) : plaindata;

  const iv = randomBytes(12);
  const salt = randomBytes(16);

  const key = await scryptAsync(password, salt, 32);

  const { ciphertext, authTag } = wilcocrypt._.encryptData(gzipData, key, iv);

  const versionBuf = Buffer.from(wilcocrypt._.VERSION);

  return Buffer.concat([
    wilcocrypt._.HEADER,
    versionBuf,
    salt,
    iv,
    ciphertext,
    authTag,
  ]);
};

/**
 * Decrypts encrypted data using password-based AES-256-GCM.
 *
 * Validates internal header and version, then extracts:
 * salt, iv, authTag and ciphertext from the binary payload.
 *
 * @param {Buffer} encryptedBuffer - Binary-encoded encrypted payload
 * @param {string} password - Password used for decryption
 * @param {boolean} [gzip=true] - Whether to decompress after decryption
 * @returns {Buffer} Decrypted raw data
 * @throws {WilcoCryptError} On invalid header, version mismatch, wrong password, or corrupted data
 */
wilcocrypt.decryptData = function (encryptedBuffer, password, gzip = true) {
  wilcocrypt._.assertPassword(password);

  const versionBuf = Buffer.from(wilcocrypt._.VERSION);
  let offset = 0;

  const fileHeader = encryptedBuffer.subarray(
    offset,
    (offset += wilcocrypt._.HEADER.length),
  );
  if (!fileHeader.equals(wilcocrypt._.HEADER)) {
    throw new WilcoCryptError("Invalid WilcoCrypt header", "INVALID_HEADER");
  }

  const fileVersion = encryptedBuffer.subarray(
    offset,
    (offset += versionBuf.length),
  );
  if (!fileVersion.equals(versionBuf)) {
    throw new WilcoCryptError("Version mismatch", "VERSION_MISMATCH");
  }

  const salt = encryptedBuffer.subarray(offset, (offset += 16));
  const iv = encryptedBuffer.subarray(offset, (offset += 12));

  // authTag are the last 16 bytes; ciphertext is everything in between
  const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
  const ciphertext = encryptedBuffer.subarray(
    offset,
    encryptedBuffer.length - 16,
  );

  const key = scryptSync(password, salt, 32);

  const decrypted = wilcocrypt._.decryptData(ciphertext, authTag, key, iv);

  return gzip ? gunzipSync(decrypted) : decrypted;
};

/**
 * Decrypts encrypted data asynchronously using password-based AES-256-GCM.
 *
 * Validates internal header and version, then extracts:
 * salt, iv, authTag and ciphertext from the binary payload.
 *
 * @param {Buffer} encryptedBuffer - Binary-encoded encrypted payload
 * @param {string} password - Password used for decryption
 * @param {boolean} [gzip=true] - Whether to decompress after decryption
 * @returns {Promise<Buffer>} Decrypted raw data
 * @throws {WilcoCryptError} On invalid header, version mismatch, wrong password, or corrupted data
 */
wilcocrypt.decryptDataAsync = async function (
  encryptedBuffer,
  password,
  gzip = true,
) {
  wilcocrypt._.assertPassword(password);

  const versionBuf = Buffer.from(wilcocrypt._.VERSION);
  let offset = 0;

  const fileHeader = encryptedBuffer.subarray(
    offset,
    (offset += wilcocrypt._.HEADER.length),
  );

  if (!fileHeader.equals(wilcocrypt._.HEADER)) {
    throw new WilcoCryptError("Invalid WilcoCrypt header", "INVALID_HEADER");
  }

  const fileVersion = encryptedBuffer.subarray(
    offset,
    (offset += versionBuf.length),
  );

  if (!fileVersion.equals(versionBuf)) {
    throw new WilcoCryptError("Version mismatch", "VERSION_MISMATCH");
  }

  const salt = encryptedBuffer.subarray(offset, (offset += 16));
  const iv = encryptedBuffer.subarray(offset, (offset += 12));

  const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);

  const ciphertext = encryptedBuffer.subarray(
    offset,
    encryptedBuffer.length - 16,
  );

  const key = await scryptAsync(password, salt, 32);

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
 * Encrypts a file asynchronously and writes the result to `<filePath>.enc`.
 *
 * @param {string} filePath - Path to the file to encrypt
 * @param {string} password - Password used for encryption
 * @param {boolean} [gzip=true] - Whether to compress before encryption
 * @returns {Promise<void>}
 * @throws {WilcoCryptError} If password is invalid
 */
wilcocrypt.encryptFileAsync = async function (filePath, password, gzip = true) {
  const fileData = await fsPromises.readFile(filePath);

  const encryptedData = await wilcocrypt.encryptDataAsync(
    fileData,
    password,
    gzip,
  );

  await fsPromises.writeFile(`${filePath}.enc`, encryptedData);
};

/**
 * Decrypts an encrypted `.enc` file.
 *
 * If `outputPath` is provided, the decrypted data is written to that file
 * and `undefined` is returned. Otherwise the decrypted Buffer is returned.
 *
 * @param {string} filePath - Path to the `.enc` file
 * @param {string} password - Password used for decryption
 * @param {string|boolean} [outputPath] - Optional path to write decrypted output to.
 *   If omitted (or `true`/`false`), the function returns the decrypted Buffer instead.
 * @param {boolean} [gzip=true] - Whether to decompress after decryption
 * @returns {Buffer|undefined} Decrypted file contents, or undefined if outputPath was given
 * @throws {WilcoCryptError} If file extension is invalid or decryption fails
 */
wilcocrypt.decryptFile = function (
  filePath,
  password,
  outputPath,
  gzip = true,
) {
  // Support legacy 3-argument form: decryptFile(filePath, password, gzip?)
  if (typeof outputPath === "boolean") {
    gzip = outputPath;
    outputPath = undefined;
  }

  if (!filePath.endsWith(".enc")) {
    throw new WilcoCryptError(
      "Invalid file extension (expected .enc)",
      "INVALID_FILE_EXTENSION",
    );
  }

  const encryptedData = readFileSync(filePath);
  const decrypted = wilcocrypt.decryptData(encryptedData, password, gzip);

  if (outputPath) {
    writeFileSync(outputPath, decrypted);
    return;
  }

  return decrypted;
};

/**
 * Decrypts an encrypted `.enc` file asynchronously.
 *
 * If `outputPath` is provided, the decrypted data is written to that file
 * and `undefined` is returned. Otherwise the decrypted Buffer is returned.
 *
 * @param {string} filePath - Path to the `.enc` file
 * @param {string} password - Password used for decryption
 * @param {string|boolean} [outputPath] - Optional output path
 * @param {boolean} [gzip=true] - Whether to decompress after decryption
 * @returns {Promise<Buffer|undefined>}
 * @throws {WilcoCryptError}
 */
wilcocrypt.decryptFileAsync = async function (
  filePath,
  password,
  outputPath,
  gzip = true,
) {
  if (typeof outputPath === "boolean") {
    gzip = outputPath;
    outputPath = undefined;
  }

  if (!filePath.endsWith(".enc")) {
    throw new WilcoCryptError(
      "Invalid file extension (expected .enc)",
      "INVALID_FILE_EXTENSION",
    );
  }

  const encryptedData = await fsPromises.readFile(filePath);

  const decrypted = await wilcocrypt.decryptDataAsync(
    encryptedData,
    password,
    gzip,
  );

  if (outputPath) {
    await fsPromises.writeFile(outputPath, decrypted);
    return;
  }

  return decrypted;
};

/**
 * Encrypts a file using streams and writes the result to `outputPath`.
 * Memory-efficient alternative to `encryptFile` for large files.
 *
 * Output format:
 * [HEADER] + [VERSION] + [salt (16)] + [iv (12)] + [ciphertext] + [authTag (16)]
 *
 * @param {string} inputPath - Path to the file to encrypt
 * @param {string} outputPath - Path to write the encrypted output to
 * @param {string} password - Password used for key derivation
 * @param {boolean} [gzip=true] - Whether to compress data before encryption
 * @returns {Promise<void>}
 * @throws {WilcoCryptError} If password is invalid
 */
wilcocrypt.encryptFileStream = async function (
  inputPath,
  outputPath,
  password,
  gzip = true,
) {
  wilcocrypt._.assertPassword(password);

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(password, salt, 32);
  const versionBuf = Buffer.from(wilcocrypt._.VERSION);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const writeStream = createWriteStream(outputPath);

  writeStream.write(wilcocrypt._.HEADER);
  writeStream.write(versionBuf);
  writeStream.write(salt);
  writeStream.write(iv);

  const pipelineSteps = [createReadStream(inputPath)];
  if (gzip) pipelineSteps.push(createGzip());
  pipelineSteps.push(cipher);
  pipelineSteps.push(writeStream);

  // end: false so we can still append the authTag after the pipeline finishes
  await pipeline(...pipelineSteps, { end: false });
  writeStream.end(cipher.getAuthTag());
};

/**
 * Decrypts an encrypted `.enc` file using streams.
 * Memory-efficient alternative to `decryptFile` for large files.
 * Cleans up the output file automatically if decryption or integrity check fails.
 *
 * @param {string} inputPath - Path to the encrypted `.enc` file
 * @param {string} outputPath - Path to write the decrypted output to
 * @param {string} password - Password used for decryption
 * @param {boolean} [gzip=true] - Whether to decompress after decryption
 * @returns {Promise<void>}
 * @throws {WilcoCryptError} On invalid header, version mismatch, or decryption/integrity failure
 */
wilcocrypt.decryptFileStream = async function (
  inputPath,
  outputPath,
  password,
  gzip = true,
) {
  wilcocrypt._.assertPassword(password);

  const handle = await fsPromises.open(inputPath, "r");
  const versionBuf = Buffer.from(wilcocrypt._.VERSION);

  const headLen = wilcocrypt._.HEADER.length;
  const verLen = versionBuf.length;

  const headerCheck = Buffer.alloc(headLen);
  const versionCheck = Buffer.alloc(verLen);
  const salt = Buffer.alloc(16);
  const iv = Buffer.alloc(12);

  let currentPos = 0;
  await handle.read(headerCheck, 0, headLen, currentPos);
  currentPos += headLen;
  await handle.read(versionCheck, 0, verLen, currentPos);
  currentPos += verLen;
  await handle.read(salt, 0, 16, currentPos);
  currentPos += 16;
  await handle.read(iv, 0, 12, currentPos);
  currentPos += 12;

  if (!headerCheck.equals(wilcocrypt._.HEADER)) {
    await handle.close();
    throw new WilcoCryptError("Invalid WilcoCrypt header", "INVALID_HEADER");
  }

  if (!versionCheck.equals(versionBuf)) {
    await handle.close();
    throw new WilcoCryptError("Version mismatch", "VERSION_MISMATCH");
  }

  const stats = await handle.stat();
  const authTag = Buffer.alloc(16);
  await handle.read(authTag, 0, 16, stats.size - 16);

  const key = scryptSync(password, salt, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const pipelineSteps = [
    createReadStream(inputPath, { start: currentPos, end: stats.size - 17 }),
  ];
  pipelineSteps.push(decipher);
  if (gzip) pipelineSteps.push(createGunzip());
  pipelineSteps.push(createWriteStream(outputPath));

  try {
    await pipeline(...pipelineSteps);
  } catch {
    await handle.close();
    await fsPromises.unlink(outputPath);
    throw new WilcoCryptError(
      "Decryption failed (invalid password, corrupted data, or tampered file)",
      "DECRYPTION_FAILED",
    );
  }

  await handle.close();
};

export default wilcocrypt;
