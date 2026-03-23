"""
AES-CTR (Counter) Mode Implementation.

CTR mode encrypts a counter value for each block to produce a keystream.
The counter starts at a user-defined value and increments by 1 for each block.
Like OFB, encryption and decryption are the same operation (XOR with keystream).

CTR allows random access to any block and is parallelizable.
"""

from ..utils.aes_core import aes_encrypt_block, xor_bytes
from ..utils.padding import zero_pad, zero_unpad, BLOCK_SIZE


class CTRMode:
    """AES Counter mode."""

    @staticmethod
    def _counter_to_bytes(counter: int) -> bytes:
        """Convert an integer counter to a 16-byte big-endian block."""
        return counter.to_bytes(BLOCK_SIZE, byteorder="big")

    @staticmethod
    def encrypt(plaintext: bytes, key: bytes, initial_counter: int = 0) -> dict:
        """
        Encrypt plaintext using AES-CTR mode.

        Process:
            keystream[i] = AES_Encrypt(counter + i, key)
            ciphertext[i] = plaintext[i] XOR keystream[i]

        Args:
            plaintext: Data to encrypt.
            key: AES key.
            initial_counter: Starting counter value (default 0).

        Returns:
            Dict with ciphertext, block details, counter info, and padding info.
        """
        padded, pad_size = zero_pad(plaintext)
        blocks = [padded[i:i + BLOCK_SIZE] for i in range(0, len(padded), BLOCK_SIZE)]

        ciphertext = b""
        block_details = []

        for i, block in enumerate(blocks):
            counter_value = initial_counter + i
            counter_bytes = CTRMode._counter_to_bytes(counter_value)
            keystream = aes_encrypt_block(counter_bytes, key)
            encrypted = xor_bytes(block, keystream)
            ciphertext += encrypted

            block_details.append({
                "block_number": i,
                "input": block.hex(),
                "counter_value": counter_value,
                "counter_bytes": counter_bytes.hex(),
                "keystream": keystream.hex(),
                "operation": "plaintext XOR AES_Encrypt(counter, key)",
                "xor_with": keystream.hex(),
                "output": encrypted.hex(),
                "description": (
                    f"Block {i}: Counter = {counter_value} → encrypt counter with AES "
                    f"to get keystream, then XOR with plaintext"
                )
            })

        return {
            "ciphertext": ciphertext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "CTR (Counter)",
                "initial_counter": initial_counter,
                "final_counter": initial_counter + len(blocks) - 1 if blocks else initial_counter,
                "description": (
                    f"Each block uses a unique counter value (starting at {initial_counter}). "
                    f"The counter is encrypted with AES to produce a keystream, "
                    f"then XORed with plaintext. Blocks can be processed in parallel."
                )
            }
        }

    @staticmethod
    def decrypt(ciphertext: bytes, key: bytes, initial_counter: int = 0,
                pad_size: int = 0) -> dict:
        """
        Decrypt ciphertext using AES-CTR mode.

        CTR decryption is identical to encryption — XOR ciphertext with
        the same keystream generated from the counter.

        Returns:
            Dict with plaintext, block details, counter info, and padding info.
        """
        blocks = [ciphertext[i:i + BLOCK_SIZE] for i in range(0, len(ciphertext), BLOCK_SIZE)]

        plaintext = b""
        block_details = []

        for i, block in enumerate(blocks):
            counter_value = initial_counter + i
            counter_bytes = CTRMode._counter_to_bytes(counter_value)
            keystream = aes_encrypt_block(counter_bytes, key)
            decrypted = xor_bytes(block, keystream)
            plaintext += decrypted

            block_details.append({
                "block_number": i,
                "input": block.hex(),
                "counter_value": counter_value,
                "counter_bytes": counter_bytes.hex(),
                "keystream": keystream.hex(),
                "operation": "ciphertext XOR AES_Encrypt(counter, key)",
                "xor_with": keystream.hex(),
                "output": decrypted.hex(),
                "description": (
                    f"Block {i}: Same as encryption. Counter = {counter_value}, "
                    f"XOR ciphertext with keystream to recover plaintext."
                )
            })

        plaintext = zero_unpad(plaintext, pad_size)

        return {
            "plaintext": plaintext,
            "pad_size": pad_size,
            "block_details": block_details,
            "mode_info": {
                "name": "CTR (Counter)",
                "initial_counter": initial_counter,
                "final_counter": initial_counter + len(blocks) - 1 if blocks else initial_counter,
                "description": "Decryption is identical to encryption. Same counter sequence "
                               "produces the same keystream."
            }
        }
