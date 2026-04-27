// Instrumented AES — runs the same algorithm as aes.js but captures every
// intermediate state transition for the AES Internals modal.
//
// Returns a list of steps. Each step has:
//   - phase:       'AddRoundKey' | 'SubBytes' | 'ShiftRows' | 'MixColumns'
//   - round:       0..Nr        (0 = pre-round whitening; Nr = final round)
//   - stateBefore: Uint8Array(16)
//   - stateAfter:  Uint8Array(16)
//   - roundKey:    Uint8Array(16) | null  (only present for AddRoundKey)
//   - description: human-readable one-liner
//
// Also returns the expanded key schedule so the UI can show round keys.

import { expandKey } from './aes.js';

const SBOX = new Uint8Array([
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
]);

const INV_SBOX = new Uint8Array(256);
for (let i = 0; i < 256; i++) INV_SBOX[SBOX[i]] = i;

function xtime(b) {
  return ((b << 1) ^ ((b & 0x80) ? 0x1b : 0)) & 0xff;
}

function gmul(a, b) {
  let p = 0;
  for (let i = 0; i < 8 && a && b; i++) {
    if (b & 1) p ^= a;
    a = xtime(a);
    b >>= 1;
  }
  return p & 0xff;
}

function applySubBytes(state) {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = SBOX[state[i]];
  return out;
}

function applyInvSubBytes(state) {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = INV_SBOX[state[i]];
  return out;
}

function applyShiftRows(state) {
  const out = new Uint8Array(16);
  // column-major: state[r + 4*c]. row r shifts left by r.
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[r + 4 * c] = state[r + 4 * ((c + r) % 4)];
    }
  }
  return out;
}

function applyInvShiftRows(state) {
  const out = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[r + 4 * c] = state[r + 4 * ((c - r + 4) % 4)];
    }
  }
  return out;
}

function applyMixColumns(state) {
  const out = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const s0 = state[i], s1 = state[i + 1], s2 = state[i + 2], s3 = state[i + 3];
    out[i]     = xtime(s0) ^ (xtime(s1) ^ s1) ^ s2 ^ s3;
    out[i + 1] = s0 ^ xtime(s1) ^ (xtime(s2) ^ s2) ^ s3;
    out[i + 2] = s0 ^ s1 ^ xtime(s2) ^ (xtime(s3) ^ s3);
    out[i + 3] = (xtime(s0) ^ s0) ^ s1 ^ s2 ^ xtime(s3);
  }
  return out;
}

function applyInvMixColumns(state) {
  const out = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const s0 = state[i], s1 = state[i + 1], s2 = state[i + 2], s3 = state[i + 3];
    out[i]     = gmul(s0, 0x0e) ^ gmul(s1, 0x0b) ^ gmul(s2, 0x0d) ^ gmul(s3, 0x09);
    out[i + 1] = gmul(s0, 0x09) ^ gmul(s1, 0x0e) ^ gmul(s2, 0x0b) ^ gmul(s3, 0x0d);
    out[i + 2] = gmul(s0, 0x0d) ^ gmul(s1, 0x09) ^ gmul(s2, 0x0e) ^ gmul(s3, 0x0b);
    out[i + 3] = gmul(s0, 0x0b) ^ gmul(s1, 0x0d) ^ gmul(s2, 0x09) ^ gmul(s3, 0x0e);
  }
  return out;
}

function applyAddRoundKey(state, W, offset) {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = state[i] ^ W[offset + i];
  return out;
}

function roundKeyAt(W, round) {
  return W.slice(round * 16, round * 16 + 16);
}

export function traceEncrypt(block, key) {
  if (block.length !== 16) throw new Error('Block must be 16 bytes');
  const W = expandKey(key);
  const Nr = W.length / 16 - 1;
  const steps = [];

  let state = new Uint8Array(block);

  // Initial AddRoundKey (round 0 — pre-whitening)
  let after = applyAddRoundKey(state, W, 0);
  steps.push({
    phase: 'AddRoundKey',
    round: 0,
    stateBefore: state,
    stateAfter: after,
    roundKey: roundKeyAt(W, 0),
    description: 'Initial whitening: XOR plaintext with the first round key (the cipher key itself).',
  });
  state = after;

  // Main rounds 1..Nr-1 (full rounds: SubBytes, ShiftRows, MixColumns, AddRoundKey)
  for (let round = 1; round < Nr; round++) {
    after = applySubBytes(state);
    steps.push({
      phase: 'SubBytes',
      round,
      stateBefore: state,
      stateAfter: after,
      roundKey: null,
      description: 'Each byte is replaced via the S-box (a fixed nonlinear lookup table). Provides confusion.',
    });
    state = after;

    after = applyShiftRows(state);
    steps.push({
      phase: 'ShiftRows',
      round,
      stateBefore: state,
      stateAfter: after,
      roundKey: null,
      description: 'Row r of the 4×4 state is rotated left by r positions. Spreads bytes across columns.',
    });
    state = after;

    after = applyMixColumns(state);
    steps.push({
      phase: 'MixColumns',
      round,
      stateBefore: state,
      stateAfter: after,
      roundKey: null,
      description: 'Each column is multiplied by a fixed matrix in GF(2⁸). Provides diffusion within the column.',
    });
    state = after;

    after = applyAddRoundKey(state, W, round * 16);
    steps.push({
      phase: 'AddRoundKey',
      round,
      stateBefore: state,
      stateAfter: after,
      roundKey: roundKeyAt(W, round),
      description: `XOR state with round key ${round}.`,
    });
    state = after;
  }

  // Final round (no MixColumns)
  after = applySubBytes(state);
  steps.push({
    phase: 'SubBytes',
    round: Nr,
    stateBefore: state,
    stateAfter: after,
    roundKey: null,
    description: 'Final round S-box substitution (same as before).',
  });
  state = after;

  after = applyShiftRows(state);
  steps.push({
    phase: 'ShiftRows',
    round: Nr,
    stateBefore: state,
    stateAfter: after,
    roundKey: null,
    description: 'Final round shift (no MixColumns in the last round — by design, so encryption and decryption have parallel structure).',
  });
  state = after;

  after = applyAddRoundKey(state, W, Nr * 16);
  steps.push({
    phase: 'AddRoundKey',
    round: Nr,
    stateBefore: state,
    stateAfter: after,
    roundKey: roundKeyAt(W, Nr),
    description: `XOR with final round key ${Nr}. Result is the ciphertext block.`,
  });

  return { steps, Nr, expandedKey: W, finalState: after };
}

export function traceDecrypt(block, key) {
  if (block.length !== 16) throw new Error('Block must be 16 bytes');
  const W = expandKey(key);
  const Nr = W.length / 16 - 1;
  const steps = [];

  let state = new Uint8Array(block);

  // Initial AddRoundKey with last round key
  let after = applyAddRoundKey(state, W, Nr * 16);
  steps.push({
    phase: 'AddRoundKey',
    round: Nr,
    stateBefore: state,
    stateAfter: after,
    roundKey: roundKeyAt(W, Nr),
    description: `Decryption starts by XORing ciphertext with the last round key (round ${Nr}).`,
  });
  state = after;

  // Inverse rounds Nr-1 down to 1
  for (let round = Nr - 1; round > 0; round--) {
    after = applyInvShiftRows(state);
    steps.push({
      phase: 'InvShiftRows',
      round,
      stateBefore: state,
      stateAfter: after,
      roundKey: null,
      description: 'Inverse ShiftRows: row r rotates right by r positions (undoing encryption\'s left rotation).',
    });
    state = after;

    after = applyInvSubBytes(state);
    steps.push({
      phase: 'InvSubBytes',
      round,
      stateBefore: state,
      stateAfter: after,
      roundKey: null,
      description: 'Inverse S-box lookup undoes the SubBytes substitution.',
    });
    state = after;

    after = applyAddRoundKey(state, W, round * 16);
    steps.push({
      phase: 'AddRoundKey',
      round,
      stateBefore: state,
      stateAfter: after,
      roundKey: roundKeyAt(W, round),
      description: `XOR with round key ${round}.`,
    });
    state = after;

    after = applyInvMixColumns(state);
    steps.push({
      phase: 'InvMixColumns',
      round,
      stateBefore: state,
      stateAfter: after,
      roundKey: null,
      description: 'Inverse MixColumns multiplies each column by the inverse matrix in GF(2⁸).',
    });
    state = after;
  }

  // Final inverse round (no InvMixColumns)
  after = applyInvShiftRows(state);
  steps.push({
    phase: 'InvShiftRows',
    round: 0,
    stateBefore: state,
    stateAfter: after,
    roundKey: null,
    description: 'Final inverse shift.',
  });
  state = after;

  after = applyInvSubBytes(state);
  steps.push({
    phase: 'InvSubBytes',
    round: 0,
    stateBefore: state,
    stateAfter: after,
    roundKey: null,
    description: 'Final inverse S-box.',
  });
  state = after;

  after = applyAddRoundKey(state, W, 0);
  steps.push({
    phase: 'AddRoundKey',
    round: 0,
    stateBefore: state,
    stateAfter: after,
    roundKey: roundKeyAt(W, 0),
    description: 'XOR with the first round key (the cipher key). Result is the plaintext block.',
  });

  return { steps, Nr, expandedKey: W, finalState: after };
}
