"""
AES-CBC (Cipher Block Chaining) Mode Implementation.

CBC XORs each plaintext block with the previous ciphertext block before encryption.
This creates dependency between blocks, so identical plaintext blocks produce
different ciphertext (unlike ECB). Uses IV = all zeros for educational purposes.
"""

from ..utils.aes_core import aes_encrypt_block, aes_decrypt_block, xor_bytes
from ..utils.padding import zero_pad, zero_unpad, BLOCK_SIZE

ZERO_IV = b"\x00" * BLOCK_SIZE


class CBCMode:
    """AES Cipher Block Chaining mode."""

    @staticmethod
    def encrypt(plaintext: bytes, key: bytes) -> dict:
        """
        Encrypt plaintext using AES-CBC mode.

        Process: ciphertext[i] = AES_Encrypt(plaintext[i] XOR previous_ciphertext, key)
        The first block XORs with the IV (all zeros).

        Returns:
            Dict with ciphertext, block details, and padding info.
        """
        padded, pad_size = zero_pad(plaintext)
        blocks = [padded[i:i + BLOCK_SIZE] for i in range(0, len(padded), BLOCK_SIZE)]

        ciphertext = b""
        block_details = []
        prev_cipher = ZERO_IV

        for i, block in enumerate(blocks):
            xored = xor_bytes(block, prev_cipher)
            encrypted = aes_encrypt_block(xored, key)
            ciphertext += encrypted

            block_details.append({
                "block_number": i,
                "input": block.hex(),
                "xor_with": prev_cipher.hex(),
                "after_xor": xored.hex(),
                "operation": "AES_Encrypt(plaintext XOR prev_ciphertext, key)",
                "output": encrypted.hex(),
                "description": (
                    f"Block {i}: XOR plaintext with {'IV (all zeros)' if i == 0 else f'ciphertext block {i - 1}'}, "
                    f"then AES encrypt"
                )
            })

            prev_cipher = encrypted

        return {
            "ciphertext": ciphertext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "CBC (Cipher Block Chaining)",
                "iv_used": ZERO_IV.hex(),
                "description": "Each plaintext block is XORed with the previous ciphertext block "
                               "before encryption. The first block uses IV = 0x00...00."
            }
        }

    @staticmethod
    def decrypt(ciphertext: bytes, key: bytes, pad_size: int = 0) -> dict:
        """
        Decrypt ciphertext using AES-CBC mode.

        Process: plaintext[i] = AES_Decrypt(ciphertext[i], key) XOR previous_ciphertext

        Returns:
            Dict with plaintext, block details, and padding info.
        """
        blocks = [ciphertext[i:i + BLOCK_SIZE] for i in range(0, len(ciphertext), BLOCK_SIZE)]

        plaintext = b""
        block_details = []
        prev_cipher = ZERO_IV

        for i, block in enumerate(blocks):
            decrypted_raw = aes_decrypt_block(block, key)
            xored = xor_bytes(decrypted_raw, prev_cipher)
            plaintext += xored

            block_details.append({
                "block_number": i,
                "input": block.hex(),
                "operation": "AES_Decrypt(ciphertext, key) XOR prev_ciphertext",
                "after_aes_decrypt": decrypted_raw.hex(),
                "xor_with": prev_cipher.hex(),
                "output": xored.hex(),
                "description": (
                    f"Block {i}: AES decrypt, then XOR with "
                    f"{'IV (all zeros)' if i == 0 else f'ciphertext block {i - 1}'}"
                )
            })

            prev_cipher = block

        plaintext = zero_unpad(plaintext, pad_size)

        return {
            "plaintext": plaintext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "CBC (Cipher Block Chaining)",
                "iv_used": ZERO_IV.hex(),
                "description": "Each ciphertext block is AES-decrypted, then XORed with the "
                               "previous ciphertext block. The first block uses IV = 0x00...00."
            }
        }
