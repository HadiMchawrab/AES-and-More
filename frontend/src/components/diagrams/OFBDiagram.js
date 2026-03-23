import React from 'react';
import { DataBox, AESBox, XORCircle, KeyArrow, Arrow, PolyArrow, DiagramDefs } from './DiagramPrimitives';

/**
 * OFB Mode Flow Diagram
 *
 * Key difference from CFB: feedback = AES output, NOT ciphertext.
 *
 *   ┌─────────────────────────────────┐  (dashed: keystream generator)
 *   │  Nonce/O[i-1]                   │
 *   │      ↓                          │
 *   │ K → [Encrypt] ──→ next block    │
 *   │      ↓ (O[i] = keystream)       │
 *   └─────────────────────────────────┘
 *         ↓
 *  P[i] → [XOR]
 *         ↓
 *        C[i]
 */
function OFBDiagram({ blocks, isEncrypt, animatedUpTo }) {
  const displayBlocks = blocks || [];
  const colW = 260;
  const startX = 70;
  const totalCols = Math.max(displayBlocks.length, 2);
  const svgW = startX + totalCols * colW + 20;
  const svgH = 320;

  // Y positions (with proper spacing)
  const Y = {
    dashTop: 4,
    fbY: 14,      // Feedback box top
    fbBot: 50,    // Feedback box bottom
    aesY: 66,     // AES box top          (16px gap)
    aesBot: 110,  // AES box bottom
    keyY: 88,     // Key arrow Y (center of AES)
    dashBot: 124,
    ksLabel: 126, // Keystream label Y
    xorY: 152,    // XOR circle center    (28px gap below AES)
    dataY: 134,   // Data input box top
    outY: 184,    // Output box top       (18px gap below XOR)
    outBot: 220,  // Output box bottom
  };

  function renderBlock(block, i, cx, active, d, total) {
    const feedbackLabel = i === 0 ? 'Nonce' : `O${i}`;
    const feedbackValue = block.feedback_input;
    const dataLabel = isEncrypt ? `P${i + 1}` : `C${i + 1}`;
    const dataValue = block.input;
    const outLabel = isEncrypt ? `C${i + 1}` : `P${i + 1}`;
    const outValue = block.output;

    return (
      <g key={i}>
        {/* Dashed box around keystream generator */}
        <rect x={cx - 65} y={Y.dashTop} width={130} height={Y.dashBot - Y.dashTop} rx={6}
          fill="none" stroke={active ? '#4a6a8a' : '#2a2a4a'}
          strokeWidth={1} strokeDasharray="6,4"
          style={{ transition: 'stroke 0.4s ease' }}
        />

        {/* Feedback input */}
        <DataBox x={cx - 55} y={Y.fbY} w={110} label={feedbackLabel}
          value={feedbackValue} color="#a0d4a0" active={active} delay={d} />

        {/* Arrow: feedback down to AES */}
        <Arrow x1={cx} y1={Y.fbBot} x2={cx} y2={Y.aesY}
          active={active} delay={d + 50} />

        {/* Key arrow */}
        <KeyArrow x={cx - 50} y={Y.keyY} active={active} delay={d + 80} />

        {/* AES Encrypt */}
        <AESBox x={cx - 50} y={Y.aesY} isEncrypt={true} active={active} delay={d + 100} />

        {/* Feedback arrow: AES output → next block's feedback input
            Route: right from AES box, up, right to next feedback box */}
        {i < total - 1 && (
          <PolyArrow
            points={[
              [cx + 50, Y.keyY],                    // Right edge of AES box
              [cx + colW / 2 + 10, Y.keyY],         // Right midpoint
              [cx + colW / 2 + 10, Y.fbY + 18],     // Up to feedback level
              [cx + colW - 55, Y.fbY + 18],          // Into next feedback box
            ]}
            active={active} delay={d + 200}
          />
        )}

        {/* Arrow: AES down through dashed box to XOR */}
        <Arrow x1={cx} y1={Y.aesBot} x2={cx} y2={Y.xorY - 12}
          active={active} delay={d + 150} />

        {/* Keystream label */}
        {active && (
          <text x={cx + 10} y={Y.ksLabel} fill="#ffab40" fontSize={8}
            fontFamily="'Consolas', monospace">
            O{i + 1}
          </text>
        )}

        {/* XOR circle */}
        <XORCircle cx={cx} cy={Y.xorY} active={active} delay={d + 200} />

        {/* Data input from left into XOR */}
        <DataBox x={cx - colW + 20} y={Y.dataY} w={90} h={36} label={dataLabel}
          value={dataValue} color={isEncrypt ? '#b8d4e3' : '#c8b8d4'}
          active={active} delay={d + 50} />
        <Arrow x1={cx - colW + 110} y1={Y.xorY} x2={cx - 12} y2={Y.xorY}
          active={active} delay={d + 180} />

        {/* Arrow: XOR down to output */}
        <Arrow x1={cx} y1={Y.xorY + 12} x2={cx} y2={Y.outY}
          active={active} delay={d + 240} />

        {/* Output */}
        <DataBox x={cx - 55} y={Y.outY} w={110} label={outLabel}
          value={outValue} color={isEncrypt ? '#d4c8b0' : '#b0d4b8'}
          active={active} delay={d + 280} />
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
        const d = active ? i * 400 : 0;
        return renderBlock(block, i, cx, active, d, displayBlocks.length);
      })}

      <text x={svgW / 2} y={svgH - 20} textAnchor="middle" fill="#6c6c80" fontSize={11}>
        ({isEncrypt ? 'a' : 'b'}) {isEncrypt ? 'Encryption' : 'Decryption'} — Feedback from AES output (not ciphertext)
      </text>
      <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#4a6a8a" fontSize={9}>
        Dashed box = keystream generator (independent of data)
      </text>
    </svg>
  );
}

export default OFBDiagram;
