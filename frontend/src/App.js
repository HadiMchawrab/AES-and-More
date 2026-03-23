import React, { useState, useCallback } from 'react';
import ModeSelector from './components/ModeSelector';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ModeComparison from './components/ModeComparison';
import FlowDiagram from './components/FlowDiagram';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [mode, setMode] = useState('ecb');
  const [operation, setOperation] = useState('encrypt');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tool');

  const handleEncrypt = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plaintext: params.data,
          key: params.key,
          mode: mode,
          input_format: params.inputFormat,
          key_format: params.keyFormat,
          initial_counter: params.initialCounter,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Encryption failed');
      }
      setResult({ type: 'encrypt', ...data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const handleDecrypt = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext: params.data,
          key: params.key,
          mode: mode,
          key_format: params.keyFormat,
          pad_size: params.padSize || 0,
          initial_counter: params.initialCounter,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Decryption failed');
      }
      setResult({ type: 'decrypt', ...data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const handleSubmit = useCallback((params) => {
    if (operation === 'encrypt') {
      handleEncrypt(params);
    } else {
      handleDecrypt(params);
    }
  }, [operation, handleEncrypt, handleDecrypt]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>AES Encryption Modes</h1>
        <p>An educational tool for understanding how AES block cipher modes work</p>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'tool' ? 'active' : ''}`}
          onClick={() => setActiveTab('tool')}
        >
          Encrypt / Decrypt
        </button>
        <button
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          Mode Comparison
        </button>
      </div>

      {activeTab === 'compare' ? (
        <ModeComparison />
      ) : (
        <>
          <ModeSelector selectedMode={mode} onModeChange={setMode} />

          <div className="main-grid">
            <InputPanel
              mode={mode}
              operation={operation}
              onOperationChange={setOperation}
              onSubmit={handleSubmit}
              loading={loading}
            />
            <OutputPanel
              result={result}
              error={error}
              loading={loading}
            />
          </div>

          <FlowDiagram mode={mode} result={result} />
        </>
      )}

      <div className="disclaimer">
        <strong>Security Disclaimer</strong>
        This tool uses a zero IV (all bytes = 0x00) and is for <strong>educational purposes only</strong>.
        In real-world cryptographic systems, always use a cryptographically random IV/nonce
        for each encryption operation. Using a zero IV makes the encryption deterministic and
        vulnerable to various attacks including chosen-plaintext attacks.
      </div>

      <footer className="app-footer">
        AES Modes Educational Tool &mdash; For learning purposes only
      </footer>
    </div>
  );
}

export default App;
