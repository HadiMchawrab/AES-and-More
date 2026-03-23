"""
Conversion utilities for handling text/hex input and output.
"""


def text_to_bytes(text: str) -> bytes:
    """Convert a UTF-8 string to bytes."""
    return text.encode("utf-8")


def hex_to_bytes(hex_str: str) -> bytes:
    """Convert a hex string (with or without spaces/0x prefix) to bytes."""
    cleaned = hex_str.replace(" ", "").replace("0x", "").replace("0X", "")
    return bytes.fromhex(cleaned)


def bytes_to_hex(data: bytes) -> str:
    """Convert bytes to a hex string."""
    return data.hex()


def bytes_to_text(data: bytes) -> str:
    """Convert bytes to a UTF-8 string, replacing invalid sequences."""
    return data.decode("utf-8", errors="replace")


def parse_input(data: str, input_format: str) -> bytes:
    """
    Parse user input based on specified format.

    Args:
        data: The input string.
        input_format: Either "text" or "hex".

    Returns:
        Parsed bytes.

    Raises:
        ValueError: If hex input is invalid.
    """
    if input_format == "hex":
        try:
            return hex_to_bytes(data)
        except ValueError as e:
            raise ValueError(f"Invalid hex input: {e}")
    return text_to_bytes(data)


def parse_key(key: str, key_format: str) -> bytes:
    """
    Parse and validate an AES key.

    Args:
        key: The key string.
        key_format: Either "text" or "hex".

    Returns:
        Key as bytes (must be 16, 24, or 32 bytes).

    Raises:
        ValueError: If key length is invalid.
    """
    key_bytes = parse_input(key, key_format)
    valid_lengths = {16, 24, 32}
    if len(key_bytes) not in valid_lengths:
        raise ValueError(
            f"Key must be 16, 24, or 32 bytes. Got {len(key_bytes)} bytes. "
            f"For text keys, use exactly 16, 24, or 32 characters. "
            f"For hex keys, use 32, 48, or 64 hex characters."
        )
    return key_bytes
