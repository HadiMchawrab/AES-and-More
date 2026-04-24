import { aesEncryptBlock, aesDecryptBlock, xorBytes } from './aes';
import {
  BLOCK_SIZE, bytesToHex, bytesToText, concatBytes, splitBlocks,
  zeroPad, zeroUnpad,
} from './encode';

const ZERO_IV = new Uint8Array(BLOCK_SIZE);

function counterToBytes(counter) {
  // 128-bit big-endian counter. Supports arbitrarily large counter via BigInt.
  const out = new Uint8Array(BLOCK_SIZE);
  let v = BigInt(counter);
  for (let i = BLOCK_SIZE - 1; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

// ─── ECB ──────────────────────────────────────────────────────────────
export const ECB = {
  encrypt(plaintext, key) {
    const { padded, padSize } = zeroPad(plaintext);
    const blocks = splitBlocks(padded);
    const cipherBlocks = [];
    const blockDetails = [];

    for (let i = 0; i < blocks.length; i++) {
      const encrypted = aesEncryptBlock(blocks[i], key);
      cipherBlocks.push(encrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        operation: 'AES_Encrypt(block, key)',
        output: bytesToHex(encrypted),
        description: `Block ${i}: Direct AES encryption (no chaining)`,
      });
    }

    return {
      ciphertext: concatBytes(cipherBlocks),
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'ECB (Electronic Codebook)',
        iv_used: null,
        description:
          'Each block is encrypted independently. Identical plaintext blocks produce identical ciphertext blocks.',
      },
    };
  },

  decrypt(ciphertext, key, padSize = 0) {
    const blocks = splitBlocks(ciphertext);
    const plainBlocks = [];
    const blockDetails = [];

    for (let i = 0; i < blocks.length; i++) {
      const decrypted = aesDecryptBlock(blocks[i], key);
      plainBlocks.push(decrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        operation: 'AES_Decrypt(block, key)',
        output: bytesToHex(decrypted),
        description: `Block ${i}: Direct AES decryption (no chaining)`,
      });
    }

    const plaintext = zeroUnpad(concatBytes(plainBlocks), padSize);
    return {
      plaintext,
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'ECB (Electronic Codebook)',
        iv_used: null,
        description: 'Each block is decrypted independently.',
      },
    };
  },
};

// ─── CBC ──────────────────────────────────────────────────────────────
export const CBC = {
  encrypt(plaintext, key) {
    const { padded, padSize } = zeroPad(plaintext);
    const blocks = splitBlocks(padded);
    const cipherBlocks = [];
    const blockDetails = [];
    let prevCipher = ZERO_IV;

    for (let i = 0; i < blocks.length; i++) {
      const xored = xorBytes(blocks[i], prevCipher);
      const encrypted = aesEncryptBlock(xored, key);
      cipherBlocks.push(encrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        xor_with: bytesToHex(prevCipher),
        after_xor: bytesToHex(xored),
        operation: 'AES_Encrypt(plaintext XOR prev_ciphertext, key)',
        output: bytesToHex(encrypted),
        description:
          `Block ${i}: XOR plaintext with ${i === 0 ? 'IV (all zeros)' : `ciphertext block ${i - 1}`}, ` +
          `then AES encrypt`,
      });
      prevCipher = encrypted;
    }

    return {
      ciphertext: concatBytes(cipherBlocks),
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'CBC (Cipher Block Chaining)',
        iv_used: bytesToHex(ZERO_IV),
        description:
          'Each plaintext block is XORed with the previous ciphertext block before encryption. ' +
          'The first block uses IV = 0x00...00.',
      },
    };
  },

  decrypt(ciphertext, key, padSize = 0) {
    const blocks = splitBlocks(ciphertext);
    const plainBlocks = [];
    const blockDetails = [];
    let prevCipher = ZERO_IV;

    for (let i = 0; i < blocks.length; i++) {
      const decryptedRaw = aesDecryptBlock(blocks[i], key);
      const xored = xorBytes(decryptedRaw, prevCipher);
      plainBlocks.push(xored);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        operation: 'AES_Decrypt(ciphertext, key) XOR prev_ciphertext',
        after_aes_decrypt: bytesToHex(decryptedRaw),
        xor_with: bytesToHex(prevCipher),
        output: bytesToHex(xored),
        description:
          `Block ${i}: AES decrypt, then XOR with ` +
          `${i === 0 ? 'IV (all zeros)' : `ciphertext block ${i - 1}`}`,
      });
      prevCipher = blocks[i];
    }

    const plaintext = zeroUnpad(concatBytes(plainBlocks), padSize);
    return {
      plaintext,
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'CBC (Cipher Block Chaining)',
        iv_used: bytesToHex(ZERO_IV),
        description:
          'Each ciphertext block is AES-decrypted, then XORed with the previous ciphertext block. ' +
          'The first block uses IV = 0x00...00.',
      },
    };
  },
};

// ─── CFB ──────────────────────────────────────────────────────────────
export const CFB = {
  encrypt(plaintext, key) {
    const { padded, padSize } = zeroPad(plaintext);
    const blocks = splitBlocks(padded);
    const cipherBlocks = [];
    const blockDetails = [];
    let feedback = ZERO_IV;

    for (let i = 0; i < blocks.length; i++) {
      const keystream = aesEncryptBlock(feedback, key);
      const encrypted = xorBytes(blocks[i], keystream);
      cipherBlocks.push(encrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        feedback_input: bytesToHex(feedback),
        keystream: bytesToHex(keystream),
        operation: 'plaintext XOR AES_Encrypt(feedback, key)',
        xor_with: bytesToHex(keystream),
        output: bytesToHex(encrypted),
        description:
          `Block ${i}: Encrypt ${i === 0 ? 'IV (all zeros)' : `ciphertext block ${i - 1}`} ` +
          `with AES, then XOR with plaintext`,
      });
      feedback = encrypted;
    }

    return {
      ciphertext: concatBytes(cipherBlocks),
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'CFB (Cipher Feedback)',
        iv_used: bytesToHex(ZERO_IV),
        description:
          'Encrypts the previous ciphertext (or IV) to produce a keystream, then XORs it with plaintext. ' +
          'Acts as a stream cipher. Only uses AES encryption, never AES decryption.',
      },
    };
  },

  decrypt(ciphertext, key, padSize = 0) {
    const blocks = splitBlocks(ciphertext);
    const plainBlocks = [];
    const blockDetails = [];
    let feedback = ZERO_IV;

    for (let i = 0; i < blocks.length; i++) {
      const keystream = aesEncryptBlock(feedback, key);
      const decrypted = xorBytes(blocks[i], keystream);
      plainBlocks.push(decrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        feedback_input: bytesToHex(feedback),
        keystream: bytesToHex(keystream),
        operation: 'ciphertext XOR AES_Encrypt(feedback, key)',
        xor_with: bytesToHex(keystream),
        output: bytesToHex(decrypted),
        description:
          `Block ${i}: Encrypt ${i === 0 ? 'IV (all zeros)' : `ciphertext block ${i - 1}`} ` +
          `with AES, then XOR with ciphertext to recover plaintext`,
      });
      feedback = blocks[i];
    }

    const plaintext = zeroUnpad(concatBytes(plainBlocks), padSize);
    return {
      plaintext,
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'CFB (Cipher Feedback)',
        iv_used: bytesToHex(ZERO_IV),
        description:
          'Decryption uses AES encryption (not decryption!) on the feedback value, then XORs with ciphertext. ' +
          'The feedback is the previous ciphertext block.',
      },
    };
  },
};

// ─── OFB ──────────────────────────────────────────────────────────────
export const OFB = {
  encrypt(plaintext, key) {
    const { padded, padSize } = zeroPad(plaintext);
    const blocks = splitBlocks(padded);
    const cipherBlocks = [];
    const blockDetails = [];
    let feedback = ZERO_IV;

    for (let i = 0; i < blocks.length; i++) {
      const keystream = aesEncryptBlock(feedback, key);
      const encrypted = xorBytes(blocks[i], keystream);
      cipherBlocks.push(encrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        feedback_input: bytesToHex(feedback),
        keystream: bytesToHex(keystream),
        operation: 'plaintext XOR AES_Encrypt(feedback, key)',
        xor_with: bytesToHex(keystream),
        output: bytesToHex(encrypted),
        description:
          `Block ${i}: Encrypt ${i === 0 ? 'IV (all zeros)' : 'previous AES output'} ` +
          `with AES to get keystream, then XOR with plaintext. ` +
          `Note: feedback is the AES output, NOT the ciphertext (unlike CFB).`,
      });
      feedback = keystream;
    }

    return {
      ciphertext: concatBytes(cipherBlocks),
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'OFB (Output Feedback)',
        iv_used: bytesToHex(ZERO_IV),
        description:
          'Generates keystream by repeatedly AES-encrypting the previous output. ' +
          'Unlike CFB, the feedback is the AES output (not ciphertext), so the keystream is independent of the data.',
      },
    };
  },

  decrypt(ciphertext, key, padSize = 0) {
    const blocks = splitBlocks(ciphertext);
    const plainBlocks = [];
    const blockDetails = [];
    let feedback = ZERO_IV;

    for (let i = 0; i < blocks.length; i++) {
      const keystream = aesEncryptBlock(feedback, key);
      const decrypted = xorBytes(blocks[i], keystream);
      plainBlocks.push(decrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        feedback_input: bytesToHex(feedback),
        keystream: bytesToHex(keystream),
        operation: 'ciphertext XOR AES_Encrypt(feedback, key)',
        xor_with: bytesToHex(keystream),
        output: bytesToHex(decrypted),
        description:
          `Block ${i}: Same keystream as encryption. XOR ciphertext with keystream to recover plaintext.`,
      });
      feedback = keystream;
    }

    const plaintext = zeroUnpad(concatBytes(plainBlocks), padSize);
    return {
      plaintext,
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'OFB (Output Feedback)',
        iv_used: bytesToHex(ZERO_IV),
        description:
          'Decryption is identical to encryption. The same keystream is generated and XORed with the ciphertext.',
      },
    };
  },
};

// ─── CTR ──────────────────────────────────────────────────────────────
export const CTR = {
  encrypt(plaintext, key, initialCounter = 0) {
    const { padded, padSize } = zeroPad(plaintext);
    const blocks = splitBlocks(padded);
    const cipherBlocks = [];
    const blockDetails = [];

    for (let i = 0; i < blocks.length; i++) {
      const counterValue = initialCounter + i;
      const counterBytes = counterToBytes(counterValue);
      const keystream = aesEncryptBlock(counterBytes, key);
      const encrypted = xorBytes(blocks[i], keystream);
      cipherBlocks.push(encrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        counter_value: counterValue,
        counter_bytes: bytesToHex(counterBytes),
        keystream: bytesToHex(keystream),
        operation: 'plaintext XOR AES_Encrypt(counter, key)',
        xor_with: bytesToHex(keystream),
        output: bytesToHex(encrypted),
        description:
          `Block ${i}: Counter = ${counterValue} → encrypt counter with AES ` +
          `to get keystream, then XOR with plaintext`,
      });
    }

    return {
      ciphertext: concatBytes(cipherBlocks),
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'CTR (Counter)',
        initial_counter: initialCounter,
        final_counter: blocks.length ? initialCounter + blocks.length - 1 : initialCounter,
        description:
          `Each block uses a unique counter value (starting at ${initialCounter}). ` +
          `The counter is encrypted with AES to produce a keystream, then XORed with plaintext. ` +
          `Blocks can be processed in parallel.`,
      },
    };
  },

  decrypt(ciphertext, key, initialCounter = 0, padSize = 0) {
    const blocks = splitBlocks(ciphertext);
    const plainBlocks = [];
    const blockDetails = [];

    for (let i = 0; i < blocks.length; i++) {
      const counterValue = initialCounter + i;
      const counterBytes = counterToBytes(counterValue);
      const keystream = aesEncryptBlock(counterBytes, key);
      const decrypted = xorBytes(blocks[i], keystream);
      plainBlocks.push(decrypted);
      blockDetails.push({
        block_number: i,
        input: bytesToHex(blocks[i]),
        counter_value: counterValue,
        counter_bytes: bytesToHex(counterBytes),
        keystream: bytesToHex(keystream),
        operation: 'ciphertext XOR AES_Encrypt(counter, key)',
        xor_with: bytesToHex(keystream),
        output: bytesToHex(decrypted),
        description:
          `Block ${i}: Same as encryption. Counter = ${counterValue}, ` +
          `XOR ciphertext with keystream to recover plaintext.`,
      });
    }

    const plaintext = zeroUnpad(concatBytes(plainBlocks), padSize);
    return {
      plaintext,
      pad_size: padSize,
      block_details: blockDetails,
      mode_info: {
        name: 'CTR (Counter)',
        initial_counter: initialCounter,
        final_counter: blocks.length ? initialCounter + blocks.length - 1 : initialCounter,
        description:
          'Decryption is identical to encryption. Same counter sequence produces the same keystream.',
      },
    };
  },
};

export const MODE_MAP = { ecb: ECB, cbc: CBC, cfb: CFB, ofb: OFB, ctr: CTR };
