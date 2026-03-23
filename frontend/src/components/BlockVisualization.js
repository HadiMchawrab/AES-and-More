import React from 'react';

function BlockRow({ label, value, highlight }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="block-row">
      <span className="field-name">{label}:</span>
      <span className="field-value" style={highlight ? { color: 'var(--warning)' } : {}}>
        {typeof value === 'number' ? value : value}
      </span>
    </div>
  );
}

function XorVisualization({ a, b, result, labelA, labelB, labelResult }) {
  if (!a || !b || !result) return null;
  return (
    <div style={{ margin: '8px 0', padding: '8px', background: 'var(--bg-input)', borderRadius: '6px' }}>
      <div className="block-row">
        <span className="field-name">{labelA || 'A'}:</span>
        <span className="field-value">{a}</span>
      </div>
      <div className="block-row">
        <span className="field-name" style={{ color: 'var(--warning)' }}>XOR</span>
        <span className="xor-arrow">&oplus;</span>
      </div>
      <div className="block-row">
        <span className="field-name">{labelB || 'B'}:</span>
        <span className="field-value">{b}</span>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
      <div className="block-row">
        <span className="field-name">{labelResult || '='}:</span>
        <span className="field-value" style={{ color: 'var(--accent)' }}>{result}</span>
      </div>
    </div>
  );
}

function BlockVisualization({ blocks }) {
  return (
    <div>
      {blocks.map((block) => (
        <div key={block.block_number} className="block-card">
          <div className="block-header">
            <span className="block-number">Block {block.block_number}</span>
            <span className="block-op">{block.operation}</span>
          </div>

          <BlockRow label="Input" value={block.input} />

          {/* Show counter info for CTR mode */}
          {block.counter_value !== undefined && (
            <BlockRow label="Counter" value={`${block.counter_value} (${block.counter_bytes})`} />
          )}

          {/* Show feedback for CFB/OFB */}
          {block.feedback_input !== undefined && (
            <BlockRow label="Feedback" value={block.feedback_input} />
          )}

          {/* Show XOR visualization where applicable */}
          {block.xor_with && block.after_xor && (
            <XorVisualization
              a={block.input}
              b={block.xor_with}
              result={block.after_xor}
              labelA="Plaintext"
              labelB="Prev Cipher"
              labelResult="XOR Result"
            />
          )}

          {/* Show keystream XOR for stream modes */}
          {block.keystream && !block.after_xor && (
            <XorVisualization
              a={block.input}
              b={block.keystream}
              result={block.output}
              labelA="Data"
              labelB="Keystream"
              labelResult="Output"
            />
          )}

          {/* Show AES decrypt intermediate for CBC decrypt */}
          {block.after_aes_decrypt && (
            <>
              <BlockRow label="AES Dec" value={block.after_aes_decrypt} />
              <XorVisualization
                a={block.after_aes_decrypt}
                b={block.xor_with}
                result={block.output}
                labelA="AES Output"
                labelB="Prev Cipher"
                labelResult="Plaintext"
              />
            </>
          )}

          <BlockRow label="Output" value={block.output} highlight />

          {block.description && (
            <div className="block-description">{block.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default BlockVisualization;
