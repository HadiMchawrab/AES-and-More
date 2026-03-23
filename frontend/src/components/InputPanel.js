import React, { useState } from 'react';

function InputPanel({ mode, operation, onOperationChange, onSubmit, loading }) {
  const [data, setData] = useState('');
  const [key, setKey] = useState('');
  const [inputFormat, setInputFormat] = useState('text');
  const [keyFormat, setKeyFormat] = useState('text');
  const [initialCounter, setInitialCounter] = useState(0);
  const [padSize, setPadSize] = useState(0);

  const handleSubmit = () => {
    if (!data.trim() || !key.trim()) return;
    onSubmit({
      data: data.trim(),
      key: key.trim(),
      inputFormat,
      keyFormat,
      initialCounter,
      padSize,
    });
  };

  const isDecrypt = operation === 'decrypt';

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
        </div>
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
          disabled={loading || !data.trim() || !key.trim()}
        >
          {loading ? 'Processing...' : isDecrypt ? 'Decrypt' : 'Encrypt'}
        </button>
      </div>
    </div>
  );
}

export default InputPanel;
