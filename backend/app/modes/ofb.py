"""
AES-OFB (Output Feedback) Mode Implementation.

OFB generates a keystream by repeatedly encrypting the previous output block.
The keystream is independent of both plaintext and ciphertext, making
encryption and decryption identical operations.
"""

from ..utils.aes_core import aes_encrypt_block, xor_bytes
from ..utils.padding import zero_pad, zero_unpad, BLOCK_SIZE

ZERO_IV = b"\x00" * BLOCK_SIZE


class OFBMode:
    """AES Output Feedback mode."""

    @staticmethod
    def encrypt(plaintext: bytes, key: bytes) -> dict:
        """
        Encrypt plaintext using AES-OFB mode.

        Process:
            output[0] = AES_Encrypt(IV, key)
            output[i] = AES_Encrypt(output[i-1], key)
            ciphertext[i] = plaintext[i] XOR output[i]

        The keystream depends only on IV and key, not on plaintext/ciphertext.

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
                    f"Block {i}: Encrypt {'IV (all zeros)' if i == 0 else 'previous AES output'} "
                    f"with AES to get keystream, then XOR with plaintext. "
                    f"Note: feedback is the AES output, NOT the ciphertext (unlike CFB)."
                )
            })

            # Key difference from CFB: feedback is the AES output, not the ciphertext
            feedback = keystream

        return {
            "ciphertext": ciphertext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "OFB (Output Feedback)",
                "iv_used": ZERO_IV.hex(),
                "description": "Generates keystream by repeatedly AES-encrypting the previous "
                               "output. Unlike CFB, the feedback is the AES output (not ciphertext), "
                               "so the keystream is independent of the data."
            }
        }

    @staticmethod
    def decrypt(ciphertext: bytes, key: bytes, pad_size: int = 0) -> dict:
        """
        Decrypt ciphertext using AES-OFB mode.

        OFB decryption is identical to encryption — XOR ciphertext with
        the same keystream.

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
                    f"Block {i}: Same keystream as encryption. "
                    f"XOR ciphertext with keystream to recover plaintext."
                )
            })

            feedback = keystream

        plaintext = zero_unpad(plaintext, pad_size)

        return {
            "plaintext": plaintext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "OFB (Output Feedback)",
                "iv_used": ZERO_IV.hex(),
                "description": "Decryption is identical to encryption. The same keystream "
                               "is generated and XORed with the ciphertext."
            }
        }
