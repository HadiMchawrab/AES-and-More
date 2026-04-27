import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { traceEncrypt, traceDecrypt } from '../crypto/aes-trace';
import { hexToBytes, bytesToHex } from '../crypto/encode';

// Render a 4×4 state grid. AES stores state column-major: cell (row r, col c) = state[r + 4*c].
function StateGrid({ state, prevState, label }) {
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const idx = r + 4 * c;
      const v = state[idx];
      const changed = prevState && prevState[idx] !== v;
      cells.push(
        <div key={idx} className={`aes-cell ${changed ? 'changed' : ''}`}>
          {v.toString(16).padStart(2, '0')}
        </div>
      );
    }
  }
  return (
    <div className="aes-grid-wrap">
      {label && <div className="aes-grid-label">{label}</div>}
      <div className="aes-grid">{cells}</div>
    </div>
  );
}

function PhaseExplainer({ phase }) {
  const explainers = {
    AddRoundKey:
      'XOR the state with a round key. Round keys come from the key schedule, derived from the cipher key. This is where the secret key actually mixes into the data.',
    SubBytes:
      'Replace each byte using a fixed nonlinear lookup table (the S-box). This is the only nonlinear step — without it, AES would be linear and trivially breakable.',
    ShiftRows:
      'Cyclically shift the rows of the state: row 0 by 0, row 1 by 1, row 2 by 2, row 3 by 3. Spreads bytes across columns so MixColumns can mix them.',
    MixColumns:
      'Treat each column as a polynomial over GF(2⁸) and multiply by a fixed matrix. Diffuses each input byte across all 4 output bytes of the column.',
    InvSubBytes: 'Inverse S-box lookup — undoes SubBytes.',
    InvShiftRows: 'Cyclic shift in the opposite direction — undoes ShiftRows.',
    InvMixColumns: 'Multiplication by the inverse matrix in GF(2⁸) — undoes MixColumns.',
  };
  return (
    <div className="aes-phase-explainer">
      {explainers[phase] || ''}
    </div>
  );
}

function AesInternalsModal({ open, onClose, blockInput, key_hex, isEncrypt, contextLabel }) {
  const [stepIdx, setStepIdx] = useState(0);

  const trace = useMemo(() => {
    if (!open || !blockInput || !key_hex) return null;
    try {
      const blockBytes = hexToBytes(blockInput);
      const keyBytes = hexToBytes(key_hex);
      if (blockBytes.length !== 16) return null;
      return isEncrypt
        ? traceEncrypt(blockBytes, keyBytes)
        : traceDecrypt(blockBytes, keyBytes);
    } catch {
      return null;
    }
  }, [open, blockInput, key_hex, isEncrypt]);

  // Reset to step 0 when the trace changes
  useEffect(() => {
    setStepIdx(0);
  }, [trace]);

  // Esc to close
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleStepBack = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);
  const handleStepForward = useCallback(() => {
    if (!trace) return;
    setStepIdx((i) => Math.min(trace.steps.length - 1, i + 1));
  }, [trace]);
  const handleReset = useCallback(() => setStepIdx(0), []);
  const handleEnd = useCallback(() => {
    if (!trace) return;
    setStepIdx(trace.steps.length - 1);
  }, [trace]);

  if (!open) return null;

  if (!trace) {
    return (
      <div className="aes-modal-backdrop" onClick={onClose}>
        <div className="aes-modal" onClick={(e) => e.stopPropagation()}>
          <div className="aes-modal-header">
            <h3>AES Internals</h3>
            <button className="aes-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="aes-modal-body">
            <p style={{ color: 'var(--text-muted)' }}>
              Could not generate trace. Make sure the input block and key are valid hex.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const step = trace.steps[stepIdx];
  const totalSteps = trace.steps.length;
  const direction = isEncrypt ? 'Encrypt' : 'Decrypt';

  return (
    <div className="aes-modal-backdrop" onClick={onClose}>
      <div className="aes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aes-modal-header">
          <div>
            <h3>AES-{trace.Nr * 32 + 64} {direction} — Internals</h3>
            {contextLabel && <div className="aes-modal-subtitle">{contextLabel}</div>}
          </div>
          <button className="aes-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="aes-modal-body">
          <div className="aes-step-header">
            <span className="aes-step-phase">
              Round {step.round} — {step.phase}
            </span>
            <span className="aes-step-counter">
              Step {stepIdx + 1} / {totalSteps}
            </span>
          </div>

          <PhaseExplainer phase={step.phase} />

          <div className="aes-grids-row">
            <StateGrid state={step.stateBefore} label="Before" />
            <div className="aes-arrow">→</div>
            <StateGrid state={step.stateAfter} prevState={step.stateBefore} label="After" />
          </div>

          {step.roundKey && (
            <div className="aes-roundkey-row">
              <StateGrid state={step.roundKey} label={`Round Key ${step.round}`} />
              <div className="aes-roundkey-note">
                XORed into the state at this step.
              </div>
            </div>
          )}

          <div className="aes-modal-controls">
            <button onClick={handleReset} className="flow-ctrl-btn" title="Reset" disabled={stepIdx === 0}>
              &#x23EE;
            </button>
            <button onClick={handleStepBack} className="flow-ctrl-btn" title="Step back" disabled={stepIdx === 0}>
              &#x23EA;
            </button>
            <button onClick={handleStepForward} className="flow-ctrl-btn" title="Step forward" disabled={stepIdx >= totalSteps - 1}>
              &#x23E9;
            </button>
            <button onClick={handleEnd} className="flow-ctrl-btn" title="Jump to end" disabled={stepIdx >= totalSteps - 1}>
              &#x23ED;
            </button>
          </div>

          <div className="aes-io-strip">
            <div>
              <span className="aes-io-label">Input block:</span>{' '}
              <code>{bytesToHex(trace.steps[0].stateBefore)}</code>
            </div>
            <div>
              <span className="aes-io-label">Final output:</span>{' '}
              <code>{bytesToHex(trace.finalState)}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AesInternalsModal;
