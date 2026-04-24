import React, { useState, useCallback } from 'react';
import ModeSelector from './components/ModeSelector';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ModeComparison from './components/ModeComparison';
import FlowDiagram from './components/FlowDiagram';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AuthScreen from './auth/AuthScreen';
import { encryptLocal, decryptLocal } from './crypto';

function runLocal({ mode, operation, params }) {
  if (operation === 'encrypt') {
    return encryptLocal({
      mode,
      plaintext: params.data,
      key: params.key,
      inputFormat: params.inputFormat,
      keyFormat: params.keyFormat,
      initialCounter: params.initialCounter,
    });
  }
  return decryptLocal({
    mode,
    ciphertext: params.data,
    key: params.key,
    keyFormat: params.keyFormat,
    padSize: params.padSize || 0,
    initialCounter: params.initialCounter,
  });
}

function EncryptDecryptPanel() {
  const [mode, setMode] = useState('ecb');
  const [operation, setOperation] = useState('encrypt');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback((params) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = runLocal({ mode, operation, params });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, operation]);

  return (
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
        <OutputPanel result={result} error={error} loading={loading} />
      </div>
      <FlowDiagram mode={mode} result={result} />
    </>
  );
}

function AesApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tool');

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'left' }}>
            <h1>AES Encryption Modes</h1>
            <p>An educational tool for understanding how AES block cipher modes work</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
            <button className="btn-logout" onClick={logout}>Log out</button>
          </div>
        </div>
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

      {activeTab === 'compare' ? <ModeComparison /> : <EncryptDecryptPanel />}

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

function Gate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app">
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }
  return user ? <AesApp /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
