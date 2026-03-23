"""
Pydantic models for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional


class EncryptRequest(BaseModel):
    """Request body for encryption endpoint."""
    plaintext: str = Field(..., description="Plaintext to encrypt")
    key: str = Field(..., description="Encryption key (text or hex)")
    mode: str = Field(..., description="AES mode: ecb, cbc, cfb, ofb, or ctr")
    input_format: str = Field(default="text", description="Input format: 'text' or 'hex'")
    key_format: str = Field(default="text", description="Key format: 'text' or 'hex'")
    initial_counter: Optional[int] = Field(default=0, description="Initial counter for CTR mode")


class DecryptRequest(BaseModel):
    """Request body for decryption endpoint."""
    ciphertext: str = Field(..., description="Ciphertext in hex format")
    key: str = Field(..., description="Decryption key (text or hex)")
    mode: str = Field(..., description="AES mode: ecb, cbc, cfb, ofb, or ctr")
    key_format: str = Field(default="text", description="Key format: 'text' or 'hex'")
    pad_size: int = Field(default=0, description="Number of padding bytes added during encryption")
    initial_counter: Optional[int] = Field(default=0, description="Initial counter for CTR mode")


class BlockDetail(BaseModel):
    """Details about a single block's processing."""
    block_number: int
    input: str
    output: str
    operation: str
    description: str


class ModeInfo(BaseModel):
    """Information about the AES mode used."""
    name: str
    description: str


class EncryptResponse(BaseModel):
    """Response body for encryption endpoint."""
    success: bool
    ciphertext_hex: str
    pad_size: int
    block_details: list[dict]
    mode_info: dict
    security_disclaimer: str = (
        "WARNING: This implementation uses a zero IV and is for EDUCATIONAL PURPOSES ONLY. "
        "In production systems, always use a cryptographically random IV/nonce for each encryption. "
        "Zero IVs make the encryption deterministic and vulnerable to various attacks."
    )


class DecryptResponse(BaseModel):
    """Response body for decryption endpoint."""
    success: bool
    plaintext_text: str
    plaintext_hex: str
    pad_size: int
    block_details: list[dict]
    mode_info: dict


class ErrorResponse(BaseModel):
    """Error response body."""
    success: bool = False
    error: str
