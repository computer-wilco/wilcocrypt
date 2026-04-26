/// <reference types="node" />

export class WilcoCryptError extends Error {
  code: string;
  constructor(message: string, code?: string);
}

export interface EncryptResultEnvelope {
  payload: string;
  authTag: string;
  salt: string;
  iv: string;
  version: string;
}

export interface InternalNamespace {
  VERSION: string;
  MIN_PASSWORD_LENGTH: number;

  WilcoCryptError: typeof WilcoCryptError;

  assertKeyAndIv(key: Buffer, iv: Buffer): void;
  assertPassword(password: string): void;
  constantTimeEqual(a: Buffer, b: Buffer): boolean;

  encryptData(
    plainData: Buffer,
    key: Buffer,
    iv: Buffer
  ): {
    ciphertext: Buffer;
    authTag: Buffer;
  };

  decryptData(
    cipherHex: string,
    authTagHex: string,
    key: Buffer,
    iv: Buffer
  ): Buffer;
}

export interface WilcoCrypt {
  _: InternalNamespace;

  encryptData(
    plaindata: Buffer,
    password: string,
    gzip?: boolean
  ): Buffer;

  decryptData(
    encryptedData: Buffer,
    password: string,
    gzip?: boolean
  ): Buffer;

  encryptFile(
    filePath: string,
    password: string,
    gzip?: boolean
  ): void;

  decryptFile(
    filePath: string,
    password: string,
    gzip?: boolean
  ): Buffer;
}

declare const wilcocrypt: WilcoCrypt;
export default wilcocrypt;
