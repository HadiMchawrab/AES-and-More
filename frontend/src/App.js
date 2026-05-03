import React, { useState, useCallback, useEffect } from 'react';
import ModeSelector from './components/ModeSelector';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ModeComparison from './components/ModeComparison';
import FlowDiagram from './components/FlowDiagram';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AuthScreen from './auth/AuthScreen';
import { encryptLocal, decryptLocal } from './crypto';

const THEME_STORAGE_KEY = 'aes-modes-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggle];
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="btn-theme"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀' : '☾'}
    </button>
  );
}

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
      <ModeSelector selectedMode={mode} onModeChange={(m) => { setMode(m); setResult(null); setError(null); }} />
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

function AesApp({ theme, onToggleTheme }) {
  const { user, logout, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState('tool');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch {
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="hieroglyph-title-band">
          <div className="hieroglyph-fill hieroglyph-fill--left" aria-hidden="true">
            {'𓂀𓇳𓋹𓆣𓏏𓂝𓁶𓀠𓂸𓃒𓆑𓅓𓄿𓇋𓈖𓉐𓊃𓋴𓌀𓍯𓎛𓏲'.repeat(12)}
          </div>
          <h1>AES Encryption Modes</h1>
          <div className="hieroglyph-fill hieroglyph-fill--right" aria-hidden="true">
            {'𓂀𓇳𓋹𓆣𓏏𓂝𓁶𓀠𓂸𓃒𓆑𓅓𓄿𓇋𓈖𓉐𓊃𓋴𓌀𓍯𓎛𓏲'.repeat(12)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p>An educational tool for understanding how AES block cipher modes work</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            {confirmingDelete ? (
              <>
                <span style={{ color: 'var(--error, #e55)', fontSize: '0.85rem' }}>Delete account?</span>
                <button className="btn-logout" onClick={handleDeleteAccount}>Confirm</button>
                <button className="btn-logout" onClick={() => setConfirmingDelete(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn-logout" onClick={() => setConfirmingDelete(true)}>Delete account</button>
            )}
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

function Gate({ theme, onToggleTheme }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app">
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }
  if (user) {
    return <AesApp theme={theme} onToggleTheme={onToggleTheme} />;
  }
  return (
    <>
      <div className="theme-toggle-floating">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <AuthScreen />
    </>
  );
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  return (
    <AuthProvider>
      <Gate theme={theme} onToggleTheme={toggleTheme} />
    </AuthProvider>
  );
}
