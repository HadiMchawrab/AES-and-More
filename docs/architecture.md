# System Architecture

## Overview

AES-and-More is a full-stack educational web application for exploring AES block cipher modes. It consists of a FastAPI backend that performs the actual cryptographic operations and a React frontend that provides an interactive UI with block-by-block visualization.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Docker Compose                    │
│                                                     │
│  ┌──────────────────────┐  ┌─────────────────────┐ │
│  │   Frontend (nginx)   │  │   Backend (uvicorn)  │ │
│  │                      │  │                      │ │
│  │  React SPA           │  │  FastAPI             │ │
│  │  - ModeSelector      │──│  - POST /encrypt     │ │
│  │  - InputPanel        │  │  - POST /decrypt     │ │
│  │  - OutputPanel       │  │  - GET /modes        │ │
│  │  - BlockVisualization│  │  - GET /modes/{mode} │ │
│  │  - ModeComparison    │  │                      │ │
│  │                      │  │  AES Modes           │ │
│  │  Port 3000 (→ 80)    │  │  - ECB, CBC, CFB     │ │
│  │                      │  │  - OFB, CTR          │ │
│  └──────────────────────┘  │                      │ │
│                            │  Port 8000            │ │
│                            └─────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Component Breakdown

### Backend (`/backend`)

```
backend/
├── Dockerfile
├── requirements.txt
└── app/
    ├── main.py            # FastAPI app, endpoints, CORS
    ├── models.py          # Pydantic request/response models
    ├── modes/
    │   ├── ecb.py         # ECB mode implementation
    │   ├── cbc.py         # CBC mode implementation
    │   ├── cfb.py         # CFB mode implementation
    │   ├── ofb.py         # OFB mode implementation
    │   └── ctr.py         # CTR mode implementation
    └── utils/
        ├── aes_core.py    # Raw AES encrypt/decrypt + XOR
        ├── conversions.py # Text/hex input parsing
        └── padding.py     # Zero-padding logic
```

**Design decisions:**
- Each AES mode is in its own module with `encrypt()` and `decrypt()` static methods
- All modes use `aes_core.aes_encrypt_block()` as the primitive — this is the raw AES operation from PyCryptodome
- Block-by-block details are returned from each mode for educational visualization
- Pydantic models enforce input validation at the API boundary

### Frontend (`/frontend`)

```
frontend/
├── Dockerfile
├── nginx.conf             # Reverse proxy + SPA config
├── package.json
├── public/index.html
└── src/
    ├── index.js
    ├── index.css          # All styles (dark theme)
    ├── App.js             # Main app, API calls, state
    └── components/
        ├── ModeSelector.js       # Mode tabs + descriptions
        ├── InputPanel.js         # Input form (data, key, format)
        ├── OutputPanel.js        # Results + copy buttons
        ├── BlockVisualization.js # Block-by-block XOR steps
        └── ModeComparison.js    # Comparison table
```

**Design decisions:**
- Standard Create React App structure
- Pure CSS (no Tailwind dependency) for simplicity in Docker builds
- Dark theme by default for readability of hex data
- API URL configurable via `REACT_APP_API_URL` environment variable

### Docker Setup

- **Frontend container**: Multi-stage build (Node for build, nginx for serving)
- **Backend container**: Python 3.12 slim image with uvicorn
- **Nginx** reverse-proxies `/api/*` requests to the backend container
- **docker-compose.yml** orchestrates both services

## Data Flow

1. User selects mode, enters plaintext/key, clicks Encrypt
2. Frontend sends `POST /encrypt` with mode, data, key, formats
3. Backend parses input, validates key length, pads plaintext
4. Selected mode processes data block-by-block, recording each step
5. Backend returns ciphertext + block details + padding info + mode info
6. Frontend renders result, block visualization, and XOR steps

## Security Model

This is an **educational tool**, not a production cryptographic system:
- IV is always zero (insecure)
- No authentication or rate limiting
- No HTTPS enforcement (handled by deployment infrastructure)
- Clear disclaimers are displayed in the API responses and UI
