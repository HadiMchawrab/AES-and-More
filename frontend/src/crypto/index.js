import { MODE_MAP } from './modes';
import { parseInput, parseKey, bytesToHex, bytesToText, hexToBytes } from './encode';

export function encryptLocal({ mode, plaintext, key, inputFormat, keyFormat, initialCounter = 0 }) {
  const impl = MODE_MAP[mode];
  if (!impl) throw new Error(`Unknown mode '${mode}'`);

  const plaintextBytes = parseInput(plaintext, inputFormat);
  const keyBytes = parseKey(key, keyFormat);

  if (plaintextBytes.length === 0) throw new Error('Plaintext cannot be empty');

  const result = mode === 'ctr'
    ? impl.encrypt(plaintextBytes, keyBytes, initialCounter || 0)
    : impl.encrypt(plaintextBytes, keyBytes);

  return {
    type: 'encrypt',
    success: true,
    ciphertext_hex: bytesToHex(result.ciphertext),
    pad_size: result.pad_size,
    block_details: result.block_details,
    mode_info: result.mode_info,
  };
}

export function decryptLocal({ mode, ciphertext, key, keyFormat, padSize = 0, initialCounter = 0 }) {
  const impl = MODE_MAP[mode];
  if (!impl) throw new Error(`Unknown mode '${mode}'`);

  let ciphertextBytes;
  try {
    ciphertextBytes = hexToBytes(ciphertext);
  } catch (e) {
    throw new Error(`Invalid hex ciphertext: ${e.message}`);
  }
  const keyBytes = parseKey(key, keyFormat);

  if (ciphertextBytes.length === 0) throw new Error('Ciphertext cannot be empty');
  if (ciphertextBytes.length % 16 !== 0) {
    throw new Error(
      `Ciphertext length must be a multiple of 16 bytes. Got ${ciphertextBytes.length} bytes.`
    );
  }

  const result = mode === 'ctr'
    ? impl.decrypt(ciphertextBytes, keyBytes, initialCounter || 0, padSize)
    : impl.decrypt(ciphertextBytes, keyBytes, padSize);

  return {
    type: 'decrypt',
    success: true,
    plaintext_text: bytesToText(result.plaintext),
    plaintext_hex: bytesToHex(result.plaintext),
    pad_size: result.pad_size,
    block_details: result.block_details,
    mode_info: result.mode_info,
  };
}
