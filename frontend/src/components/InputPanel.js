import React, { useState } from 'react';
import { bytesToHex } from '../crypto/encode';

function generateRandomKeyHex(sizeBytes) {
  const bytes = new Uint8Array(sizeBytes);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function InputPanel({ mode, operation, onOperationChange, onSubmit, loading }) {
  const [data, setData] = useState('');
  const [key, setKey] = useState('');
  const [inputFormat, setInputFormat] = useState('text');
  const [keyFormat, setKeyFormat] = useState('text');
  const [keyMode, setKeyMode] = useState('manual');
  const [randomKey, setRandomKey] = useState('');
  const [randomKeySize, setRandomKeySize] = useState(16);
  const [initialCounter, setInitialCounter] = useState(0);
  const [padSize, setPadSize] = useState(0);

  const switchToRandom = (size) => {
    const newKey = generateRandomKeyHex(size);
    setRandomKey(newKey);
  };

  const handleKeyModeChange = (newMode) => {
    setKeyMode(newMode);
    if (newMode === 'random') {
      switchToRandom(randomKeySize);
    }
  };

  const handleRandomKeySizeChange = (size) => {
    setRandomKeySize(size);
    setRandomKey(generateRandomKeyHex(size));
  };

  const handleSubmit = () => {
    const activeKey = keyMode === 'random' ? randomKey : key.trim();
    const activeKeyFormat = keyMode === 'random' ? 'hex' : keyFormat;
    if (!data.trim() || !activeKey) return;
    onSubmit({
      data: data.trim(),
      key: activeKey,
      inputFormat,
      keyFormat: activeKeyFormat,
      initialCounter,
      padSize,
    });
  };

  const isDecrypt = operation === 'decrypt';
  const canSubmit = data.trim() && (keyMode === 'random' ? randomKey : key.trim());

  return (
    <div className="card">
      <div className="card-title">Input</div>

      <div className="op-toggle">
        <button
          className={operation === 'encrypt' ? 'active' : ''}
          onClick={() => onOperationChange('encrypt')}
        >
          Encrypt
        </button>
        <button
          className={operation === 'decrypt' ? 'active' : ''}
          onClick={() => onOperationChange('decrypt')}
        >
          Decrypt
        </button>
      </div>

      <div className="form-group">
        <label>{isDecrypt ? 'Ciphertext (hex)' : 'Plaintext'}</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
          {!isDecrypt && (
            <div className="format-toggle">
              <button
                className={inputFormat === 'text' ? 'active' : ''}
                onClick={() => setInputFormat('text')}
              >
                Text
              </button>
              <button
                className={inputFormat === 'hex' ? 'active' : ''}
                onClick={() => setInputFormat('hex')}
              >
                Hex
              </button>
            </div>
          )}
          {isDecrypt && (
            <>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                0-9, a-f (multiple of 32 hex chars)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {data.length} / hex chars
              </span>
            </>
          )}
        </div>
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder={
            isDecrypt
              ? 'Enter ciphertext in hex (e.g., a1b2c3d4...)'
              : inputFormat === 'hex'
              ? 'Enter hex (e.g., 48656c6c6f)'
              : 'Enter plaintext (e.g., Hello World!)'
          }
        />
      </div>

      <div className="form-group">
        <label>Key</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
          <div className="format-toggle">
            <button
              className={keyMode === 'manual' ? 'active' : ''}
              onClick={() => handleKeyModeChange('manual')}
            >
              Manual
            </button>
            <button
              className={keyMode === 'random' ? 'active' : ''}
              onClick={() => handleKeyModeChange('random')}
            >
              Random
            </button>
          </div>

          {keyMode === 'manual' && (
            <>
              <div className="format-toggle">
                <button
                  className={keyFormat === 'text' ? 'active' : ''}
                  onClick={() => setKeyFormat('text')}
                >
                  Text
                </button>
                <button
                  className={keyFormat === 'hex' ? 'active' : ''}
                  onClick={() => setKeyFormat('hex')}
                >
                  Hex
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {keyFormat === 'text' ? '16, 24, or 32 chars' : '32, 48, or 64 hex chars'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {key.length} / {keyFormat === 'text' ? 'chars' : 'hex chars'}
              </span>
            </>
          )}

          {keyMode === 'random' && (
            <>
              <div className="format-toggle">
                <button
                  className={randomKeySize === 16 ? 'active' : ''}
                  onClick={() => handleRandomKeySizeChange(16)}
                >
                  128-bit
                </button>
                <button
                  className={randomKeySize === 24 ? 'active' : ''}
                  onClick={() => handleRandomKeySizeChange(24)}
                >
                  192-bit
                </button>
                <button
                  className={randomKeySize === 32 ? 'active' : ''}
                  onClick={() => handleRandomKeySizeChange(32)}
                >
                  256-bit
                </button>
              </div>
              <button
                className="btn-copy"
                style={{ marginLeft: 'auto' }}
                onClick={() => setRandomKey(generateRandomKeyHex(randomKeySize))}
              >
                ↺ New key
              </button>
            </>
          )}
        </div>

        {keyMode === 'manual' ? (
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={
              keyFormat === 'hex'
                ? 'e.g., 0123456789abcdef0123456789abcdef'
                : 'e.g., mysecretkey12345'
            }
          />
        ) : (
          <input
            type="text"
            value={randomKey}
            readOnly
            style={{ color: 'var(--text-muted)', cursor: 'default' }}
          />
        )}
      </div>

      {mode === 'ctr' && (
        <div className="form-group">
          <label>Initial Counter</label>
          <input
            type="number"
            value={initialCounter}
            onChange={(e) => setInitialCounter(parseInt(e.target.value, 10) || 0)}
            min="0"
            placeholder="0"
          />
        </div>
      )}

      {isDecrypt && (
        <div className="form-group">
          <label>Padding Size (bytes removed)</label>
          <input
            type="number"
            value={padSize}
            onChange={(e) => setPadSize(parseInt(e.target.value, 10) || 0)}
            min="0"
            max="15"
            placeholder="0"
          />
        </div>
      )}

      <div className="btn-row">
        <button
          className={`btn ${isDecrypt ? 'btn-decrypt' : 'btn-encrypt'}`}
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
        >
          {loading ? 'Processing...' : isDecrypt ? 'Decrypt' : 'Encrypt'}
        </button>
      </div>
    </div>
  );
}

export default InputPanel;
