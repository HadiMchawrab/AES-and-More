"""
Core AES encryption primitive using PyCryptodome.

This module wraps the raw AES-ECB single-block encryption, which is used
as the building block for all AES modes implemented in this project.
"""

from Crypto.Cipher import AES


def aes_encrypt_block(block: bytes, key: bytes) -> bytes:
    """
    Encrypt a single 16-byte block using AES-ECB (raw AES).

    This is the fundamental AES operation. All modes (CBC, CFB, OFB, CTR)
    use this as their core building block.

    Args:
        block: Exactly 16 bytes of plaintext.
        key: AES key (16, 24, or 32 bytes).

    Returns:
        16 bytes of ciphertext.
    """
    cipher = AES.new(key, AES.MODE_ECB)
    return cipher.encrypt(block)


def aes_decrypt_block(block: bytes, key: bytes) -> bytes:
    """
    Decrypt a single 16-byte block using AES-ECB (raw AES).

    Used directly only in ECB and CBC decryption. Other modes
    (CFB, OFB, CTR) use aes_encrypt_block even for decryption.

    Args:
        block: Exactly 16 bytes of ciphertext.
        key: AES key (16, 24, or 32 bytes).

    Returns:
        16 bytes of plaintext.
    """
    cipher = AES.new(key, AES.MODE_ECB)
    return cipher.decrypt(block)


def xor_bytes(a: bytes, b: bytes) -> bytes:
    """XOR two byte sequences of equal length."""
    return bytes(x ^ y for x, y in zip(a, b))
