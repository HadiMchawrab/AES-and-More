import React from 'react';
import { DataBox, AESBox, XORCircle, KeyArrow, Arrow, PolyArrow, Ellipsis, DiagramDefs } from './DiagramPrimitives';

/**
 * CFB-8 Mode Flow Diagram (NIST SP 800-38A, s = 8).
 *
 * Per segment j (one byte of plaintext):
 *
 *   ┌──── Shift register (128 bits) ────┐
 *   │  b - s bits         │   s bits     │   ← split visualization
 *   └──────────────┬──────┬──────────────┘
 *                  ↓ (whole register)
 *           K → [AES Encrypt]
 *                  ↓ (128-bit output)
 *   ┌──── Select s bits │ Discard b-s bits ────┐
 *   │     (top byte)    │  (15 lower bytes)    │
 *   └──────┬───────────────────────────────────┘
 *          ↓ (1 byte keystream)
 *   P_j → [XOR]
 *          ↓
 *         C_j ──→ shifts into next segment's register from the right
 *
 * For decryption the data input is C_j and the output is P_j; the byte shifted
 * into the next register is still the ciphertext byte (same as encrypt).
 */
function CFB8Diagram({ blocks, isEncrypt, animatedUpTo, onAesClick }) {
  const all = blocks || [];
  const total = all.length;

  // Keep the diagram readable: if more than 4 segments, show first 3 + ellipsis + last.
  // displayBlocks holds entries shaped { kind: 'block', data, origIndex } | { kind: 'ellipsis' }.
  const displayBlocks = (() => {
    if (total <= 4) {
      return all.map((b, i) => ({ kind: 'block', data: b, origIndex: i }));
    }
    return [
      { kind: 'block', data: all[0], origIndex: 0 },
      { kind: 'block', data: all[1], origIndex: 1 },
      { kind: 'block', data: all[2], origIndex: 2 },
      { kind: 'ellipsis' },
      { kind: 'block', data: all[total - 1], origIndex: total - 1 },
    ];
  })();

  const colW = 280;
  const startX = 100;
  const numCols = displayBlocks.length;
  const svgW = startX + numCols * colW + 60;
  const svgH = 380;

  // Y layout
  const Y = {
    regY: 14,        // shift register top
    regBot: 50,
    aesY: 80,        // 30 px gap → arrow room
    aesBot: 124,
    keyY: 102,
    selY: 150,       // select/discard box top
    selBot: 186,
    xorY: 230,       // XOR circle center
    dataY: 212,      // P/C input box top (left of XOR)
    outY: 264,       // output box top
    outBot: 300,
  };

  const regW = 180;        // shift register width — split visually into "b-s | s"
  const sFrac = 0.16;       // visual width fraction representing the 8-bit segment
  const selW = 180;        // select/discard box width
  const selSFrac = 0.40;    // visually emphasize the selected byte (it's the keystream)

  // Render an individual segment column. cx = column center.
  function renderSegment(entry, colIdx, cx) {
    if (entry.kind === 'ellipsis') {
      return <Ellipsis key={`ellipsis-${colIdx}`} x={cx} y={Y.aesY + 30} />;
    }

    const { data: block, origIndex: i } = entry;
    const active = i <= animatedUpTo;
    const d = active ? colIdx * 400 : 0;

    const dataLabel = isEncrypt ? `P${i + 1}` : `C${i + 1}`;
    const outLabel = isEncrypt ? `C${i + 1}` : `P${i + 1}`;
    const dataValue = block.input;
    const outValue = block.output;

    const regLeft = cx - regW / 2;
    const sBitWidth = regW * sFrac;
    const bMinusSWidth = regW - sBitWidth;

    const selLeft = cx - selW / 2;
    const selSWidth = selW * selSFrac;
    const selDiscardWidth = selW - selSWidth;

    // Color the register: lit when active, with a subtle highlight on the s-bit slice
    // that is about to leave (it gets discarded; only the new byte from the right matters).
    const regFill = active ? '#3a4a5a' : '#252540';
    const regStroke = active ? '#7aa3c8' : '#4a4a6a';
    const regSliceFill = active ? '#5a7a9a' : '#2a2a4a';

    return (
      <g key={`seg-${colIdx}`}>
        {/* ── Shift register: a wide rect split into "b - s bits" and "s bits" ── */}
        <g style={{ transition: 'all 0.4s ease', transitionDelay: `${d}ms` }}>
          <rect x={regLeft} y={Y.regY} width={bMinusSWidth} height={Y.regBot - Y.regY}
            rx={3} fill={regFill} stroke={regStroke} strokeWidth={1.3}
            style={{ transition: 'all 0.4s ease' }}
          />
          <rect x={regLeft + bMinusSWidth} y={Y.regY} width={sBitWidth} height={Y.regBot - Y.regY}
            rx={3} fill={regSliceFill} stroke={regStroke} strokeWidth={1.3}
            style={{ transition: 'all 0.4s ease' }}
          />
          <text x={regLeft + bMinusSWidth / 2} y={Y.regY + 16} textAnchor="middle"
            fill={active ? '#cfd8e3' : '#6c6c80'} fontSize={9} fontWeight={600}>
            b − s bits
          </text>
          <text x={regLeft + bMinusSWidth + sBitWidth / 2} y={Y.regY + 16} textAnchor="middle"
            fill={active ? '#cfd8e3' : '#6c6c80'} fontSize={9} fontWeight={600}>
            s bits
          </text>
          {/* Hex preview of the register state (truncated) */}
          <text x={cx} y={Y.regY + 32} textAnchor="middle"
            fill={active ? '#a8c4d8' : '#4a4a6a'} fontSize={9}
            fontFamily="'Consolas', monospace">
            {block.feedback_input
              ? (block.feedback_input.length > 16
                  ? block.feedback_input.slice(0, 16) + '…'
                  : block.feedback_input)
              : ''}
          </text>
          {/* Label on the left, matching the reference image */}
          <text x={regLeft - 6} y={Y.regY - 4} textAnchor="end"
            fill={active ? '#9ab' : '#6c6c80'} fontSize={9} fontWeight={600}>
            Shift register
          </text>
          {/* I_j label inside (to match reference: arrow labelled I_j into AES) */}
          <text x={cx + regW / 2 + 12} y={Y.regBot + 12} textAnchor="start"
            fill={active ? '#a8c4d8' : '#6c6c80'} fontSize={10} fontStyle="italic">
            I{i + 1}
          </text>
        </g>

        {/* Arrow: register → AES */}
        <Arrow x1={cx} y1={Y.regBot} x2={cx} y2={Y.aesY}
          active={active} delay={d + 60} />

        {/* Key arrow */}
        <KeyArrow x={cx - 50} y={Y.keyY} active={active} delay={d + 100} />

        {/* AES Encrypt — always encrypt, even for decryption */}
        <AESBox x={cx - 50} y={Y.aesY} isEncrypt={true} active={active} delay={d + 120}
          onClick={onAesClick && (() => onAesClick({
            input: block.feedback_input,
            isEncrypt: true,
            label: `CFB-8 · Byte ${i + 1} · Encrypting shift register I${i + 1}`,
          }))} />

        {/* O_j label on AES output */}
        <text x={cx + 60} y={Y.aesBot + 12} textAnchor="start"
          fill={active ? '#a8c4d8' : '#6c6c80'} fontSize={10} fontStyle="italic"
          style={{ transition: 'fill 0.4s ease', transitionDelay: `${d + 140}ms` }}>
          O{i + 1}
        </text>

        {/* Arrow: AES → Select/Discard */}
        <Arrow x1={cx} y1={Y.aesBot} x2={cx} y2={Y.selY}
          active={active} delay={d + 160} />

        {/* ── Select s bits | Discard b - s bits ── */}
        <g style={{ transition: 'all 0.4s ease', transitionDelay: `${d + 180}ms` }}>
          <rect x={selLeft} y={Y.selY} width={selSWidth} height={Y.selBot - Y.selY}
            rx={3} fill={active ? '#5a7a9a' : '#2a2a4a'}
            stroke={active ? '#7aa3c8' : '#4a4a6a'} strokeWidth={1.3}
            style={{ transition: 'all 0.4s ease' }}
          />
          <rect x={selLeft + selSWidth} y={Y.selY} width={selDiscardWidth} height={Y.selBot - Y.selY}
            rx={3} fill={active ? '#3a3a4a' : '#252540'}
            stroke={active ? '#5a5a6a' : '#4a4a6a'} strokeWidth={1.3}
            strokeDasharray="3,2"
            style={{ transition: 'all 0.4s ease' }}
          />
          <text x={selLeft + selSWidth / 2} y={Y.selY + 14} textAnchor="middle"
            fill={active ? '#fff' : '#6c6c80'} fontSize={9} fontWeight={700}>
            Select
          </text>
          <text x={selLeft + selSWidth / 2} y={Y.selY + 26} textAnchor="middle"
            fill={active ? '#fff' : '#6c6c80'} fontSize={9}>
            s bits
          </text>
          <text x={selLeft + selSWidth + selDiscardWidth / 2} y={Y.selY + 14} textAnchor="middle"
            fill={active ? '#cfd8e3' : '#6c6c80'} fontSize={9} fontWeight={700}>
            Discard
          </text>
          <text x={selLeft + selSWidth + selDiscardWidth / 2} y={Y.selY + 26} textAnchor="middle"
            fill={active ? '#cfd8e3' : '#6c6c80'} fontSize={9}>
            b − s bits
          </text>
          {/* Show the actual keystream byte under the Select half */}
          <text x={selLeft + selSWidth / 2} y={Y.selBot + 11} textAnchor="middle"
            fill={active ? '#ffab40' : '#4a4a6a'} fontSize={9}
            fontFamily="'Consolas', monospace">
            {block.keystream || ''}
          </text>
        </g>

        {/* Arrow: Select (s bits) → XOR */}
        <Arrow x1={selLeft + selSWidth / 2} y1={Y.selBot + 14}
          x2={selLeft + selSWidth / 2} y2={Y.xorY - 12}
          active={active} delay={d + 220} />

        {/* XOR — sits under the select half (left side of the diagram column) */}
        <XORCircle cx={selLeft + selSWidth / 2} cy={Y.xorY} active={active} delay={d + 240} />

        {/* P_j / C_j input from the left into XOR */}
        <DataBox
          x={selLeft + selSWidth / 2 - 95} y={Y.dataY} w={50} h={32}
          label={dataLabel} value={dataValue}
          color={isEncrypt ? '#b8d4e3' : '#c8b8d4'} active={active} delay={d + 80}
        />
        <Arrow
          x1={selLeft + selSWidth / 2 - 45} y1={Y.xorY}
          x2={selLeft + selSWidth / 2 - 12} y2={Y.xorY}
          active={active} delay={d + 250}
        />

        {/* XOR → output */}
        <Arrow x1={selLeft + selSWidth / 2} y1={Y.xorY + 12}
          x2={selLeft + selSWidth / 2} y2={Y.outY}
          active={active} delay={d + 280} />

        {/* C_j or P_j output */}
        <DataBox x={selLeft + selSWidth / 2 - 30} y={Y.outY} w={60} h={32}
          label={outLabel} value={outValue}
          color={isEncrypt ? '#d4c8b0' : '#b0d4b8'}
          active={active} delay={d + 320} />
      </g>
    );
  }

  // Inter-column feedback arrow: ciphertext byte from segment k shifts into the
  // shift register of segment k+1 (from the right edge of the next register).
  // We draw this between adjacent visible columns when both are real blocks AND
  // their original indices differ by 1. (When skipping over the ellipsis we
  // don't draw an arrow — the ellipsis already implies the chain.)
  function renderFeedbackArrow(prevEntry, prevCx, nextEntry, nextCx, colIdx) {
    if (prevEntry.kind !== 'block' || nextEntry.kind !== 'block') return null;
    if (nextEntry.origIndex !== prevEntry.origIndex + 1) return null;

    const i = prevEntry.origIndex;
    const active = i <= animatedUpTo;
    const d = active ? colIdx * 400 : 0;

    // Source: bottom of the C/P output box for this column.
    const prevSelLeft = prevCx - selW / 2;
    const sourceX = prevSelLeft + selW * selSFrac / 2;
    const sourceY = Y.outY + 32;

    // Approach the next register from the RIGHT side so the path never
    // crosses the Discard box (which ends at nextCx + regW/2).
    // The arrowhead lands on the right outline of the register, not inside it.
    const nextRegRight = nextCx + regW / 2;
    const approachX = nextRegRight + 8;
    const destY = Y.regY + (Y.regBot - Y.regY) / 2;

    // Stagger depth so consecutive horizontal legs never overlap.
    const routeY = Y.outBot + (i % 2 === 0 ? 40 : 20);
    return (
      <PolyArrow
        key={`fb-${colIdx}`}
        points={[
          [sourceX, sourceY],
          [sourceX, routeY],
          [approachX, routeY],
          [approachX, destY],
          [nextRegRight, destY],
        ]}
        active={active} delay={d + 360}
      />
    );
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="flow-diagram-svg"
      style={{ width: svgW, height: svgH }}>
      <DiagramDefs />

      {displayBlocks.map((entry, colIdx) => {
        const cx = startX + colIdx * colW + colW / 2;
        return renderSegment(entry, colIdx, cx);
      })}

      {displayBlocks.slice(0, -1).map((prevEntry, colIdx) => {
        const nextEntry = displayBlocks[colIdx + 1];
        const prevCx = startX + colIdx * colW + colW / 2;
        const nextCx = startX + (colIdx + 1) * colW + colW / 2;
        return renderFeedbackArrow(prevEntry, prevCx, nextEntry, nextCx, colIdx);
      })}

    </svg>
  );
}

export default CFB8Diagram;
