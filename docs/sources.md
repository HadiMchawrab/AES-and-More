# Sources and Attribution

This document lists every external reference used to build this project — the
specifications I implemented from, the textbooks/tutorials I learned from, and
the libraries I depend on.

## Where the AES code came from

The AES algorithm in [`frontend/src/crypto/aes.js`](../frontend/src/crypto/aes.js)
and the five modes (ECB, CBC, CFB, OFB, CTR) in
[`frontend/src/crypto/modes.js`](../frontend/src/crypto/modes.js) were
implemented for this project with AI-assisted code generation, drawing on the
following standard published references:

| Reference | Used for | Link |
|-----------|---------|------|
| **NIST FIPS 197** — official AES specification | The S-box constants, key-expansion algorithm, round structure (AES-128/192/256), and the GF(2⁸) arithmetic underlying `MixColumns` / `InvMixColumns` | https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197-upd1.pdf |
| **NIST SP 800-38A** — official mode-of-operation specification | The chaining/feedback equations and pseudocode for ECB, CBC, CFB, OFB, and CTR | https://csrc.nist.gov/publications/detail/sp/800-38a/final |
| **Stallings, *Cryptography and Network Security*** — block-cipher-mode reference diagrams | Visual layout of each mode's data flow, used as a guide for the SVG flow diagrams (see [`ImageModels/`](../ImageModels/)) | — |

For the JavaScript style of an AES implementation (use of `Uint8Array`, function
shape, key-expansion loop), the following well-known open-source projects were
consulted as references for "what idiomatic JS AES code looks like." None of
them was copied verbatim — naming and structure in our `aes.js` are different
from each — but they were useful to compare against:

- [ricmoo/aes-js](https://github.com/ricmoo/aes-js) — popular pure-JS AES library
- [chrisveness/crypto](https://github.com/chrisveness/crypto/blob/master/aes.js) — the AES implementation behind movable-type.co.uk/scripts/aes.html
- [invisal/god_crypto](https://github.com/invisal/god_crypto/blob/master/src/aes/aes_js.ts) — TypeScript AES with a similar `xtime`-based GF approach

After the initial generation, the code was edited and adapted for this
project: ES module exports, hex/text encoding helpers, per-block
instrumentation (so the UI can show inputs, outputs, keystreams, and counters
for every block), padding tracking, and integration with the React UI.

No third-party cryptography library is loaded by the frontend. The browser's
built-in `crypto.getRandomValues` is used only by the random-key generator
button (see [`InputPanel.js`](../frontend/src/components/InputPanel.js)).

## Libraries used

### Frontend

| Library | Version | Purpose | Link |
|---------|---------|---------|------|
| React | 18.x | UI framework | https://react.dev/ |
| Create React App (`react-scripts`) | 5.x | Build toolchain | https://create-react-app.dev/ |

The frontend uses **no cryptography library**. All AES and mode code is
hand-written; the browser's built-in `crypto.getRandomValues` is used only for
generating random keys (see [`InputPanel.js`](../frontend/src/components/InputPanel.js)).

### Backend

The backend is the **authentication layer only** — it does not perform any
encryption.

| Library | Purpose | Link |
|---------|---------|------|
| FastAPI | REST framework for `/auth/*` endpoints | https://fastapi.tiangolo.com/ |
| Uvicorn | ASGI server | https://www.uvicorn.org/ |
| Pydantic | Request/response validation | https://docs.pydantic.dev/ |
| SQLAlchemy | ORM and database engine | https://www.sqlalchemy.org/ |
| psycopg2-binary | PostgreSQL driver | https://www.psycopg.org/ |
| bcrypt | Password hashing | https://github.com/pyca/bcrypt/ |
| PyJWT | Session JWT signing/verification | https://pyjwt.readthedocs.io/ |
| python-dotenv | Loading `.env` config | https://github.com/theskumar/python-dotenv |
| SlowAPI | Rate limiting | https://slowapi.readthedocs.io/ |

### Infrastructure / documentation references

| Resource | Used for | Link |
|----------|---------|------|
| FastAPI docs | API design, CORS middleware, dependency injection | https://fastapi.tiangolo.com/tutorial/ |
| React docs | Component structure, hooks, context | https://react.dev/learn |
| Docker multi-stage builds | Frontend Dockerfile (CRA build → nginx) | https://docs.docker.com/build/building/multi-stage/ |
| nginx HTTP proxy | API proxying for local dev | https://nginx.org/en/docs/http/ngx_http_proxy_module.html |
| Render.com docs | Production deployment configuration in `render.yaml` | https://render.com/docs |
| OWASP Cheat Sheet — *Password Storage* | bcrypt-based password hashing approach | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| OWASP Cheat Sheet — *JSON Web Token for Java* (general JWT principles) | Session JWT design | https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html |


## Code attribution summary

- **AES core (`frontend/src/crypto/aes.js`)**: written from scratch from FIPS 197.
- **Mode implementations (`frontend/src/crypto/modes.js`)**: written from scratch from NIST SP 800-38A.
- **Encoding helpers (`frontend/src/crypto/encode.js`)**: original code (zero padding, hex/text conversions).
- **Backend authentication**: implemented using FastAPI's documented patterns and PyJWT/bcrypt as standard primitives — no copy-pasted route code.
