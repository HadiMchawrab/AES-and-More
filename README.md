# AES Encryption Modes — Educational Tool

A full-stack web application for learning how AES block cipher modes of operation work. Visualize block-by-block processing, XOR operations, and the differences between ECB, CBC, CFB, OFB, and CTR modes.

## Features

- **5 AES modes**: ECB, CBC, CFB, OFB, CTR — all implemented from scratch
- **Animated flow diagrams**: SVG diagrams matching textbook-style mode illustrations, populated with real hex values from your encryption/decryption and animated block-by-block with play/pause/step controls
- **Block-by-block detail view**: Expandable per-block breakdown showing inputs, outputs, XOR operands, keystreams, and counters
- **Encrypt & Decrypt**: Full round-trip with padding tracking
- **Mode comparison table**: Side-by-side feature comparison with explanations
- **Text/Hex input toggle**: Enter data as text or raw hex
- **User-defined counter**: Set CTR mode's initial counter value
- **Copy buttons**: One-click copy of results
- **Responsive dark theme UI**: Works on desktop and mobile, optimized for reading hex data
- **Dockerized**: Production-ready with nginx reverse proxy

## Quick Start (Docker)

```bash
docker compose up --build
```

Then open **http://localhost:3000** in your browser.

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3000/api` (proxied) or `http://localhost:8000` (direct)

## Quick Start (Local Development)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000` and expects the backend at `http://localhost:8000`.

## Project Structure

```
AES-and-More/
├── docker-compose.yml          # Orchestrates frontend + backend
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app & endpoints
│       ├── models.py           # Request/response schemas
│       ├── modes/
│       │   ├── ecb.py          # Electronic Codebook
│       │   ├── cbc.py          # Cipher Block Chaining
│       │   ├── cfb.py          # Cipher Feedback
│       │   ├── ofb.py          # Output Feedback
│       │   └── ctr.py          # Counter
│       └── utils/
│           ├── aes_core.py     # Raw AES + XOR primitives
│           ├── conversions.py  # Text/hex parsing
│           └── padding.py      # Zero-padding
│
├── frontend/
│   ├── Dockerfile              # Multi-stage: build + nginx
│   ├── nginx.conf              # Reverse proxy config
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js              # Main app component
│       ├── index.js
│       ├── index.css           # Dark theme + responsive styles
│       └── components/
│           ├── ModeSelector.js
│           ├── InputPanel.js
│           ├── OutputPanel.js
│           ├── BlockVisualization.js
│           ├── ModeComparison.js
│           ├── FlowDiagram.js         # Animation controller + legend
│           └── diagrams/
│               ├── DiagramPrimitives.js  # Shared SVG building blocks
│               ├── ECBDiagram.js
│               ├── CBCDiagram.js
│               ├── CFBDiagram.js
│               ├── OFBDiagram.js
│               └── CTRDiagram.js
│
├── ImageModels/                # Reference diagrams for each mode
│   ├── ecb_mode.png
│   ├── cbc_mode.png
│   ├── cfb_mode.png
│   ├── ofb_mode.png
│   └── ctr_mode.png
│
└── docs/
    ├── architecture.md         # System design
    ├── aes_modes.md            # Mode explanations
    ├── api.md                  # API reference
    ├── implementation.md       # How modes are coded
    └── sources.md              # All references & attribution
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/modes` | List all modes with descriptions |
| `GET` | `/modes/{mode}` | Details for a specific mode |
| `POST` | `/encrypt` | Encrypt plaintext |
| `POST` | `/decrypt` | Decrypt ciphertext |

See [docs/api.md](docs/api.md) for full API documentation.

## Usage Example

1. Select a mode (e.g., CBC)
2. Enter plaintext: `Hello, World!`
3. Enter a 16-character key: `mysecretkey12345`
4. Click **Encrypt**
5. View the ciphertext, padding info, and block-by-block XOR visualization
6. Scroll down to the **flow diagram** — click Play to watch the encryption animate block-by-block with real hex values
7. Switch to Decrypt, paste the ciphertext and pad size, click **Decrypt**

## Security Disclaimer

**This tool is for EDUCATIONAL PURPOSES ONLY.**

- Uses a **zero IV** (`0x00...00`) which is insecure in real systems
- No authentication, rate limiting, or HTTPS enforcement
- Do not use this for actual data protection

In production cryptographic systems:
- Always use a cryptographically random IV/nonce for each encryption
- Use authenticated encryption (e.g., AES-GCM)
- Use a proper key derivation function (e.g., Argon2, PBKDF2)

## Tech Stack

- **Backend**: Python 3.12, FastAPI, PyCryptodome, Uvicorn
- **Frontend**: React 18, Create React App, custom CSS (no framework)
- **Infrastructure**: Docker, Docker Compose, nginx

## Documentation

- [Architecture](docs/architecture.md) — System design and data flow
- [AES Modes](docs/aes_modes.md) — How each mode works
- [API Reference](docs/api.md) — Endpoint documentation
- [Implementation](docs/implementation.md) — Code walkthrough
- [Sources](docs/sources.md) — Libraries, references, and attribution
