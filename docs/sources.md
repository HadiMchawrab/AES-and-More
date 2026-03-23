# Sources and References

## Libraries Used

| Library | Version | What it's used for | Link |
|---------|---------|-------------------|------|
| PyCryptodome | 3.20.0 | Core AES block encryption/decryption primitive | https://www.pycryptodome.org/ |
| FastAPI | 0.111.0 | Backend REST API framework | https://fastapi.tiangolo.com/ |
| Uvicorn | 0.30.1 | ASGI server for FastAPI | https://www.uvicorn.org/ |
| Pydantic | 2.7.4 | Request/response validation models | https://docs.pydantic.dev/ |
| React | 18.2.0 | Frontend UI framework | https://react.dev/ |
| React Scripts | 5.0.1 | Create React App build toolchain | https://create-react-app.dev/ |

## Documentation References

| Resource | What it was used for |
|----------|---------------------|
| [NIST SP 800-38A](https://csrc.nist.gov/publications/detail/sp/800-38a/final) | Official specification for AES modes of operation (ECB, CBC, CFB, OFB, CTR) |
| [FIPS 197](https://csrc.nist.gov/publications/detail/fips/197/final) | AES (Rijndael) algorithm specification |
| [PyCryptodome AES docs](https://www.pycryptodome.org/src/cipher/aes) | API reference for AES cipher implementation |
| [FastAPI documentation](https://fastapi.tiangolo.com/tutorial/) | API endpoint design, Pydantic models, CORS middleware |
| [React documentation](https://react.dev/learn) | Component architecture, hooks, state management |
| [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/) | Frontend Dockerfile optimization |
| [nginx reverse proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) | API proxying configuration |

## Tutorials and Educational References

| Resource | What it was used for |
|----------|---------------------|
| [Wikipedia: Block cipher mode of operation](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation) | Diagrams and explanations of ECB, CBC, CFB, OFB, CTR |
| [Computerphile: AES Explained](https://www.youtube.com/watch?v=O4xNJsjtN6E) | Understanding AES internals |
| [The ECB Penguin](https://blog.filippo.io/the-ecb-penguin/) | Why ECB mode is insecure — visual demonstration |
| [Crypto101](https://www.crypto101.io/) | General cryptography education reference |

## Code Attribution

- **AES block encryption**: Uses PyCryptodome's `AES.new(key, AES.MODE_ECB).encrypt(block)` as the core primitive. All mode logic (CBC chaining, CFB/OFB feedback, CTR counter) is implemented from scratch based on the NIST SP 800-38A specification.
- **Mode implementations**: Written from first principles following the mathematical definitions in NIST SP 800-38A. No mode-level code was copied from existing implementations.
- **Zero padding**: Standard zero-padding approach — pad with null bytes, track count for removal.
- **Frontend design**: Custom CSS dark theme. No CSS framework used.
