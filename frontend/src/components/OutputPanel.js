import React, { useState } from 'react';
import BlockVisualization from './BlockVisualization';
import { hexToBytes, bytesToText } from '../crypto/encode';

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

// Detects and strips zero-padding (last byte = N, preceding N-1 bytes = 0x00).
// Returns stripped hex string, or the original if no valid padding pattern found.
function autoStripPaddingHex(hexStr) {
  if (!hexStr || hexStr.length < 4) return hexStr;
  const lastByte = parseInt(hexStr.slice(-2), 16);
  if (lastByte < 1 || lastByte > 15 || hexStr.length < lastByte * 2) return hexStr;
  for (let i = 1; i < lastByte; i++) {
    const pos = hexStr.length - (i + 1) * 2;
    if (hexStr.slice(pos, pos + 2) !== '00') return hexStr;
  }
  return hexStr.slice(0, hexStr.length - lastByte * 2);
}

function DownloadButton({ text, filename, bom = false }) {
  const handleDownload = () => {
    const content = bom ? '﻿' + text : text;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="btn-copy" onClick={handleDownload}>
      ↓ Download
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

  // For decrypt: if the user didn't supply a padSize (pad_size === 0 in result),
  // auto-detect trailing zero-padding (pattern: last byte = N, preceding N-1 bytes = 0x00)
  // and strip it so padding bytes don't appear as garbage in display/download.
  const cleanHex = !isEncrypt && result.pad_size === 0
    ? autoStripPaddingHex(result.plaintext_hex)
    : result.plaintext_hex;
  const paddingWasAutoStripped = cleanHex !== result.plaintext_hex;
  const cleanText = paddingWasAutoStripped
    ? (() => { try { return bytesToText(hexToBytes(cleanHex)); } catch { return null; } })()
    : result.plaintext_text;

  return (
    <div className="card">
      <div className="card-title">Output</div>

      {/* Main result */}
      {isEncrypt ? (
        <div className="result-box">
          <div className="label">
            Ciphertext (Hex)
            <CopyButton text={result.ciphertext_hex} />
            <DownloadButton text={result.ciphertext_hex} filename="ciphertext.hex" />
          </div>
          <div className="value">{result.ciphertext_hex}</div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontStyle: 'italic',
              marginTop: '8px',
              lineHeight: '1.4',
            }}
          >
            AES produces raw binary bytes that aren't valid text. Hex (0-9, a-f)
            is used so the output is printable and safe to copy.
          </div>
        </div>
      ) : (
        <>
          <div className="result-box">
            <div className="label">
              Plaintext (Text)
              {cleanText !== null && (
                <>
                  <CopyButton text={cleanText} />
                  <DownloadButton text={cleanText} filename="plaintext.txt" bom={true} />
                </>
              )}
            </div>
            {cleanText !== null ? (
              <div className="value">{cleanText}</div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Decrypted bytes are not valid UTF-8 text. This usually means the
                ciphertext, key, or mode is incorrect. See the hex output below.
              </div>
            )}
          </div>
          <div className="result-box">
            <div className="label">
              Plaintext (Hex)
              <CopyButton text={cleanHex} />
              <DownloadButton text={cleanHex} filename="plaintext.hex" />
            </div>
            <div className="value">{cleanHex}</div>
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
