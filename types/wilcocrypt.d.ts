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
   *
   * @param key AES-256 encryption key (32-byte Buffer)
   * @param iv GCM initialization vector (12-byte Buffer)
   *
   * @throws WilcoCryptError
   */
  assertKeyAndIv(key: Buffer, iv: Buffer): void;

  /**
   * Validates password strength.
   *
   * @param password Password to validate
   *
   * @throws WilcoCryptError
   */
  assertPassword(password: string): void;

  /**
   * Constant-time buffer comparison.
   * Reserved for future extensions.
   *
   * @param a First buffer
   * @param b Second buffer
   * @returns True if both buffers are identical
   */
  constantTimeEqual(a: Buffer, b: Buffer): boolean;

  /**
   * Encrypts raw data using AES-256-GCM.
   *
   * @param plainData Raw data to encrypt
   * @param key AES-256 encryption key
   * @param iv GCM initialization vector
   * @returns Ciphertext and authentication tag
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
   *
   * @param cipherBuffer Encrypted ciphertext
   * @param authTagBuffer AES-GCM authentication tag
   * @param key AES-256 encryption key
   * @param iv GCM initialization vector
   * @returns Decrypted raw data
   *
   * @throws WilcoCryptError
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
   *
   * @throws WilcoCryptError If password is invalid
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
   * Encrypts a file and writes the result to `<filePath>.enc`.
   *
   * @param filePath Path to the file to encrypt
   * @param password Password used for encryption
   * @param gzip Whether to compress before encryption (default: true)
   *
   * @throws WilcoCryptError If password is invalid
   */
  encryptFile(filePath: string, password: string, gzip?: boolean): void;

  /**
   * Decrypts an encrypted `.enc` file.
   *
   * If `outputPath` is provided, the decrypted data is written to that file
   * and `undefined` is returned. Otherwise the decrypted Buffer is returned.
   *
   * @param filePath Path to the `.enc` file
   * @param password Password used for decryption
   * @param outputPath Optional path to write decrypted output to.
   * If omitted, the function returns the decrypted Buffer instead.
   * @param gzip Whether to decompress after decryption (default: true)
   * @returns Undefined when outputPath is provided
   *
   * @throws WilcoCryptError on:
   * - invalid file extension
   * - invalid header
   * - version mismatch
   * - wrong password
   * - corrupted data
   */
  decryptFile(
    filePath: string,
    password: string,
    outputPath: string,
    gzip?: boolean,
  ): undefined;

  /**
   * Decrypts an encrypted `.enc` file.
   *
   * If `outputPath` is omitted, the decrypted Buffer is returned.
   *
   * @param filePath Path to the `.enc` file
   * @param password Password used for decryption
   * @param gzip Whether to decompress after decryption (default: true)
   * @returns Decrypted file contents
   *
   * @throws WilcoCryptError on:
   * - invalid file extension
   * - invalid header
   * - version mismatch
   * - wrong password
   * - corrupted data
   */
  decryptFile(
    filePath: string,
    password: string,
    gzip?: boolean,
  ): Buffer;

  /**
   * Encrypts data asynchronously using password-based AES-256-GCM.
   *
   * Output format:
   * [HEADER (10 bytes)] + [VERSION (dynamic)] + [salt (16)] + [iv (12)] + [ciphertext] + [authTag (16)]
   *
   * @param plaindata Raw data to encrypt
   * @param password Password used for key derivation
   * @param gzip Whether to compress data before encryption (default: true)
   * @returns Binary-encoded encrypted payload
   *
   * @throws WilcoCryptError If password is invalid
   */
  encryptDataAsync(
    plaindata: Buffer,
    password: string,
    gzip?: boolean,
  ): Promise<Buffer>;

  /**
   * Decrypts encrypted data asynchronously using password-based AES-256-GCM.
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
  decryptDataAsync(
    encryptedData: Buffer,
    password: string,
    gzip?: boolean,
  ): Promise<Buffer>;

  /**
   * Encrypts a file asynchronously and writes the result to `<filePath>.enc`.
   *
   * @param filePath Path to the file to encrypt
   * @param password Password used for encryption
   * @param gzip Whether to compress before encryption (default: true)
   *
   * @throws WilcoCryptError If password is invalid
   */
  encryptFileAsync(
    filePath: string,
    password: string,
    gzip?: boolean,
  ): Promise<void>;

  /**
   * Decrypts a `.enc` file asynchronously.
   *
   * If `outputPath` is provided, the decrypted data is written to that file
   * and `undefined` is returned. Otherwise the decrypted Buffer is returned.
   *
   * @param filePath Path to the `.enc` file
   * @param password Password used for decryption
   * @param outputPath Optional path to write decrypted output to
   * @param gzip Whether to decompress after decryption (default: true)
   * @returns Undefined when outputPath is provided
   *
   * @throws WilcoCryptError on:
   * - invalid file extension
   * - invalid header
   * - version mismatch
   * - wrong password
   * - corrupted data
   */
  decryptFileAsync(
    filePath: string,
    password: string,
    outputPath: string,
    gzip?: boolean,
  ): Promise<undefined>;

  /**
   * Decrypts an encrypted `.enc` file asynchronously.
   *
   * If `outputPath` is omitted, the decrypted Buffer is returned.
   *
   * @param filePath Path to the `.enc` file
   * @param password Password used for decryption
   * @param gzip Whether to decompress after decryption (default: true)
   * @returns Decrypted file contents
   *
   * @throws WilcoCryptError on:
   * - invalid file extension
   * - invalid header
   * - version mismatch
   * - wrong password
   * - corrupted data
   */
  decryptFileAsync(
    filePath: string,
    password: string,
    gzip?: boolean,
  ): Promise<Buffer>;

  /**
   * Encrypts a file using streams and writes the result to `outputPath`.
   * Memory-efficient alternative to `encryptFile` for large files.
   *
   * Output format:
   * [HEADER] + [VERSION] + [salt (16)] + [iv (12)] + [ciphertext] + [authTag (16)]
   *
   * @param inputPath Path to the file to encrypt
   * @param outputPath Path to write the encrypted output to
   * @param password Password used for key derivation
   * @param gzip Whether to compress data before encryption (default: true)
   *
   * @throws WilcoCryptError If password is invalid
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
