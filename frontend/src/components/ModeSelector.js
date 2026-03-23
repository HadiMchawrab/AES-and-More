import React from 'react';

const MODES = [
  {
    id: 'ecb',
    label: 'ECB',
    name: 'Electronic Codebook',
    description:
      'Each block is encrypted independently with the same key. Identical plaintext blocks produce identical ciphertext blocks, making patterns visible.',
    usesIv: false,
    usesCounter: false,
    parallelizable: true,
    streamCipher: false,
  },
  {
    id: 'cbc',
    label: 'CBC',
    name: 'Cipher Block Chaining',
    description:
      'Each plaintext block is XORed with the previous ciphertext block before encryption. The first block uses an IV (zero IV in this demo). Identical blocks produce different ciphertext.',
    usesIv: true,
    usesCounter: false,
    parallelizable: false,
    streamCipher: false,
  },
  {
    id: 'cfb',
    label: 'CFB',
    name: 'Cipher Feedback',
    description:
      'Turns AES into a stream cipher. Encrypts the previous ciphertext (or IV) to produce a keystream, then XORs with plaintext. Only uses AES encryption, never decryption.',
    usesIv: true,
    usesCounter: false,
    parallelizable: false,
    streamCipher: true,
  },
  {
    id: 'ofb',
    label: 'OFB',
    name: 'Output Feedback',
    description:
      'Similar to CFB, but feedback comes from the AES output (not ciphertext). The keystream is independent of the data. Encryption and decryption are identical operations.',
    usesIv: true,
    usesCounter: false,
    parallelizable: false,
    streamCipher: true,
  },
  {
    id: 'ctr',
    label: 'CTR',
    name: 'Counter',
    description:
      'Encrypts incrementing counter values to produce a keystream. Allows random access to any block and can be parallelized. User can set the initial counter value.',
    usesIv: false,
    usesCounter: true,
    parallelizable: true,
    streamCipher: true,
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
          <div className="mode-badges">
            {current.usesIv && (
              <span className="badge badge-yes">IV: Zero</span>
            )}
            {current.usesCounter && (
              <span className="badge badge-yes">User Counter</span>
            )}
            <span className={`badge ${current.parallelizable ? 'badge-yes' : 'badge-no'}`}>
              {current.parallelizable ? 'Parallelizable' : 'Sequential'}
            </span>
            <span className={`badge ${current.streamCipher ? 'badge-yes' : 'badge-no'}`}>
              {current.streamCipher ? 'Stream Cipher' : 'Block Cipher'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeSelector;
