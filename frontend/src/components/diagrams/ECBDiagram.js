import React from 'react';
import { DataBox, AESBox, KeyArrow, Arrow, DiagramDefs } from './DiagramPrimitives';

/**
 * ECB Mode Flow Diagram
 *
 *   P[i]
 *    ↓
 *  K → [Encrypt]
 *    ↓
 *   C[i]
 *
 * Each block is independent — no arrows between blocks.
 */
function ECBDiagram({ blocks, isEncrypt, animatedUpTo }) {
  const displayBlocks = blocks || [];
  const colW = 240;
  const startX = 50;
  const totalCols = Math.max(displayBlocks.length, 2);
  const svgW = startX + totalCols * colW + 20;
  const svgH = 220;

  function renderBlock(block, i, cx, active, d) {
    const inLabel = isEncrypt ? `P${i + 1}` : `C${i + 1}`;
    const outLabel = isEncrypt ? `C${i + 1}` : `P${i + 1}`;
    return (
      <g key={i}>
        {/* Input */}
        <DataBox x={cx - 55} y={10} w={110} label={inLabel}
          value={block.input} color={isEncrypt ? '#b8d4e3' : '#c8b8d4'}
          active={active} delay={d} />

        {/* Arrow: input down to AES */}
        <Arrow x1={cx} y1={46} x2={cx} y2={68} active={active} delay={d + 80} />

        {/* Key arrow */}
        <KeyArrow x={cx - 50} y={90} active={active} delay={d + 100} />

        {/* AES box */}
        <AESBox x={cx - 50} y={68} isEncrypt={isEncrypt} active={active} delay={d + 120} />

        {/* Arrow: AES down to output */}
        <Arrow x1={cx} y1={112} x2={cx} y2={136} active={active} delay={d + 180} />

        {/* Output */}
        <DataBox x={cx - 55} y={136} w={110} label={outLabel}
          value={block.output} color={isEncrypt ? '#d4c8b0' : '#b0d4b8'}
          active={active} delay={d + 220} />
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="flow-diagram-svg"
      style={{ width: svgW, height: svgH }}>
      <DiagramDefs />

      {displayBlocks.map((block, i) => {
        const cx = startX + i * colW + colW / 2;
        const active = i <= animatedUpTo;
        const d = active ? i * 300 : 0;
        return renderBlock(block, i, cx, active, d);
      })}


      <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#6c6c80" fontSize={11}>
        ({isEncrypt ? 'a' : 'b'}) {isEncrypt ? 'Encryption' : 'Decryption'} — Each block processed independently
      </text>
    </svg>
  );
}

export default ECBDiagram;
