import React, { useState, useEffect, useCallback, useRef } from 'react';
import ECBDiagram from './diagrams/ECBDiagram';
import CBCDiagram from './diagrams/CBCDiagram';
import CFBDiagram from './diagrams/CFBDiagram';
import CFB8Diagram from './diagrams/CFB8Diagram';
import OFBDiagram from './diagrams/OFBDiagram';
import CTRDiagram from './diagrams/CTRDiagram';
import AesInternalsModal from './AesInternalsModal';

const DIAGRAM_MAP = {
  ecb: ECBDiagram,
  cbc: CBCDiagram,
  cfb: CFBDiagram,
  cfb8: CFB8Diagram,
  ofb: OFBDiagram,
  ctr: CTRDiagram,
};

const DIAGRAM_CAPTIONS = {
  ecb:  { text: 'Each block processed independently' },
  cbc:  { text: 'Blocks chained via XOR' },
  cfb:  { text: 'Feedback from ciphertext' },
  cfb8: { text: 'CFB with s = 8 (per-byte shift register)' },
  ofb:  { text: 'Feedback from AES output (not ciphertext)', note: 'Dashed box = keystream generator (independent of data)' },
  ctr:  { text: 'Independent counter per block', note: 'Dashed box = can be computed in parallel' },
};

// Which legend swatches each mode actually renders.
// ECB/CBC show encrypt OR decrypt AES box depending on direction; CFB/OFB/CTR always show AES encrypt.
const MODE_LEGEND_KEYS = {
  ecb:  { enc: ['plaintext', 'ciphertext', 'aes-enc'],                     dec: ['plaintext', 'ciphertext', 'aes-dec'] },
  cbc:  { enc: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'iv'],        dec: ['plaintext', 'ciphertext', 'aes-dec', 'xor', 'iv'] },
  cfb:  { enc: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'iv'],        dec: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'iv'] },
  cfb8: { enc: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'iv'],        dec: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'iv'] },
  ofb:  { enc: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'iv'],        dec: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'iv'] },
  ctr:  { enc: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'counter'],   dec: ['plaintext', 'ciphertext', 'aes-enc', 'xor', 'counter'] },
};

const LEGEND_ITEMS = {
  'plaintext':  { label: 'Plaintext',    swatch: { background: '#b8d4e3' } },
  'ciphertext': { label: 'Ciphertext',   swatch: { background: '#d4c8b0' } },
  'aes-enc':    { label: 'AES Encrypt',  swatch: { background: '#5c8a5c' } },
  'aes-dec':    { label: 'AES Decrypt',  swatch: { background: '#8a6a5c' } },
  'xor':        { label: 'XOR',          swatch: { background: '#ffab40', borderRadius: '50%' } },
  'iv':         { label: 'IV / Feedback', swatch: { background: '#a0d4a0' } },
  'counter':    { label: 'Counter',      swatch: { background: '#e3d4a0' } },
};

/**
 * Main FlowDiagram component.
 *
 * Renders the appropriate mode diagram with animated block-by-block reveal.
 * Controls: Play/Reset animation, step forward/back.
 *
 * Props:
 *   - mode: 'ecb' | 'cbc' | 'cfb' | 'cfb8' | 'ofb' | 'ctr'
 *   - result: API response with block_details
 */
function FlowDiagram({ mode, result }) {
  const [animatedUpTo, setAnimatedUpTo] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aesModal, setAesModal] = useState(null); // { input, isEncrypt, label } | null
  const canvasRef = useRef(null);
  const scrollPauseUntilRef = useRef(0); // timestamp after which animation may resume

  const blocks = result?.block_details;
  const totalBlocks = blocks?.length || 0;
  const isEncrypt = result?.type === 'encrypt';

  const handleAesClick = useCallback((info) => {
    setAesModal(info);
  }, []);
  const handleAesClose = useCallback(() => setAesModal(null), []);

  // Reset animation and scroll when result changes
  useEffect(() => {
    setAnimatedUpTo(-1);
    setIsPlaying(false);
    if (canvasRef.current) canvasRef.current.scrollLeft = 0;
  }, [result]);

  // Auto-scroll: fires every 3 blocks and pauses block animation while scrolling.
  // Must be declared BEFORE the auto-play effect so it sets scrollPauseUntilRef
  // before the play timer reads it.
  useEffect(() => {
    if (!canvasRef.current || animatedUpTo < 4 || animatedUpTo % 4 !== 0) return;
    const canvas = canvasRef.current;
    const approxColW = canvas.scrollWidth / Math.max(totalBlocks, 1);
    canvas.scrollTo({ left: Math.max(0, (animatedUpTo) * approxColW), behavior: 'smooth' });
    scrollPauseUntilRef.current = Date.now() + 520; // hold off next block until scroll settles
  }, [animatedUpTo, totalBlocks]);

  // Auto-play animation — waits out any scroll pause before advancing.
  useEffect(() => {
    if (!isPlaying || !blocks) return;
    if (animatedUpTo >= totalBlocks - 1) {
      setIsPlaying(false);
      return;
    }

    const pauseRemaining = Math.max(0, scrollPauseUntilRef.current - Date.now());
    const timer = setTimeout(() => {
      setAnimatedUpTo((prev) => prev + 1);
    }, 600 + pauseRemaining);

    return () => clearTimeout(timer);
  }, [isPlaying, animatedUpTo, totalBlocks, blocks]);

  const handlePlay = useCallback(() => {
    if (animatedUpTo >= totalBlocks - 1) {
      setAnimatedUpTo(-1);
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(true);
    }
  }, [animatedUpTo, totalBlocks]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setAnimatedUpTo(-1);
  }, []);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setAnimatedUpTo((prev) => Math.min(prev + 1, totalBlocks - 1));
  }, [totalBlocks]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setAnimatedUpTo((prev) => Math.max(prev - 1, -1));
  }, []);

  const handleShowAll = useCallback(() => {
    setIsPlaying(false);
    setAnimatedUpTo(totalBlocks - 1);
  }, [totalBlocks]);

  if (!result || !blocks || blocks.length === 0) {
    return (
      <div className="flow-diagram-container">
        <div className="flow-diagram-empty">
          Run an encryption or decryption to see the flow diagram
        </div>
      </div>
    );
  }

  const DiagramComponent = DIAGRAM_MAP[mode];
  if (!DiagramComponent) return null;

  const cap = DIAGRAM_CAPTIONS[mode];
  const captionLabel = cap
    ? `(${isEncrypt ? 'a' : 'b'}) ${isEncrypt ? 'Encryption' : 'Decryption'} — ${cap.text}`
    : null;
  const captionNote = cap
    ? (mode === 'cfb8'
        ? (totalBlocks > 4
            ? `Showing 4 of ${totalBlocks} segments (one per plaintext byte)`
            : `${totalBlocks} segment${totalBlocks === 1 ? '' : 's'} (one per plaintext byte)`)
        : cap.note || null)
    : null;

  return (
    <div className="flow-diagram-container">
      <div className="flow-diagram-header">
        <span className="flow-diagram-title">
          {mode.toUpperCase()} — {isEncrypt ? 'Encryption' : 'Decryption'} Flow
        </span>
        <span className="flow-diagram-progress">
          Block {Math.max(0, animatedUpTo + 1)} / {totalBlocks}
        </span>
      </div>

      <div className="flow-diagram-controls">
        <button onClick={handleReset} className="flow-ctrl-btn" title="Reset">
          &#x23EE;
        </button>
        <button onClick={handleStepBack} className="flow-ctrl-btn" title="Step back"
          disabled={animatedUpTo < 0}>
          &#x23EA;
        </button>
        <button onClick={isPlaying ? () => setIsPlaying(false) : handlePlay}
          className="flow-ctrl-btn flow-ctrl-play" title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '\u23F8' : '\u25B6'}
        </button>
        <button onClick={handleStepForward} className="flow-ctrl-btn" title="Step forward"
          disabled={animatedUpTo >= totalBlocks - 1}>
          &#x23E9;
        </button>
        <button onClick={handleShowAll} className="flow-ctrl-btn" title="Show all">
          &#x23ED;
        </button>
      </div>

      <div className="flow-diagram-canvas" ref={canvasRef}>
        <DiagramComponent
          blocks={blocks}
          isEncrypt={isEncrypt}
          animatedUpTo={animatedUpTo}
          onAesClick={handleAesClick}
        />
      </div>

      {captionLabel && (
        <div className="flow-diagram-caption">
          <span>{captionLabel}</span>
          {captionNote && <span className="flow-diagram-caption-note">{captionNote}</span>}
        </div>
      )}

      <div className="flow-diagram-legend">
        {(MODE_LEGEND_KEYS[mode]?.[isEncrypt ? 'enc' : 'dec'] || []).map((key) => {
          const item = LEGEND_ITEMS[key];
          if (!item) return null;
          return (
            <div key={key} className="legend-item">
              <span className="legend-swatch" style={item.swatch}></span> {item.label}
            </div>
          );
        })}
      </div>

      <div className="flow-diagram-hint">
        Tip: click any <strong>Encrypt</strong> or <strong>Decrypt</strong> box to see the AES internals for that block.
      </div>

      <AesInternalsModal
        open={!!aesModal}
        onClose={handleAesClose}
        blockInput={aesModal?.input}
        key_hex={result?.key_hex}
        isEncrypt={aesModal?.isEncrypt}
        contextLabel={aesModal?.label}
      />
    </div>
  );
}

export default FlowDiagram;
