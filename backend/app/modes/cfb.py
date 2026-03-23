"""
AES-CFB (Cipher Feedback) Mode Implementation.

CFB turns AES into a stream cipher. It encrypts the previous ciphertext block
(or IV for the first block) and XORs the result with the plaintext.
Only AES encryption is used (even for decryption).
"""

from ..utils.aes_core import aes_encrypt_block, xor_bytes
from ..utils.padding import zero_pad, zero_unpad, BLOCK_SIZE

ZERO_IV = b"\x00" * BLOCK_SIZE


class CFBMode:
    """AES Cipher Feedback mode."""

    @staticmethod
    def encrypt(plaintext: bytes, key: bytes) -> dict:
        """
        Encrypt plaintext using AES-CFB mode.

        Process: ciphertext[i] = plaintext[i] XOR AES_Encrypt(prev_ciphertext, key)
        The first block uses AES_Encrypt(IV, key).

        Returns:
            Dict with ciphertext, block details, and padding info.
        """
        padded, pad_size = zero_pad(plaintext)
        blocks = [padded[i:i + BLOCK_SIZE] for i in range(0, len(padded), BLOCK_SIZE)]

        ciphertext = b""
        block_details = []
        feedback = ZERO_IV

        for i, block in enumerate(blocks):
            keystream = aes_encrypt_block(feedback, key)
            encrypted = xor_bytes(block, keystream)
            ciphertext += encrypted

            block_details.append({
                "block_number": i,
                "input": block.hex(),
                "feedback_input": feedback.hex(),
                "keystream": keystream.hex(),
                "operation": "plaintext XOR AES_Encrypt(feedback, key)",
                "xor_with": keystream.hex(),
                "output": encrypted.hex(),
                "description": (
                    f"Block {i}: Encrypt {'IV (all zeros)' if i == 0 else f'ciphertext block {i - 1}'} "
                    f"with AES, then XOR with plaintext"
                )
            })

            feedback = encrypted

        return {
            "ciphertext": ciphertext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "CFB (Cipher Feedback)",
                "iv_used": ZERO_IV.hex(),
                "description": "Encrypts the previous ciphertext (or IV) to produce a keystream, "
                               "then XORs it with plaintext. Acts as a stream cipher. "
                               "Only uses AES encryption, never AES decryption."
            }
        }

    @staticmethod
    def decrypt(ciphertext: bytes, key: bytes, pad_size: int = 0) -> dict:
        """
        Decrypt ciphertext using AES-CFB mode.

        Process: plaintext[i] = ciphertext[i] XOR AES_Encrypt(prev_ciphertext, key)
        Note: Uses AES_Encrypt (not decrypt) — same as encryption.

        Returns:
            Dict with plaintext, block details, and padding info.
        """
        blocks = [ciphertext[i:i + BLOCK_SIZE] for i in range(0, len(ciphertext), BLOCK_SIZE)]

        plaintext = b""
        block_details = []
        feedback = ZERO_IV

        for i, block in enumerate(blocks):
            keystream = aes_encrypt_block(feedback, key)
            decrypted = xor_bytes(block, keystream)
            plaintext += decrypted

            block_details.append({
                "block_number": i,
                "input": block.hex(),
                "feedback_input": feedback.hex(),
                "keystream": keystream.hex(),
                "operation": "ciphertext XOR AES_Encrypt(feedback, key)",
                "xor_with": keystream.hex(),
                "output": decrypted.hex(),
                "description": (
                    f"Block {i}: Encrypt {'IV (all zeros)' if i == 0 else f'ciphertext block {i - 1}'} "
                    f"with AES, then XOR with ciphertext to recover plaintext"
                )
            })

            feedback = block

        plaintext = zero_unpad(plaintext, pad_size)

        return {
            "plaintext": plaintext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "CFB (Cipher Feedback)",
                "iv_used": ZERO_IV.hex(),
                "description": "Decryption uses AES encryption (not decryption!) on the feedback value, "
                               "then XORs with ciphertext. The feedback is the previous ciphertext block."
            }
        }
