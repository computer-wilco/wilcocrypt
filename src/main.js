import { packToFile, unpackFromFile } from './pack.js';
import { encrypt, decrypt } from './encryptdecrypt.js';
import { randomBytes, scryptSync } from 'crypto';
import { readFileSync } from 'fs';

function encryptFileToJSON(filePath, password) {
  const fileData = readFileSync(filePath, 'utf8');
  const iv = randomBytes(16);
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);
  const encrypted = encrypt(fileData, key, iv);

  return {
    payload: encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex')
  };
}

function decryptFileFromJSON(encryptedObj, password) {
  const { payload, salt, iv } = encryptedObj;

  const key = scryptSync(password, Buffer.from(salt, 'hex'), 32);

  return decrypt(payload, key, iv);
}

export function encryptFile(filePath, password) {
    const encryptedObj = encryptFileToJSON(filePath, password);

    packToFile(encryptedObj, `${filePath}.enc`);
}

export function decryptFile(filePath, password) {
    const encryptedObj = unpackFromFile(filePath);

    return decryptFileFromJSON(encryptedObj, password);
}
