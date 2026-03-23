import React from 'react';
import { DataBox, AESBox, XORCircle, KeyArrow, Arrow, PolyArrow, DiagramDefs } from './DiagramPrimitives';

/**
 * CFB Mode Flow Diagram
 *
 * Encryption:
 *   IV/C[i-1]          (feedback input)
 *       ↓
 *  K → [Encrypt]       (AES encrypt the feedback)
 *       ↓ keystream
 *      [XOR] ← P[i]   (XOR keystream with plaintext)
 *       ↓
 *      C[i] ─────→     (output feeds back to next block)
 *
 * Decryption: same structure, but input to XOR is C[i], output is P[i],
 * and feedback comes from the ciphertext input (C[i]).
 */
function CFBDiagram({ blocks, isEncrypt, animatedUpTo }) {
  const displayBlocks = blocks || [];
  const colW = 260;
  const startX = 70;
  const totalCols = Math.max(displayBlocks.length, 2);
  const svgW = startX + totalCols * colW + 20;
  const svgH = 300;

  // Y positions (with proper spacing between elements)
  const Y = {
    fbY: 10,      // Feedback box top
    fbBot: 46,    // Feedback box bottom
    aesY: 62,     // AES box top          (16px gap from fb)
    aesBot: 106,  // AES box bottom
    keyY: 84,     // Key arrow Y (center of AES)
    ksLabel: 120, // Keystream label Y
    xorY: 140,    // XOR circle center    (20px gap below AES + 14 radius)
    dataY: 122,   // Data input box top
    outY: 172,    // Output box top       (18px gap below XOR)
    outBot: 208,  // Output box bottom
  };

  function renderBlock(block, i, cx, active, d, total) {
    const feedbackLabel = i === 0 ? 'IV' : (isEncrypt ? `C${i}` : `C${i}`);
    const feedbackValue = block.feedback_input;
    const dataLabel = isEncrypt ? `P${i + 1}` : `C${i + 1}`;
    const dataValue = block.input;
    const outLabel = isEncrypt ? `C${i + 1}` : `P${i + 1}`;
    const outValue = block.output;

    return (
      <g key={i}>
        {/* Feedback input (IV or previous ciphertext) */}
        <DataBox x={cx - 55} y={Y.fbY} w={110} label={feedbackLabel}
          value={feedbackValue} color="#a0d4a0" active={active} delay={d} />

        {/* Arrow: feedback down to AES */}
        <Arrow x1={cx} y1={Y.fbBot} x2={cx} y2={Y.aesY}
          active={active} delay={d + 50} />

        {/* Key arrow */}
        <KeyArrow x={cx - 50} y={Y.keyY} active={active} delay={d + 80} />

        {/* AES Encrypt (always encrypt, even for decryption) */}
        <AESBox x={cx - 50} y={Y.aesY} isEncrypt={true} active={active} delay={d + 100} />

        {/* Arrow: AES down to XOR (keystream) */}
        <Arrow x1={cx} y1={Y.aesBot} x2={cx} y2={Y.xorY - 12}
          active={active} delay={d + 150} />

        {/* Keystream label */}
        {active && (
          <text x={cx + 10} y={Y.ksLabel} fill="#ffab40" fontSize={8}
            fontFamily="'Consolas', monospace">
            keystream
          </text>
        )}

        {/* XOR circle */}
        <XORCircle cx={cx} cy={Y.xorY} active={active} delay={d + 180} />

        {/* Data input from left into XOR */}
        <DataBox x={cx - colW + 20} y={Y.dataY} w={90} h={36} label={dataLabel}
          value={dataValue} color={isEncrypt ? '#b8d4e3' : '#c8b8d4'}
          active={active} delay={d + 50} />
        <Arrow x1={cx - colW + 110} y1={Y.xorY} x2={cx - 12} y2={Y.xorY}
          active={active} delay={d + 160} />

        {/* Arrow: XOR down to output */}
        <Arrow x1={cx} y1={Y.xorY + 12} x2={cx} y2={Y.outY}
          active={active} delay={d + 220} />

        {/* Output */}
        <DataBox x={cx - 55} y={Y.outY} w={110} label={outLabel}
          value={outValue} color={isEncrypt ? '#d4c8b0' : '#b0d4b8'}
          active={active} delay={d + 260} />

        {/* Feedback arrow to next block */}
        {i < total - 1 && (
          isEncrypt ? (
            // Encryption: C output feeds back → route right and up to next feedback input
            <PolyArrow
              points={[
                [cx + 55, Y.outY + 18],            // Right edge of output
                [cx + colW / 2 + 10, Y.outY + 18], // Midpoint right
                [cx + colW / 2 + 10, Y.fbY + 18],  // Up to feedback level
                [cx + colW - 55, Y.fbY + 18],       // Into next feedback box
              ]}
              active={active} delay={d + 300}
            />
          ) : (
            // Decryption: C input (the data input) feeds to next feedback
            // The ciphertext C[i+1] is the next block's data, but C[i] feeds as feedback
            // In CFB decrypt, feedback = ciphertext input, which is block.input
            <PolyArrow
              points={[
                [cx - colW + 110, Y.dataY + 4],     // Right of data box
                [cx + colW / 2 + 10, Y.dataY + 4],  // Route right
                [cx + colW / 2 + 10, Y.fbY + 18],   // Up to feedback level
                [cx + colW - 55, Y.fbY + 18],        // Into next feedback
              ]}
              active={active} delay={d + 300}
            />
          )
        )}
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

      <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#6c6c80" fontSize={11}>
        ({isEncrypt ? 'a' : 'b'}) {isEncrypt ? 'Encryption' : 'Decryption'} — Feedback from ciphertext
      </text>
    </svg>
  );
}

export default CFBDiagram;
