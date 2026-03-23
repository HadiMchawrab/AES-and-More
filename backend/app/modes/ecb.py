"""
AES-ECB (Electronic Codebook) Mode Implementation.

ECB encrypts each block independently with the same key.
Identical plaintext blocks produce identical ciphertext blocks,
which is why ECB is considered insecure for most purposes.
"""

from ..utils.aes_core import aes_encrypt_block, aes_decrypt_block
from ..utils.padding import zero_pad, zero_unpad, BLOCK_SIZE


class ECBMode:
    """AES Electronic Codebook mode."""

    @staticmethod
    def encrypt(plaintext: bytes, key: bytes) -> dict:
        """
        Encrypt plaintext using AES-ECB mode.

        Each 16-byte block is encrypted independently.

        Returns:
            Dict with ciphertext, block details, and padding info.
        """
        padded, pad_size = zero_pad(plaintext)
        blocks = [padded[i:i + BLOCK_SIZE] for i in range(0, len(padded), BLOCK_SIZE)]

        ciphertext = b""
        block_details = []

        for i, block in enumerate(blocks):
            encrypted = aes_encrypt_block(block, key)
            ciphertext += encrypted

            block_details.append({
                "block_number": i,
                "input": block.hex(),
                "operation": "AES_Encrypt(block, key)",
                "output": encrypted.hex(),
                "description": f"Block {i}: Direct AES encryption (no chaining)"
            })

        return {
            "ciphertext": ciphertext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "ECB (Electronic Codebook)",
                "iv_used": None,
                "description": "Each block is encrypted independently. "
                               "Identical plaintext blocks produce identical ciphertext blocks."
            }
        }

    @staticmethod
    def decrypt(ciphertext: bytes, key: bytes, pad_size: int = 0) -> dict:
        """
        Decrypt ciphertext using AES-ECB mode.

        Returns:
            Dict with plaintext, block details, and padding info.
        """
        blocks = [ciphertext[i:i + BLOCK_SIZE] for i in range(0, len(ciphertext), BLOCK_SIZE)]

        plaintext = b""
        block_details = []

        for i, block in enumerate(blocks):
            decrypted = aes_decrypt_block(block, key)
            plaintext += decrypted

            block_details.append({
                "block_number": i,
                "input": block.hex(),
                "operation": "AES_Decrypt(block, key)",
                "output": decrypted.hex(),
                "description": f"Block {i}: Direct AES decryption (no chaining)"
            })

        plaintext = zero_unpad(plaintext, pad_size)

        return {
            "plaintext": plaintext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "ECB (Electronic Codebook)",
                "iv_used": None,
                "description": "Each block is decrypted independently."
            }
        }
