import { encode as msgpack_encode, decode as msgpack_decode } from '@msgpack/msgpack';
import { gzipSync as zlib_gzipSync, gunzipSync as zlib_gunzipSync } from 'zlib';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Pack
 * @param {Object} data - JSON object
 * @param {string} filePath - Path to output file
 */
function packToFile(data, filePath) {
  const packed = msgpack_encode(data);
  const compressed = zlib_gzipSync(packed, { level: 9 });
  writeFileSync(filePath, compressed);
}

/**
 * Unpack
 * @param {string} filePath - Path to input file
 * @returns {Object} - JSON object
 */
function unpackFromFile(filePath) {
  const file = readFileSync(filePath);
  const decompressed = zlib_gunzipSync(file);
  return msgpack_decode(decompressed);
}

export { packToFile, unpackFromFile };
