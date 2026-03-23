# AES Modes of Operation

## What is AES?

AES (Advanced Encryption Standard) is a symmetric block cipher that operates on 128-bit (16-byte) blocks. It supports key sizes of 128, 192, or 256 bits. AES itself only encrypts one 16-byte block at a time — **modes of operation** define how to handle messages longer than one block.

## Block Size and Padding

- **Block size**: 16 bytes (128 bits)
- **Padding**: This implementation uses zero-padding — the last block is padded with `0x00` bytes to fill 16 bytes
- **Pad size tracking**: The number of padding bytes is recorded so they can be stripped during decryption

## Modes Implemented

### ECB — Electronic Codebook

```
Encrypt: C[i] = AES_Encrypt(P[i], K)
Decrypt: P[i] = AES_Decrypt(C[i], K)
```

- Each block is encrypted independently with the same key
- **No IV, no chaining**
- Identical plaintext blocks → identical ciphertext blocks
- Parallelizable for both encryption and decryption
- **Weakness**: Pattern preservation — the structure of the plaintext is visible in the ciphertext (the "ECB penguin" problem)

### CBC — Cipher Block Chaining

```
Encrypt: C[i] = AES_Encrypt(P[i] ⊕ C[i-1], K),  C[-1] = IV
Decrypt: P[i] = AES_Decrypt(C[i], K) ⊕ C[i-1],   C[-1] = IV
```

- Each plaintext block is XORed with the previous ciphertext block before encryption
- First block uses the IV (all zeros in this implementation)
- Identical plaintext blocks produce different ciphertext (when preceded by different blocks)
- Encryption is sequential; decryption can be parallelized
- **Uses both AES encryption and decryption**

### CFB — Cipher Feedback

```
Encrypt: C[i] = P[i] ⊕ AES_Encrypt(C[i-1], K),   C[-1] = IV
Decrypt: P[i] = C[i] ⊕ AES_Encrypt(C[i-1], K),   C[-1] = IV
```

- Turns AES into a stream cipher
- Encrypts the previous ciphertext (feedback) to produce a keystream
- XORs the keystream with plaintext/ciphertext
- **Only uses AES encryption**, never AES decryption
- Feedback comes from the **ciphertext**

### OFB — Output Feedback

```
Encrypt: O[i] = AES_Encrypt(O[i-1], K),  O[-1] = IV
         C[i] = P[i] ⊕ O[i]
Decrypt: O[i] = AES_Encrypt(O[i-1], K),  O[-1] = IV
         P[i] = C[i] ⊕ O[i]
```

- Similar to CFB, but feedback comes from the **AES output**, not the ciphertext
- The keystream is independent of the plaintext and ciphertext
- Encryption and decryption are identical operations
- **Only uses AES encryption**
- Bit errors in ciphertext don't propagate (only the affected bit is wrong)

### CTR — Counter

```
Encrypt: C[i] = P[i] ⊕ AES_Encrypt(Counter + i, K)
Decrypt: P[i] = C[i] ⊕ AES_Encrypt(Counter + i, K)
```

- Encrypts a counter value (not data) to produce a keystream
- Counter starts at a user-defined value and increments by 1 per block
- **Fully parallelizable** — blocks are independent
- Allows **random access** — can decrypt any block without processing previous blocks
- **Only uses AES encryption**
- Encryption and decryption are identical
- Most modern and widely recommended mode

## Key Differences at a Glance

| Feature              | ECB   | CBC      | CFB      | OFB   | CTR   |
|----------------------|-------|----------|----------|-------|-------|
| IV/Nonce             | None  | Required | Required | Required | Counter |
| Parallelizable (Enc) | Yes   | No       | No       | No    | Yes   |
| Parallelizable (Dec) | Yes   | Yes      | Yes      | No    | Yes   |
| Uses AES Decrypt     | Yes   | Yes      | No       | No    | No    |
| Error Propagation    | Block | 2 blocks | 2 blocks | Bit   | Bit   |
| Pattern Hiding       | No    | Yes      | Yes      | Yes   | Yes   |

## Why Zero IV is Insecure

In this educational tool, the IV is always `0x00...00`. In real systems:

1. **Deterministic encryption**: Same plaintext + key always produces the same ciphertext
2. **Enables chosen-plaintext attacks**: An attacker can detect when the same message is sent twice
3. **Breaks semantic security**: The encryption reveals information about the plaintext
4. **Real-world requirement**: Use `os.urandom(16)` or equivalent for each encryption
