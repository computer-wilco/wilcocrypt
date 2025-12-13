import { createCipheriv, createDecipheriv } from 'crypto';

/**
 * Encrypts a JSON-compatible object using AES-256-CBC
 * @param {Object} data - The JSON object to encrypt
 * @param {Buffer} encryption_key - 32-byte AES-256-CBC encryption key
 * @param {Buffer} iv_key - 16-byte initialization vector (IV)
 * @returns {string} Encrypted data as a hex string, including IV in the format `iv:encrypted`
 */
export function encrypt(data, encryption_key, iv_key) {
  const cipher = createCipheriv('aes-256-cbc', encryption_key, iv_key);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv_key.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted with AES-256-CBC
 * @param {string} encryptedData - Encrypted data in `iv:encrypted` hex string format
 * @param {Buffer} encryption_key - 32-byte AES-256-CBC encryption key
 * @param {Buffer} iv_key - 16-byte initialization vector (IV)
 * @returns {Object} The original JSON object
 */
export function decrypt(encryptedData, encryption_key, iv_key) {
  const [iv, encrypted] = encryptedData.split(':');
  const decipher = createDecipheriv(
    'aes-256-cbc',
    encryption_key,
    Buffer.from(iv_key, 'hex')
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}
