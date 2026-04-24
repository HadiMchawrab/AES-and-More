import React from 'react';
import { DataBox, AESBox, XORCircle, KeyArrow, Arrow, PolyArrow, DiagramDefs } from './DiagramPrimitives';

/**
 * CBC Mode Flow Diagram — properly spaced layout.
 *
 * Encryption:
 *        P[i]
 *         ↓
 *   ───→ (XOR)          ← IV or prev C chains in from the left
 *         ↓  (gap)
 *   K → [Encrypt]       ← Key comes from far left, not from prev C
 *         ↓  (gap)
 *        C[i]
 *         └──→ routes right and up to next XOR
 */

function CBCDiagram({ blocks, isEncrypt, animatedUpTo }) {
  const displayBlocks = blocks || [];
  const colW = 260;
  const startX = 80;
  const totalCols = Math.max(displayBlocks.length, 2);
  // First-block IV sits at x = (startX + colW/2) - colW + 15 = startX + 15 - colW/2,
  // which is negative (for startX=80, colW=260 → -35). Extend the viewBox left so
  // it fits without clipping.
  const leftPad = colW / 2 - startX + 15; // extra space needed on the left (positive)
  const viewX = -Math.max(leftPad + 10, 0);
  const svgW = startX + totalCols * colW + 20 - viewX;

  //
  // ─── Encryption Y‑coordinates ────────────────────────────────
  //   P:       10  – 46   (h=36)
  //   arrow:   46  → 58
  //   XOR:     center=72  (r=14, so 58–86)
  //   arrow:   86  → 102  (16px gap)
  //   AES:     102 – 146  (h=44)
  //   arrow:   146 → 164  (18px gap)
  //   C:       164 – 200  (h=36)
  //   chain:   routes at y≈210 below C
  //
  const ENC = {
    pY: 10,
    pBot: 46,
    xorY: 72,        // circle center
    aesY: 102,
    aesBot: 146,
    keyY: 124,        // center of AES
    cY: 164,
    cBot: 200,
  };
  const encH = 240;

  //
  // ─── Decryption Y‑coordinates ────────────────────────────────
  //   C:       10  – 46
  //   arrow:   46  → 62
  //   AES:     62  – 106  (h=44)
  //   arrow:   106 → 122  (16px gap)
  //   XOR:     center=136 (r=14, so 122–150)
  //   arrow:   150 → 166  (16px gap)
  //   P:       166 – 202
  //
  const DEC = {
    cY: 10,
    cBot: 46,
    aesY: 62,
    aesBot: 106,
    keyY: 84,
    xorY: 136,
    pY: 166,
    pBot: 202,
  };
  const decH = 240;

  const svgH = (isEncrypt ? encH : decH);

  // ─── Encryption block ────────────────────────────────────────
  function renderEncryptBlock(block, i, cx, active, d, total) {
    const xorWith = block.xor_with;
    return (
      <g key={`enc-${i}`}>
        {/* Plaintext */}
        <DataBox x={cx - 55} y={ENC.pY} w={110} label={`P${i + 1}`}
          value={block.input} color="#b8d4e3" active={active} delay={d} />

        {/* Arrow: P ↓ XOR */}
        <Arrow x1={cx} y1={ENC.pBot} x2={cx} y2={ENC.xorY - 12}
          active={active} delay={d + 50} />

        {/* XOR */}
        <XORCircle cx={cx} cy={ENC.xorY} active={active} delay={d + 100} />

        {/* IV / chain arrow into XOR from left */}
        {i === 0 && (
          <>
            <DataBox x={cx - colW + 15} y={ENC.xorY - 18} w={80} h={36} label="IV"
              value={xorWith} color="#a0d4a0" active={active} delay={d} />
            <Arrow x1={cx - colW + 95} y1={ENC.xorY} x2={cx - 12} y2={ENC.xorY}
              active={active} delay={d + 80} />
          </>
        )}

        {/* Arrow: XOR ↓ AES  (16px gap) */}
        <Arrow x1={cx} y1={ENC.xorY + 12} x2={cx} y2={ENC.aesY}
          active={active} delay={d + 150} />

        {/* Key — short arrow, clearly from the left margin */}
        <KeyArrow x={cx - 50} y={ENC.keyY} active={active} delay={d + 160} />

        {/* AES Encrypt */}
        <AESBox x={cx - 50} y={ENC.aesY} isEncrypt={true} active={active} delay={d + 200} />

        {/* Arrow: AES ↓ C  (18px gap) */}
        <Arrow x1={cx} y1={ENC.aesBot} x2={cx} y2={ENC.cY}
          active={active} delay={d + 260} />

        {/* Ciphertext */}
        <DataBox x={cx - 55} y={ENC.cY} w={110} label={`C${i + 1}`}
          value={block.output} color="#d4c8b0" active={active} delay={d + 300} />

        {/* Chain arrow → next XOR  (polyline: right, up, right) */}
        {i < total - 1 && (
          <PolyArrow
            points={[
              [cx + 55, ENC.cY + 18],                // right edge of C
              [cx + colW / 2 + 15, ENC.cY + 18],     // midpoint right
              [cx + colW / 2 + 15, ENC.xorY],        // up to XOR level
              [cx + colW - 12, ENC.xorY],             // into next XOR
            ]}
            active={active} delay={d + 360}
          />
        )}
      </g>
    );
  }

  // ─── Decryption block ────────────────────────────────────────
  function renderDecryptBlock(block, i, cx, active, d, total) {
    const xorWith = block.xor_with;
    return (
      <g key={`dec-${i}`}>
        {/* Ciphertext input */}
        <DataBox x={cx - 55} y={DEC.cY} w={110} label={`C${i + 1}`}
          value={block.input} color="#c8b8d4" active={active} delay={d} />

        {/* Arrow: C ↓ AES */}
        <Arrow x1={cx} y1={DEC.cBot} x2={cx} y2={DEC.aesY}
          active={active} delay={d + 50} />

        {/* Key */}
        <KeyArrow x={cx - 50} y={DEC.keyY} active={active} delay={d + 80} />

        {/* AES Decrypt */}
        <AESBox x={cx - 50} y={DEC.aesY} isEncrypt={false} active={active} delay={d + 100} />

        {/* Arrow: AES ↓ XOR */}
        <Arrow x1={cx} y1={DEC.aesBot} x2={cx} y2={DEC.xorY - 12}
          active={active} delay={d + 150} />

        {/* XOR */}
        <XORCircle cx={cx} cy={DEC.xorY} active={active} delay={d + 180} />

        {/* IV / chain arrow into XOR from left */}
        {i === 0 ? (
          <>
            <DataBox x={cx - colW + 15} y={DEC.xorY - 18} w={80} h={36} label="IV"
              value={xorWith} color="#a0d4a0" active={active} delay={d} />
            <Arrow x1={cx - colW + 95} y1={DEC.xorY} x2={cx - 12} y2={DEC.xorY}
              active={active} delay={d + 160} />
          </>
        ) : (
          /* Prev C input feeds into this XOR: route from prev C box down-right to XOR */
          <PolyArrow
            points={[
              [cx - colW + 55, DEC.cBot],             // bottom-right of prev C
              [cx - colW / 2 - 15, DEC.cBot],         // midpoint
              [cx - colW / 2 - 15, DEC.xorY],         // down to XOR level
              [cx - 12, DEC.xorY],                     // into XOR
            ]}
            active={active} delay={d + 160}
          />
        )}

        {/* Arrow: XOR ↓ P */}
        <Arrow x1={cx} y1={DEC.xorY + 12} x2={cx} y2={DEC.pY}
          active={active} delay={d + 220} />

        {/* Plaintext output */}
        <DataBox x={cx - 55} y={DEC.pY} w={110} label={`P${i + 1}`}
          value={block.output} color="#b0d4b8" active={active} delay={d + 260} />
      </g>
    );
  }

  const renderBlock = isEncrypt ? renderEncryptBlock : renderDecryptBlock;

  return (
    <svg viewBox={`${viewX} 0 ${svgW} ${svgH}`} className="flow-diagram-svg"
      style={{ width: svgW, height: svgH }}>
      <DiagramDefs />

      {displayBlocks.map((block, i) => {
        const cx = startX + i * colW + colW / 2;
        const active = i <= animatedUpTo;
        const d = active ? i * 400 : 0;
        return renderBlock(block, i, cx, active, d, displayBlocks.length);
      })}

      <text x={viewX + svgW / 2} y={svgH - 5} textAnchor="middle" fill="#6c6c80" fontSize={11}>
        ({isEncrypt ? 'a' : 'b'}) {isEncrypt ? 'Encryption' : 'Decryption'} — Blocks chained via XOR
      </text>
    </svg>
  );
}

export default CBCDiagram;
