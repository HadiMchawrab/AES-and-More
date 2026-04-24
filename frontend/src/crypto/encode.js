export const BLOCK_SIZE = 16;

export function textToBytes(text) {
  return new TextEncoder().encode(text);
}

export function bytesToText(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function hexToBytes(hex) {
  const cleaned = hex.replace(/\s+/g, '').replace(/^0x/i, '');
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters');
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error('Invalid hex characters');
  }
  const out = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return out;
}

export function bytesToHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

export function parseInput(data, format) {
  if (format === 'hex') {
    try {
      return hexToBytes(data);
    } catch (e) {
      throw new Error(`Invalid hex input: ${e.message}`);
    }
  }
  return textToBytes(data);
}

export function parseKey(key, format) {
  const bytes = parseInput(key, format);
  if (bytes.length !== 16 && bytes.length !== 24 && bytes.length !== 32) {
    throw new Error(
      `Key must be 16, 24, or 32 bytes. Got ${bytes.length} bytes. ` +
      `For text keys, use exactly 16, 24, or 32 characters. ` +
      `For hex keys, use 32, 48, or 64 hex characters.`
    );
  }
  return bytes;
}

export function zeroPad(data) {
  const remainder = data.length % BLOCK_SIZE;
  if (remainder === 0) return { padded: data, padSize: 0 };
  const padSize = BLOCK_SIZE - remainder;
  const padded = new Uint8Array(data.length + padSize);
  padded.set(data);
  // remaining bytes default to 0
  return { padded, padSize };
}

export function zeroUnpad(data, padSize) {
  if (padSize === 0) return data;
  return data.slice(0, data.length - padSize);
}

export function concatBytes(chunks) {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

export function splitBlocks(data) {
  const out = [];
  for (let i = 0; i < data.length; i += BLOCK_SIZE) {
    out.push(data.slice(i, i + BLOCK_SIZE));
  }
  return out;
}
