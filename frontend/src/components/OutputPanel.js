import React, { useState } from 'react';
import BlockVisualization from './BlockVisualization';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function OutputPanel({ result, error, loading }) {
  const [showBlocks, setShowBlocks] = useState(true);

  if (loading) {
    return (
      <div className="card">
        <div className="card-title">Output</div>
        <div className="loading">Processing</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-title">Output</div>
        <div className="error-msg">{error}</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card">
        <div className="card-title">Output</div>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          Enter data and click Encrypt or Decrypt to see results
        </p>
      </div>
    );
  }

  const isEncrypt = result.type === 'encrypt';

  return (
    <div className="card">
      <div className="card-title">Output</div>

      {/* Main result */}
      {isEncrypt ? (
        <div className="result-box">
          <div className="label">
            Ciphertext (Hex)
            <CopyButton text={result.ciphertext_hex} />
          </div>
          <div className="value">{result.ciphertext_hex}</div>
        </div>
      ) : (
        <>
          <div className="result-box">
            <div className="label">
              Plaintext (Text)
              <CopyButton text={result.plaintext_text} />
            </div>
            <div className="value">{result.plaintext_text}</div>
          </div>
          <div className="result-box">
            <div className="label">
              Plaintext (Hex)
              <CopyButton text={result.plaintext_hex} />
            </div>
            <div className="value">{result.plaintext_hex}</div>
          </div>
        </>
      )}

      {/* Padding info */}
      <div className="padding-info">
        <div>
          Padding: <span>{result.pad_size} byte{result.pad_size !== 1 ? 's' : ''}</span>
        </div>
        {result.mode_info?.iv_used && (
          <div>
            IV: <span>{result.mode_info.iv_used}</span>
          </div>
        )}
        {result.mode_info?.initial_counter !== undefined && (
          <div>
            Counter: <span>{result.mode_info.initial_counter}</span>
            {result.mode_info?.final_counter !== undefined && (
              <> &rarr; <span>{result.mode_info.final_counter}</span></>
            )}
          </div>
        )}
      </div>

      {/* Mode info */}
      {result.mode_info && (
        <div className="result-box">
          <div className="label">Mode: {result.mode_info.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {result.mode_info.description}
          </div>
        </div>
      )}

      {/* Block details toggle */}
      {result.block_details && result.block_details.length > 0 && (
        <div className="blocks-container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.9rem' }}>
              Block-by-Block Processing ({result.block_details.length} block
              {result.block_details.length !== 1 ? 's' : ''})
            </span>
            <button
              className="btn-copy"
              onClick={() => setShowBlocks(!showBlocks)}
            >
              {showBlocks ? 'Hide' : 'Show'}
            </button>
          </div>
          {showBlocks && <BlockVisualization blocks={result.block_details} />}
        </div>
      )}
    </div>
  );
}

export default OutputPanel;
