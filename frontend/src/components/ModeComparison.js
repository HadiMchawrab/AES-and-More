import React from 'react';

const modes = [
  {
    name: 'ECB',
    full: 'Electronic Codebook',
    iv: 'None',
    chaining: 'None',
    parallel: 'Yes',
    type: 'Block',
    encOnly: 'No',
    errorProp: 'Single block',
    security: 'Weakest — patterns preserved',
  },
  {
    name: 'CBC',
    full: 'Cipher Block Chaining',
    iv: 'Zero IV',
    chaining: 'XOR with prev ciphertext',
    parallel: 'Decrypt only',
    type: 'Block',
    encOnly: 'No',
    errorProp: 'Current + next block',
    security: 'Good — hides patterns',
  },
  {
    name: 'CFB',
    full: 'Cipher Feedback',
    iv: 'Zero IV',
    chaining: 'Encrypt prev ciphertext',
    parallel: 'Decrypt only',
    type: 'Stream',
    encOnly: 'Yes',
    errorProp: 'Current + next block',
    security: 'Good — stream cipher behavior',
  },
  {
    name: 'OFB',
    full: 'Output Feedback',
    iv: 'Zero IV',
    chaining: 'Encrypt prev AES output',
    parallel: 'No',
    type: 'Stream',
    encOnly: 'Yes',
    errorProp: 'Single bit',
    security: 'Good — bit errors don\'t propagate',
  },
  {
    name: 'CTR',
    full: 'Counter',
    iv: 'Counter value',
    chaining: 'Counter increment',
    parallel: 'Yes',
    type: 'Stream',
    encOnly: 'Yes',
    errorProp: 'Single bit',
    security: 'Best — parallel + random access',
  },
];

function ModeComparison() {
  return (
    <div className="card">
      <div className="card-title">Mode Comparison</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Mode</th>
              <th>Full Name</th>
              <th>IV/Nonce</th>
              <th>Chaining Method</th>
              <th>Parallel</th>
              <th>Type</th>
              <th>Encrypt Only?</th>
              <th>Error Propagation</th>
              <th>Security Notes</th>
            </tr>
          </thead>
          <tbody>
            {modes.map((m) => (
              <tr key={m.name}>
                <td style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  {m.name}
                </td>
                <td>{m.full}</td>
                <td>{m.iv}</td>
                <td>{m.chaining}</td>
                <td>{m.parallel}</td>
                <td>{m.type}</td>
                <td>{m.encOnly}</td>
                <td>{m.errorProp}</td>
                <td>{m.security}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1rem' }}>
          Key Differences Explained
        </h3>

        <div className="mode-description">
          <strong>ECB vs CBC:</strong> ECB encrypts blocks independently, so identical plaintext blocks
          produce identical ciphertext. CBC chains blocks by XORing each plaintext block with the
          previous ciphertext, eliminating this pattern leakage.
        </div>

        <div className="mode-description">
          <strong>CFB vs OFB:</strong> Both are stream ciphers, but differ in feedback. CFB feeds back
          the <em>ciphertext</em>, while OFB feeds back the <em>AES output</em>. This means OFB's
          keystream is independent of the data, so bit errors in ciphertext don't propagate.
        </div>

        <div className="mode-description">
          <strong>CTR uniqueness:</strong> CTR encrypts a counter value instead of chaining. This allows
          random access to any block and full parallelization of both encryption and decryption. It's the
          most modern and widely recommended mode (often used with authentication as AES-GCM).
        </div>

        <div className="mode-description">
          <strong>"Encrypt Only" modes:</strong> CFB, OFB, and CTR only use the AES encryption function,
          even during decryption. They generate a keystream via AES encryption and XOR it with the data.
          Only ECB and CBC use AES decryption.
        </div>
      </div>
    </div>
  );
}

export default ModeComparison;
