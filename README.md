# AES Encryption Modes — Educational Tool

A web application for learning how AES block cipher modes of operation work.
Encrypt and decrypt data with ECB, CBC, CFB, OFB, and CTR, then watch each
block flow through the cipher with animated diagrams populated by the real hex
values from your run.

All cryptography runs **client-side in the browser** — the backend only handles
user accounts (register / login / session). No plaintext or ciphertext ever
leaves your machine.

## Features

- **5 AES modes**: ECB, CBC, CFB, OFB, CTR
- **AES-128 / 192 / 256**: pure-JavaScript AES core implemented from the FIPS 197 specification (S-box, key expansion, ShiftRows, MixColumns, etc.). No `crypto.subtle`, no PyCryptodome, no library AES — every step is visible in the source.
- **Mode implementations from scratch**: each mode is wired up in `modes.js` following NIST SP 800-38A.
- **Animated flow diagrams** (SVG) with play / pause / step / reset, for both encryption and decryption.
- **AES Internals drill-down**: click any **Encrypt** or **Decrypt** box in a diagram to open a modal that walks through the round-by-round transformations on the 4×4 state — AddRoundKey, SubBytes, ShiftRows, MixColumns (and inverses for decryption) — using the actual block input and key from your run, with changed cells highlighted between Before/After grids and the round key shown when relevant.
- **Block-by-block detail view**: per-block inputs, XOR operands, keystreams, counters, and outputs.
- **Random key generator** with 128 / 192 / 256-bit options, plus manual key entry as text or hex.
- **Password strength meter** on signup with live feedback against length, casing, digit, and symbol checks.
- **User authentication**: register / log in / log out, JWT cookie sessions, passwords hashed with bcrypt, server-side rate limiting.
- **Responsive dark UI** optimised for reading hex.

## Project Structure

```
AES-and-More/
├── docker-compose.yml          # Local dev: frontend + backend
├── render.yaml                 # Production deploy config (Render.com)
├── README.md
│
├── backend/                    # FastAPI auth backend (no crypto here)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app, CORS, startup table creation
│       ├── db.py               # SQLAlchemy engine (Postgres / SQLite fallback)
│       ├── limiter.py          # Rate-limiting setup
│       └── auth/
│           ├── routes.py       # /auth/register, /auth/login, /auth/logout, /auth/me
│           ├── models.py       # User SQLAlchemy model
│           ├── schemas.py      # Pydantic request/response shapes
│           ├── security.py     # JWT signing/verification, bcrypt hashing
│           └── deps.py         # FastAPI auth dependencies
│
├── frontend/                   # React app — all crypto runs here
│   ├── Dockerfile              # Multi-stage: CRA build → nginx
│   ├── nginx.conf
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js
│       ├── api.js              # Backend fetch wrapper
│       ├── index.js
│       ├── index.css           # Dark theme, responsive styles
│       │
│       ├── crypto/             # ★ AES + modes implementation (client-side)
│       │   ├── aes.js          # Pure-JS AES-128/192/256 (FIPS 197)
│       │   ├── aes-trace.js    # Instrumented AES — captures every round transition for the internals modal
│       │   ├── modes.js        # ECB / CBC / CFB / OFB / CTR (NIST SP 800-38A)
│       │   ├── encode.js       # Hex/text encoding, padding, block helpers
│       │   └── index.js        # encryptLocal / decryptLocal entry points
│       │
│       ├── auth/
│       │   ├── AuthContext.js  # React context + register/login/logout flow
│       │   └── AuthScreen.js   # Sign-in / sign-up form with strength meter
│       │
│       └── components/
│           ├── ModeSelector.js
│           ├── InputPanel.js          # Plaintext/key inputs, random key, format toggles
│           ├── OutputPanel.js         # Ciphertext/plaintext output, padding, mode info
│           ├── BlockVisualization.js  # Per-block expandable detail
│           ├── ModeComparison.js      # Mode comparison table
│           ├── FlowDiagram.js         # Animation controller + legend
│           ├── AesInternalsModal.js   # Round-by-round AES drill-down (4×4 state grid + inverses)
│           └── diagrams/
│               ├── DiagramPrimitives.js
│               ├── ECBDiagram.js
│               ├── CBCDiagram.js
│               ├── CFBDiagram.js
│               ├── OFBDiagram.js
│               └── CTRDiagram.js
│
├── ImageModels/                # Reference textbook diagrams used as visual guides
│   ├── ecb_mode.png
│   ├── cbc_mode.png
│   ├── cfb_mode.png
│   ├── ofb_mode.png
│   └── ctr_mode.png
│
└── docs/
    ├── aes_modes.md
    └── sources.md         
```

## Quick Start (Docker)

```bash
docker compose up --build
```

Open **http://localhost:3000**.


## Backend API

The backend only handles authentication. All AES work is client-side.

| Method | Path             | Description                       |
|--------|------------------|-----------------------------------|
| `GET`  | `/`              | Health check                      |
| `POST` | `/auth/register` | Create a new user account         |
| `POST` | `/auth/login`    | Authenticate, sets a session cookie |
| `POST` | `/auth/logout`   | Clear the session cookie          |
| `GET`  | `/auth/me`       | Current user (via session cookie) |

## Environment variables

| Variable           | Purpose                                                          |
|--------------------|------------------------------------------------------------------|
| `DATABASE_URL`     | Postgres connection string (falls back to local SQLite if unset) |
| `JWT_SECRET`       | Secret key for signing session JWTs (generate a strong random)   |
| `ALLOWED_ORIGINS`  | Comma-separated list of allowed CORS origins                     |
| `COOKIE_SECURE`    | `true` in prod (HTTPS-only cookies), `false` locally             |
| `COOKIE_SAMESITE`  | `none` cross-site in prod, `lax` locally                         |
| `PG_SSLMODE`       | Defaults to `require` for Postgres                               |
| `PG_SSL_ROOT_CERT` | Optional CA cert path for `verify-full` SSL                      |

### Frontend

| Variable              | Purpose                                          |
|-----------------------|--------------------------------------------------|
| `REACT_APP_API_URL`   | Backend base URL (baked in at build time)        |

## Usage

1. Register / log in.
2. Pick a mode (ECB / CBC / CFB / OFB / CTR).
3. Enter plaintext, choose a 16/24/32-byte key (or generate a random one).
4. Click **Encrypt** — the ciphertext appears in hex.
5. Scroll down to the flow diagram and hit **Play** to see each block move through the cipher.
6. Click any **Encrypt** or **Decrypt** box in the diagram to drill into the AES internals for that block — round-by-round state transitions on the 4×4 matrix.
7. Switch to **Decrypt**, paste the ciphertext (hex), and verify the round-trip.

## Security disclaimer

**Educational use only.** This project demonstrates how AES modes work
internally; do not use it to protect real data.

- Uses an **all-zero IV** for chaining modes — insecure in real systems.
- No authenticated encryption (no GCM / no MAC).
- The user-account layer is intentionally minimal.

In production cryptosystems:

- Use a fresh, cryptographically random IV/nonce per encryption.
- Use authenticated encryption such as AES-GCM.
- Derive keys with a proper KDF (Argon2 / PBKDF2 / scrypt).

## Tech stack

- **Frontend**: React 18, Create React App, custom CSS
- **Crypto**: pure-JavaScript AES (FIPS 197) and modes (NIST SP 800-38A), implemented in [`frontend/src/crypto/`](frontend/src/crypto/)
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, bcrypt, PyJWT
- **Database**: PostgreSQL (production) / SQLite (local fallback)
- **Infrastructure**: Docker, Docker Compose, nginx, Render.com (production)

## Documentation

- [AES Modes](docs/aes_modes.md) — how each mode works
- [**Sources & attribution**](docs/sources.md) — every reference used to build this project
