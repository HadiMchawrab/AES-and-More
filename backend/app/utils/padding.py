"""
Zero-padding utilities for AES block cipher.

Pads plaintext to a multiple of the AES block size (16 bytes) using zero bytes,
and tracks the number of padding bytes added so they can be removed on decryption.
"""

BLOCK_SIZE = 16  # AES block size in bytes


def zero_pad(data: bytes) -> tuple[bytes, int]:
    """
    Pad data with zero bytes to make its length a multiple of BLOCK_SIZE.

    Returns:
        (padded_data, pad_size) where pad_size is the number of zero bytes added.
        If data is already aligned, pad_size is 0 and no bytes are added.
    """
    remainder = len(data) % BLOCK_SIZE
    if remainder == 0:
        return data, 0
    pad_size = BLOCK_SIZE - remainder
    return data + b"\x00" * pad_size, pad_size


def zero_unpad(data: bytes, pad_size: int) -> bytes:
    """
    Remove zero-padding from decrypted data.

    Args:
        data: The padded data.
        pad_size: Number of padding bytes that were added during encryption.

    Returns:
        Original unpadded data.
    """
    if pad_size == 0:
        return data
    return data[:-pad_size]
