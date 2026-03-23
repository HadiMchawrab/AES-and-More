# Implementation Details

## Core AES Primitive

All five modes are built on top of the same core function:

```python
# backend/app/utils/aes_core.py
from Crypto.Cipher import AES

def aes_encrypt_block(block: bytes, key: bytes) -> bytes:
    cipher = AES.new(key, AES.MODE_ECB)
    return cipher.encrypt(block)
```

We use PyCryptodome's `AES.MODE_ECB` to encrypt a single 16-byte block. This is the raw AES operation — the building block for all modes.

The `xor_bytes()` utility performs byte-wise XOR:

```python
def xor_bytes(a: bytes, b: bytes) -> bytes:
    return bytes(x ^ y for x, y in zip(a, b))
```

## Zero Padding

```python
# backend/app/utils/padding.py
def zero_pad(data: bytes) -> tuple[bytes, int]:
    remainder = len(data) % 16
    if remainder == 0:
        return data, 0
    pad_size = 16 - remainder
    return data + b"\x00" * pad_size, pad_size
```

- Pads with `0x00` bytes to reach a multiple of 16
- Returns the pad size so it can be recorded and used for unpadding
- If data is already aligned, no padding is added (pad_size = 0)

## Mode Implementations

### ECB — Simplest Mode

```python
for block in blocks:
    encrypted = aes_encrypt_block(block, key)
```

No state between blocks. Each block processed independently.

### CBC — XOR Then Encrypt

```python
prev_cipher = ZERO_IV  # 16 zero bytes
for block in blocks:
    xored = xor_bytes(block, prev_cipher)
    encrypted = aes_encrypt_block(xored, key)
    prev_cipher = encrypted  # Chain to next block
```

Decryption reverses: AES decrypt first, then XOR with previous ciphertext.

### CFB — Encrypt Feedback, XOR Data

```python
feedback = ZERO_IV
for block in blocks:
    keystream = aes_encrypt_block(feedback, key)
    encrypted = xor_bytes(block, keystream)
    feedback = encrypted  # Feedback is the CIPHERTEXT
```

Key insight: feedback comes from the ciphertext. Same code for decrypt (but feedback = ciphertext block, not the output).

### OFB — Encrypt Feedback, XOR Data (Different Feedback)

```python
feedback = ZERO_IV
for block in blocks:
    keystream = aes_encrypt_block(feedback, key)
    encrypted = xor_bytes(block, keystream)
    feedback = keystream  # Feedback is the AES OUTPUT (not ciphertext!)
```

The only difference from CFB: `feedback = keystream` instead of `feedback = encrypted`. This makes the keystream independent of the data.

### CTR — Encrypt Counter, XOR Data

```python
for i, block in enumerate(blocks):
    counter_bytes = (initial_counter + i).to_bytes(16, 'big')
    keystream = aes_encrypt_block(counter_bytes, key)
    encrypted = xor_bytes(block, keystream)
```

No chaining at all. The counter is a 128-bit big-endian integer.

## Block Detail Recording

Each mode records detailed information for every block processed:

```python
block_details.append({
    "block_number": i,
    "input": block.hex(),
    "operation": "description of operation",
    "output": encrypted.hex(),
    # Mode-specific fields:
    "xor_with": prev_cipher.hex(),      # CBC
    "after_xor": xored.hex(),           # CBC
    "feedback_input": feedback.hex(),    # CFB, OFB
    "keystream": keystream.hex(),        # CFB, OFB, CTR
    "counter_value": counter_value,      # CTR
    "counter_bytes": counter_bytes.hex(),# CTR
    "description": "human-readable explanation"
})
```

This data powers the frontend's block-by-block visualization.

## Input Handling

The API accepts data in two formats:
- **text**: UTF-8 encoded string → bytes
- **hex**: Hex string (spaces and `0x` prefix stripped) → bytes

Key validation ensures the key is exactly 16, 24, or 32 bytes for AES-128/192/256.

## Docker Architecture

- **Backend**: Python 3.12-slim with uvicorn serving FastAPI on port 8000
- **Frontend**: Multi-stage build — Node 20 builds the React app, nginx serves the static files
- **Nginx**: Serves the React SPA and reverse-proxies `/api/*` to the backend container
- The frontend's `REACT_APP_API_URL` is set to `/api` at build time so API calls go through nginx
