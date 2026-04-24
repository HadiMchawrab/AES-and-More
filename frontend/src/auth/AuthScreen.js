import React, { useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

function scorePassword(pw) {
  if (!pw) return { score: 0, label: '', checks: [] };

  const checks = [
    { label: 'At least 8 characters', ok: pw.length >= 8 },
    { label: 'Lowercase letter', ok: /[a-z]/.test(pw) },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(pw) },
    { label: 'Number', ok: /\d/.test(pw) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(pw) },
  ];

  let score = checks.filter((c) => c.ok).length;
  if (pw.length >= 12 && score >= 4) score = Math.min(score + 1, 5);

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  return { score, label: labels[score], checks };
}

const strengthColors = [
  'var(--danger, #ef4444)',
  'var(--danger, #ef4444)',
  'var(--warning)',
  'var(--warning)',
  'var(--success)',
  'var(--success)',
];

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const strength = useMemo(
    () => (tab === 'register' ? scorePassword(password) : null),
    [password, tab],
  );

  const MIN_STRENGTH = 3;
  const tooWeak = tab === 'register' && strength && strength.score < MIN_STRENGTH;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (tooWeak) {
      setError(
        'Password is too weak. Meet at least 3 of: length ≥ 8, lowercase, uppercase, number, symbol.',
      );
      return;
    }
    setBusy(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchTab = (next) => {
    setTab(next);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AES Encryption Modes</h1>
        <p>Sign in to continue</p>
      </header>

      <div className="auth-card card">
        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Log in
          </button>
          <button
            className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              minLength={tab === 'register' ? 8 : 1}
              required
            />
            {tab === 'register' && (
              <>
                <small className="auth-hint">Minimum 8 characters.</small>
                {password && (
                  <div className="pw-strength">
                    <div className="pw-strength-bar">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="pw-strength-seg"
                          style={{
                            background:
                              i < strength.score
                                ? strengthColors[strength.score]
                                : 'var(--border, #334155)',
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="pw-strength-label"
                      style={{ color: strengthColors[strength.score] }}
                    >
                      {strength.label}
                    </div>
                    <ul className="pw-strength-checks">
                      {strength.checks.map((c) => (
                        <li
                          key={c.label}
                          style={{
                            color: c.ok ? 'var(--success)' : 'var(--text-muted)',
                          }}
                        >
                          {c.ok ? '✓' : '○'} {c.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="btn btn-encrypt"
            disabled={busy || tooWeak}
          >
            {busy ? '...' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
