import React from 'react';

const MODES = [
  {
    id: 'ecb',
    label: 'ECB',
    name: 'Electronic Codebook',
    description:
      'Each block is encrypted independently with the same key. Identical plaintext blocks produce identical ciphertext blocks, making patterns visible.',
  },
  {
    id: 'cbc',
    label: 'CBC',
    name: 'Cipher Block Chaining',
    description:
      'Each plaintext block is XORed with the previous ciphertext block before encryption. The first block uses an IV (zero IV in this demo). Identical blocks produce different ciphertext.',
  },
  {
    id: 'cfb',
    label: 'CFB-128',
    name: 'Cipher Feedback (s = 128)',
    description:
      'Full-block CFB. Encrypts the previous ciphertext (or IV) to produce a 128-bit keystream, then XORs with the plaintext block. Only uses AES encryption, never decryption.',
  },
  {
    id: 'cfb8',
    label: 'CFB-8',
    name: 'Cipher Feedback (s = 8)',
    description:
      'Byte-oriented CFB. A 128-bit shift register is AES-encrypted; the leftmost 8 bits of the output are XORed with one plaintext byte to produce one ciphertext byte, which is then shifted into the register. No padding required — ciphertext is the same length as plaintext.',
  },
  {
    id: 'ofb',
    label: 'OFB',
    name: 'Output Feedback',
    description:
      'Similar to CFB, but feedback comes from the AES output (not ciphertext). The keystream is independent of the data. Encryption and decryption are identical operations.',
  },
  {
    id: 'ctr',
    label: 'CTR',
    name: 'Counter',
    description:
      'Encrypts incrementing counter values to produce a keystream. Allows random access to any block and can be parallelized. User can set the initial counter value.',
  },
];

function ModeSelector({ selectedMode, onModeChange }) {
  const current = MODES.find((m) => m.id === selectedMode);

  return (
    <div>
      <div className="mode-selector">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-btn ${selectedMode === m.id ? 'active' : ''}`}
            onClick={() => onModeChange(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {current && (
        <div className="mode-description">
          <strong>{current.name}</strong>
          <br />
          {current.description}
        </div>
      )}
    </div>
  );
}

export default ModeSelector;
