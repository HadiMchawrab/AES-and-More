import React from 'react';
import { DataBox, AESBox, XORCircle, KeyArrow, Arrow, PolyArrow, DiagramDefs } from './DiagramPrimitives';

/**
 * CFB mode flow diagram.
 *
 * Encryption:
 *   IV / C[i-1] -> Encrypt -> keystream
 *   P[i] XOR keystream -> C[i]
 *   C[i] feeds the next block
 *
 * Decryption:
 *   IV / C[i-1] -> Encrypt -> keystream
 *   C[i] XOR keystream -> P[i]
 *   The ciphertext input also feeds the next block's feedback input.
 */
function CFBDiagram({ blocks, isEncrypt, animatedUpTo, connectorUpTo, onAesClick }) {
  const displayBlocks = blocks || [];
  const colW = 260;
  const startX = 130;
  const totalCols = Math.max(displayBlocks.length, 2);
  const svgW = startX + totalCols * colW + 20;
  const svgH = 300;

  const Y = {
    fbY: 10,
    fbBot: 46,
    aesY: 62,
    aesBot: 106,
    keyY: 84,
    xorY: 140,
    dataY: 122,
    outY: 172,
  };

  function renderEncryptBlock(block, i, cx, active, d, total) {
    return (
      <g key={`enc-${i}`}>
        <DataBox x={cx - 55} y={Y.fbY} w={110} label={i === 0 ? 'IV' : `C${i}`}
          value={block.feedback_input} color="#a0d4a0" active={active} delay={d} />

        <Arrow x1={cx} y1={Y.fbBot} x2={cx} y2={Y.aesY}
          active={active} delay={d + 50} />

        <KeyArrow x={cx - 50} y={Y.keyY} active={active} delay={d + 80} />

        <AESBox x={cx - 50} y={Y.aesY} isEncrypt={true} active={active} delay={d + 100}
          onClick={onAesClick && (() => onAesClick({
            input: block.feedback_input,
            isEncrypt: true,
            label: `CFB · Block ${i + 1} · Encrypting feedback (${i === 0 ? 'IV' : `C${i}`})`,
          }))} />

        <Arrow x1={cx} y1={Y.aesBot} x2={cx} y2={Y.xorY - 12}
          active={active} delay={d + 150} />

        <XORCircle cx={cx} cy={Y.xorY} active={active} delay={d + 180} />

        <DataBox x={cx - colW + 45} y={Y.dataY} w={90} h={36} label={`P${i + 1}`}
          value={block.input} color="#b8d4e3" active={active} delay={d + 50} />
        <Arrow x1={cx - colW + 135} y1={Y.xorY} x2={cx - 12} y2={Y.xorY}
          active={active} delay={d + 160} />

        <Arrow x1={cx} y1={Y.xorY + 12} x2={cx} y2={Y.outY}
          active={active} delay={d + 220} />

        <DataBox x={cx - 55} y={Y.outY} w={110} label={`C${i + 1}`}
          value={block.output} color="#d4c8b0" active={active} delay={d + 260} />

        {i < total - 1 && (
          <PolyArrow
            points={[
              [cx + 55, Y.outY + 18],
              [cx + colW / 2 + 25, Y.outY + 18],
              [cx + colW / 2 + 25, Y.fbY + 18],
              [cx + colW - 55, Y.fbY + 18],
            ]}
            active={i <= connectorUpTo} delay={0}
          />
        )}
      </g>
    );
  }

  function renderDecryptBlock(block, i, cx, active, d, total) {
    const dataBoxX = cx + 45;
    const dataBoxLeft = dataBoxX;
    const dataBoxRight = dataBoxX + 90;
    const branchX = dataBoxRight + 24;
    const feedbackLaneY = Y.dataY + 18;

    return (
      <g key={`dec-${i}`}>
        <DataBox x={cx - 55} y={Y.fbY} w={110} label={i === 0 ? 'IV' : `C${i}`}
          value={block.feedback_input} color="#a0d4a0" active={active} delay={d} />

        <Arrow x1={cx} y1={Y.fbBot} x2={cx} y2={Y.aesY}
          active={active} delay={d + 50} />

        <KeyArrow x={cx - 50} y={Y.keyY} active={active} delay={d + 80} />

        <AESBox x={cx - 50} y={Y.aesY} isEncrypt={true} active={active} delay={d + 100}
          onClick={onAesClick && (() => onAesClick({
            input: block.feedback_input,
            isEncrypt: true,
            label: `CFB · Block ${i + 1} · Encrypting feedback (${i === 0 ? 'IV' : `C${i}`})`,
          }))} />

        <Arrow x1={cx} y1={Y.aesBot} x2={cx} y2={Y.xorY - 12}
          active={active} delay={d + 150} />

        <XORCircle cx={cx} cy={Y.xorY} active={active} delay={d + 180} />

        <DataBox x={dataBoxX} y={Y.dataY} w={90} h={36} label={`C${i + 1}`}
          value={block.input} color="#c8b8d4" active={active} delay={d + 50} />
        <Arrow x1={dataBoxLeft} y1={Y.xorY} x2={cx + 12} y2={Y.xorY}
          active={active} delay={d + 160} />

        <Arrow x1={cx} y1={Y.xorY + 12} x2={cx} y2={Y.outY}
          active={active} delay={d + 220} />

        <DataBox x={cx - 55} y={Y.outY} w={110} label={`P${i + 1}`}
          value={block.output} color="#b0d4b8" active={active} delay={d + 260} />

        {i < total - 1 && (
          <PolyArrow
            points={[
              [dataBoxRight, feedbackLaneY],
              [branchX, feedbackLaneY],
              [branchX, Y.fbY + 18],
              [cx + colW - 55, Y.fbY + 18],
            ]}
            active={i <= connectorUpTo} delay={0}
          />
        )}
      </g>
    );
  }

  const renderBlock = isEncrypt ? renderEncryptBlock : renderDecryptBlock;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="flow-diagram-svg"
      style={{ width: svgW, height: svgH }}>
      <DiagramDefs />

      {displayBlocks.map((block, i) => {
        const cx = startX + i * colW + colW / 2;
        const active = i <= animatedUpTo;
        return renderBlock(block, i, cx, active, 0, displayBlocks.length);
      })}
    </svg>
  );
}

export default CFBDiagram;
