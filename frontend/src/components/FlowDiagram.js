import React, { useState, useEffect, useCallback } from 'react';
import ECBDiagram from './diagrams/ECBDiagram';
import CBCDiagram from './diagrams/CBCDiagram';
import CFBDiagram from './diagrams/CFBDiagram';
import OFBDiagram from './diagrams/OFBDiagram';
import CTRDiagram from './diagrams/CTRDiagram';

const DIAGRAM_MAP = {
  ecb: ECBDiagram,
  cbc: CBCDiagram,
  cfb: CFBDiagram,
  ofb: OFBDiagram,
  ctr: CTRDiagram,
};

/**
 * Main FlowDiagram component.
 *
 * Renders the appropriate mode diagram with animated block-by-block reveal.
 * Controls: Play/Reset animation, step forward/back.
 *
 * Props:
 *   - mode: 'ecb' | 'cbc' | 'cfb' | 'ofb' | 'ctr'
 *   - result: API response with block_details
 */
function FlowDiagram({ mode, result }) {
  const [animatedUpTo, setAnimatedUpTo] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const blocks = result?.block_details;
  const totalBlocks = blocks?.length || 0;
  const isEncrypt = result?.type === 'encrypt';

  // Reset animation when result changes
  useEffect(() => {
    setAnimatedUpTo(-1);
    setIsPlaying(false);
  }, [result]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || !blocks) return;
    if (animatedUpTo >= totalBlocks - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedUpTo((prev) => prev + 1);
    }, 600);

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

      <div className="flow-diagram-canvas">
        <DiagramComponent
          blocks={blocks}
          isEncrypt={isEncrypt}
          animatedUpTo={animatedUpTo}
        />
      </div>

      <div className="flow-diagram-legend">
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#b8d4e3' }}></span> Plaintext
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#d4c8b0' }}></span> Ciphertext
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#5c8a5c' }}></span> AES Encrypt
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#8a6a5c' }}></span> AES Decrypt
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#ffab40', borderRadius: '50%' }}></span> XOR
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#a0d4a0' }}></span> IV / Feedback
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#e3d4a0' }}></span> Counter
        </div>
      </div>
    </div>
  );
}

export default FlowDiagram;
