# API Documentation

## Base URL

- **Development**: `http://localhost:8000`
- **Docker**: `http://localhost:3000/api` (proxied through nginx)

## Endpoints

### `GET /`

Health check and API information.

**Response:**
```json
{
  "message": "AES Modes Educational Tool API",
  "version": "1.0.0",
  "endpoints": {
    "POST /encrypt": "Encrypt plaintext with a specified AES mode",
    "POST /decrypt": "Decrypt ciphertext with a specified AES mode",
    "GET /modes": "List all supported AES modes with descriptions",
    "GET /modes/{mode}": "Get details about a specific mode"
  },
  "security_disclaimer": "..."
}
```

---

### `GET /modes`

List all supported AES modes with descriptions.

**Response:**
```json
{
  "modes": {
    "ecb": {
      "name": "ECB (Electronic Codebook)",
      "short": "Each block encrypted independently",
      "how_it_works": "...",
      "uses_iv": false,
      "uses_counter": false,
      "parallelizable": true,
      "stream_cipher": false
    },
    ...
  }
}
```

---

### `GET /modes/{mode}`

Get detailed info about a specific mode.

**Path parameters:**
- `mode`: One of `ecb`, `cbc`, `cfb`, `ofb`, `ctr`

**Response:**
```json
{
  "mode": {
    "name": "CBC (Cipher Block Chaining)",
    "short": "Blocks chained via XOR with previous ciphertext",
    "how_it_works": "...",
    "uses_iv": true,
    "uses_counter": false,
    "parallelizable": false,
    "stream_cipher": false
  }
}
```

---

### `POST /encrypt`

Encrypt plaintext using a specified AES mode.

**Request body:**
```json
{
  "plaintext": "Hello, World!",
  "key": "mysecretkey12345",
  "mode": "cbc",
  "input_format": "text",
  "key_format": "text",
  "initial_counter": 0
}
```

| Field             | Type   | Required | Default | Description |
|-------------------|--------|----------|---------|-------------|
| `plaintext`       | string | Yes      | —       | Data to encrypt |
| `key`             | string | Yes      | —       | AES key |
| `mode`            | string | Yes      | —       | `ecb`, `cbc`, `cfb`, `ofb`, or `ctr` |
| `input_format`    | string | No       | `text`  | `text` or `hex` |
| `key_format`      | string | No       | `text`  | `text` or `hex` |
| `initial_counter` | int    | No       | `0`     | Starting counter (CTR mode only) |

**Response (200):**
```json
{
  "success": true,
  "ciphertext_hex": "a1b2c3d4...",
  "pad_size": 3,
  "block_details": [
    {
      "block_number": 0,
      "input": "48656c6c6f2c20576f726c6421000000",
      "xor_with": "00000000000000000000000000000000",
      "after_xor": "48656c6c6f2c20576f726c6421000000",
      "operation": "AES_Encrypt(plaintext XOR prev_ciphertext, key)",
      "output": "a1b2c3d4...",
      "description": "Block 0: XOR plaintext with IV (all zeros), then AES encrypt"
    }
  ],
  "mode_info": {
    "name": "CBC (Cipher Block Chaining)",
    "iv_used": "00000000000000000000000000000000",
    "description": "..."
  },
  "security_disclaimer": "WARNING: This implementation uses a zero IV..."
}
```

**Error (400):**
```json
{
  "detail": "Key must be 16, 24, or 32 bytes. Got 10 bytes."
}
```

---

### `POST /decrypt`

Decrypt ciphertext using a specified AES mode.

**Request body:**
```json
{
  "ciphertext": "a1b2c3d4...",
  "key": "mysecretkey12345",
  "mode": "cbc",
  "key_format": "text",
  "pad_size": 3,
  "initial_counter": 0
}
```

| Field             | Type   | Required | Default | Description |
|-------------------|--------|----------|---------|-------------|
| `ciphertext`      | string | Yes      | —       | Hex-encoded ciphertext |
| `key`             | string | Yes      | —       | AES key |
| `mode`            | string | Yes      | —       | `ecb`, `cbc`, `cfb`, `ofb`, or `ctr` |
| `key_format`      | string | No       | `text`  | `text` or `hex` |
| `pad_size`        | int    | No       | `0`     | Padding bytes to remove |
| `initial_counter` | int    | No       | `0`     | Starting counter (CTR mode only) |

**Response (200):**
```json
{
  "success": true,
  "plaintext_text": "Hello, World!",
  "plaintext_hex": "48656c6c6f2c20576f726c6421",
  "pad_size": 3,
  "block_details": [...],
  "mode_info": {...}
}
```

## Error Handling

All errors return a JSON object with a `detail` field:

| Status | Cause |
|--------|-------|
| 400    | Invalid mode, bad key length, invalid hex, empty input |
| 422    | Missing required fields (Pydantic validation) |
| 500    | Internal server error |

## Input Validation

- **Key length**: Must be exactly 16, 24, or 32 bytes (128/192/256-bit AES)
- **Ciphertext length**: Must be a multiple of 16 bytes
- **Hex input**: Must contain valid hexadecimal characters
- **Plaintext**: Cannot be empty
