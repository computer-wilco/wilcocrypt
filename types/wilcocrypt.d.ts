/// <reference types="node" />

/**
 * Custom error class for all WilcoCrypt-specific errors.
 */
export class WilcoCryptError extends Error {
  code: string;

  /**
   * @param message Human-readable error message
   * @param code Machine-readable error code (default: WILCOCRYPT_ERROR)
   */
  constructor(message: string, code?: string);
}

/**
 * Internal helper namespace used by WilcoCrypt.
 */
export interface InternalNamespace {
  /**
   * WilcoCrypt version (must match during decryption).
   */
  VERSION: string;

  /**
   * Minimum allowed password length.
   */
  MIN_PASSWORD_LENGTH: number;

  /**
   * Internal header used to identify valid WilcoCrypt payloads.
   */
  HEADER: Buffer;

  /**
   * Internal error class used by WilcoCrypt.
   */
  WilcoCryptError: typeof WilcoCryptError;

  /**
   * Validates AES-256-GCM key and IV.
   */
  assertKeyAndIv(key: Buffer, iv: Buffer): void;

  /**
   * Validates password strength.
   */
  assertPassword(password: string): void;

  /**
   * Constant-time buffer comparison.
   */
  constantTimeEqual(a: Buffer, b: Buffer): boolean;

  /**
   * Encrypts raw data using AES-256-GCM.
   */
  encryptData(
    plainData: Buffer,
    key: Buffer,
    iv: Buffer,
  ): {
    ciphertext: Buffer;
    authTag: Buffer;
  };

  /**
   * Decrypts AES-256-GCM encrypted data.
   */
  decryptData(
    cipherBuffer: Buffer,
    authTagBuffer: Buffer,
    key: Buffer,
    iv: Buffer,
  ): Buffer;
}

/**
 * Main WilcoCrypt API.
 */
export interface WilcoCrypt {
  _: InternalNamespace;

  /**
   * Encrypts data using password-based AES-256-GCM.
   *
   * Output format:
   * [HEADER (10 bytes)] + [VERSION (dynamic)] + [salt (16)] + [iv (12)] + [ciphertext] + [authTag (16)]
   *
   * @param plaindata Raw data to encrypt
   * @param password Password used for key derivation
   * @param gzip Whether to compress data before encryption (default: true)
   * @returns Binary-encoded encrypted payload
   */
  encryptData(plaindata: Buffer, password: string, gzip?: boolean): Buffer;

  /**
   * Decrypts encrypted data using password-based AES-256-GCM.
   *
   * Validates internal header and version, then extracts:
   * salt, iv, authTag and ciphertext from the binary payload.
   *
   * @param encryptedData Binary-encoded encrypted payload
   * @param password Password used for decryption
   * @param gzip Whether to decompress after decryption (default: true)
   * @returns Decrypted raw data
   *
   * @throws WilcoCryptError on:
   * - invalid header
   * - version mismatch
   * - wrong password
   * - corrupted data
   */
  decryptData(encryptedData: Buffer, password: string, gzip?: boolean): Buffer;

  /**
   * Encrypts a file and writes `<filePath>.enc`.
   */
  encryptFile(filePath: string, password: string, gzip?: boolean): void;

  /**
   * Decrypts a `.enc` file.
   *
   * If `outputPath` is provided, the decrypted data is written to that file
   * and `undefined` is returned. Otherwise the decrypted Buffer is returned.
   */
  decryptFile(
    filePath: string,
    password: string,
    outputPath: string,
    gzip?: boolean,
  ): undefined;
  decryptFile(filePath: string, password: string, gzip?: boolean): Buffer;

  /**
   * Encrypts a file using streams and writes the result to `outputPath`.
   * Memory-efficient alternative to `encryptFile` for large files.
   *
   * @param inputPath Path to the file to encrypt
   * @param outputPath Path to write the encrypted output to
   * @param password Password used for key derivation
   * @param gzip Whether to compress data before encryption (default: true)
   */
  encryptFileStream(
    inputPath: string,
    outputPath: string,
    password: string,
    gzip?: boolean,
  ): Promise<void>;

  /**
   * Decrypts an encrypted file using streams.
   * Memory-efficient alternative to `decryptFile` for large files.
   * Cleans up the output file automatically if decryption or integrity check fails.
   *
   * @param inputPath Path to the encrypted file
   * @param outputPath Path to write the decrypted output to
   * @param password Password used for decryption
   * @param gzip Whether to decompress after decryption (default: true)
   *
   * @throws WilcoCryptError on:
   * - invalid header
   * - version mismatch
   * - decryption/integrity failure
   */
  decryptFileStream(
    inputPath: string,
    outputPath: string,
    password: string,
    gzip?: boolean,
  ): Promise<void>;
}

/**
 * WilcoCrypt main instance.
 */
declare const wilcocrypt: WilcoCrypt;

export default wilcocrypt;
