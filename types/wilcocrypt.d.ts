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
 * Internal encrypted envelope structure.
 */
export interface EncryptResultEnvelope {
  payload: string;
  authTag: string;
  salt: string;
  iv: string;
  version: string;
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
    iv: Buffer
  ): {
    ciphertext: Buffer;
    authTag: Buffer;
  };

  /**
   * Decrypts AES-256-GCM encrypted data.
   */
  decryptData(
    cipherHex: string,
    authTagHex: string,
    key: Buffer,
    iv: Buffer
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
   * @param plaindata Raw data to encrypt
   * @param password Password used for key derivation
   * @param gzip Whether to compress data before encryption (default: true)
   * @returns MessagePack-encoded encrypted payload
   */
  encryptData(
    plaindata: Buffer,
    password: string,
    gzip?: boolean
  ): Buffer;

  /**
   * Decrypts encrypted data using password-based AES-256-GCM.
   *
   * @param encryptedData MessagePack-encoded encrypted payload
   * @param password Password used for decryption
   * @param gzip Whether to decompress after decryption (default: true)
   */
  decryptData(
    encryptedData: Buffer,
    password: string,
    gzip?: boolean
  ): Buffer;

  /**
   * Encrypts a file and writes `<filePath>.enc`.
   */
  encryptFile(
    filePath: string,
    password: string,
    gzip?: boolean
  ): void;

  /**
   * Decrypts a `.enc` file.
   */
  decryptFile(
    filePath: string,
    password: string,
    gzip?: boolean
  ): Buffer;
}

/**
 * WilcoCrypt main instance.
 */
declare const wilcocrypt: WilcoCrypt;

export default wilcocrypt;
