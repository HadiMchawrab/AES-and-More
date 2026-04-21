"""
FastAPI application for AES encryption/decryption in multiple modes.

Educational tool demonstrating how ECB, CBC, CFB, OFB, and CTR modes work internally.
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import EncryptRequest, DecryptRequest, EncryptResponse, DecryptResponse
from .modes import ECBMode, CBCMode, CFBMode, OFBMode, CTRMode
from .utils.conversions import parse_input, parse_key, bytes_to_hex, bytes_to_text, hex_to_bytes

app = FastAPI(
    title="AES Modes Educational Tool",
    description=(
        "An educational API demonstrating AES encryption in ECB, CBC, CFB, OFB, and CTR modes. "
        "Shows block-by-block processing, XOR operations, and mode-specific behavior."
    ),
    version="1.0.0",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODE_MAP = {
    "ecb": ECBMode,
    "cbc": CBCMode,
    "cfb": CFBMode,
    "ofb": OFBMode,
    "ctr": CTRMode,
}

MODE_DESCRIPTIONS = {
    "ecb": {
        "name": "ECB (Electronic Codebook)",
        "short": "Each block encrypted independently",
        "how_it_works": (
            "Each 16-byte block is encrypted separately with the same key. "
            "No IV or chaining. Identical plaintext blocks produce identical ciphertext blocks."
        ),
        "uses_iv": False,
        "uses_counter": False,
        "parallelizable": True,
        "stream_cipher": False,
    },
    "cbc": {
        "name": "CBC (Cipher Block Chaining)",
        "short": "Blocks chained via XOR with previous ciphertext",
        "how_it_works": (
            "Each plaintext block is XORed with the previous ciphertext block before encryption. "
            "The first block uses an IV (all zeros in this demo). This means identical plaintext "
            "blocks produce different ciphertext when preceded by different blocks."
        ),
        "uses_iv": True,
        "uses_counter": False,
        "parallelizable": False,
        "stream_cipher": False,
    },
    "cfb": {
        "name": "CFB (Cipher Feedback)",
        "short": "Stream cipher using previous ciphertext as feedback",
        "how_it_works": (
            "The previous ciphertext block (or IV) is encrypted, then XORed with plaintext. "
            "Only AES encryption is used, never decryption. The feedback comes from the ciphertext."
        ),
        "uses_iv": True,
        "uses_counter": False,
        "parallelizable": False,
        "stream_cipher": True,
    },
    "ofb": {
        "name": "OFB (Output Feedback)",
        "short": "Stream cipher using AES output as feedback",
        "how_it_works": (
            "Similar to CFB but the feedback comes from the AES output, not the ciphertext. "
            "This means the keystream is independent of the data, and encryption/decryption "
            "are identical operations."
        ),
        "uses_iv": True,
        "uses_counter": False,
        "parallelizable": False,
        "stream_cipher": True,
    },
    "ctr": {
        "name": "CTR (Counter)",
        "short": "Stream cipher using incrementing counter",
        "how_it_works": (
            "A counter value is encrypted for each block to produce a keystream. "
            "The counter increments by 1 for each block. Allows random access and "
            "parallel processing. User can set the initial counter value."
        ),
        "uses_iv": False,
        "uses_counter": True,
        "parallelizable": True,
        "stream_cipher": True,
    },
}


@app.get("/")
async def root():
    """API root — health check and info."""
    return {
        "message": "AES Modes Educational Tool API",
        "version": "1.0.0",
        "endpoints": {
            "POST /encrypt": "Encrypt plaintext with a specified AES mode",
            "POST /decrypt": "Decrypt ciphertext with a specified AES mode",
            "GET /modes": "List all supported AES modes with descriptions",
            "GET /modes/{mode}": "Get details about a specific mode",
        },
        "security_disclaimer": (
            "This tool is for EDUCATIONAL PURPOSES ONLY. "
            "It uses a zero IV which is insecure for real-world use."
        )
    }


@app.get("/modes")
async def list_modes():
    """List all supported AES modes with descriptions."""
    return {"modes": MODE_DESCRIPTIONS}


@app.get("/modes/{mode}")
async def get_mode_info(mode: str):
    """Get detailed information about a specific AES mode."""
    mode = mode.lower()
    if mode not in MODE_DESCRIPTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown mode '{mode}'. Supported modes: {', '.join(MODE_DESCRIPTIONS.keys())}"
        )
    return {"mode": MODE_DESCRIPTIONS[mode]}


@app.post("/encrypt", response_model=EncryptResponse)
async def encrypt(req: EncryptRequest):
    """
    Encrypt plaintext using a specified AES mode.

    Returns the ciphertext along with detailed block-by-block processing info.
    """
    mode = req.mode.lower()
    if mode not in MODE_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown mode '{mode}'. Supported modes: {', '.join(MODE_MAP.keys())}"
        )

    try:
        plaintext_bytes = parse_input(req.plaintext, req.input_format)
        key_bytes = parse_key(req.key, req.key_format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(plaintext_bytes) == 0:
        raise HTTPException(status_code=400, detail="Plaintext cannot be empty")

    mode_impl = MODE_MAP[mode]

    if mode == "ctr":
        result = mode_impl.encrypt(plaintext_bytes, key_bytes, req.initial_counter or 0)
    else:
        result = mode_impl.encrypt(plaintext_bytes, key_bytes)

    return EncryptResponse(
        success=True,
        ciphertext_hex=bytes_to_hex(result["ciphertext"]),
        pad_size=result["pad_size"],
        block_details=result["block_details"],
        mode_info=result["mode_info"],
    )


@app.post("/decrypt", response_model=DecryptResponse)
async def decrypt(req: DecryptRequest):
    """
    Decrypt ciphertext using a specified AES mode.

    Returns the plaintext along with detailed block-by-block processing info.
    """
    mode = req.mode.lower()
    if mode not in MODE_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown mode '{mode}'. Supported modes: {', '.join(MODE_MAP.keys())}"
        )

    try:
        ciphertext_bytes = hex_to_bytes(req.ciphertext)
        key_bytes = parse_key(req.key, req.key_format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(ciphertext_bytes) == 0:
        raise HTTPException(status_code=400, detail="Ciphertext cannot be empty")

    if len(ciphertext_bytes) % 16 != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Ciphertext length must be a multiple of 16 bytes. Got {len(ciphertext_bytes)} bytes."
        )

    mode_impl = MODE_MAP[mode]

    if mode == "ctr":
        result = mode_impl.decrypt(
            ciphertext_bytes, key_bytes,
            initial_counter=req.initial_counter or 0,
            pad_size=req.pad_size
        )
    else:
        result = mode_impl.decrypt(ciphertext_bytes, key_bytes, pad_size=req.pad_size)

    return DecryptResponse(
        success=True,
        plaintext_text=bytes_to_text(result["plaintext"]),
        plaintext_hex=bytes_to_hex(result["plaintext"]),
        pad_size=result["pad_size"],
        block_details=result["block_details"],
        mode_info=result["mode_info"],
    )
