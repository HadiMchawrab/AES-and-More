import React from 'react';

/**
 * Shared SVG primitives used by all mode flow diagrams.
 *
 * Inactive colors come from CSS theme tokens (--diagram-*) so they adapt
 * to light/dark mode. Active colors stay hardcoded — they are tuned visualization
 * swatches that read fine on either background.
 */

// Truncate hex to fit in boxes
export function truncHex(hex, maxLen = 8) {
  if (!hex) return '???';
  if (hex.length <= maxLen) return hex;
  return hex.slice(0, maxLen) + '..';
}

// Straight arrow line
export function Arrow({ x1, y1, x2, y2, active, delay = 0 }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      strokeWidth={active ? 1.8 : 1.2}
      markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
      className="flow-arrow"
      style={{
        stroke: active ? '#6366f1' : 'var(--diagram-inactive-stroke)',
        transition: 'stroke 0.4s ease, stroke-width 0.4s ease',
        transitionDelay: `${delay}ms`,
      }}
    />
  );
}

// Multi-point polyline arrow (for routing around elements)
export function PolyArrow({ points, active, delay = 0 }) {
  const pointStr = points.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <polyline
      points={pointStr}
      fill="none"
      strokeWidth={active ? 1.8 : 1.2}
      markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
      className="flow-arrow"
      style={{
        stroke: active ? '#6366f1' : 'var(--diagram-inactive-stroke)',
        transition: 'stroke 0.4s ease, stroke-width 0.4s ease',
        transitionDelay: `${delay}ms`,
      }}
    />
  );
}

// Data block (plaintext, ciphertext, IV, counter)
export function DataBox({ x, y, w = 120, h = 36, label, value, color = '#b8d4e3', active, delay = 0 }) {
  return (
    <g className={`diagram-node ${active ? 'active' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      <rect x={x} y={y} width={w} height={h} rx={4}
        strokeWidth={1.5}
        style={{
          fill: active ? color : 'var(--diagram-inactive-fill)',
          stroke: active ? color : 'var(--diagram-inactive-stroke)',
          transition: 'all 0.4s ease',
        }}
      />
      <text x={x + w / 2} y={y + 14} textAnchor="middle"
        fontSize={10} fontWeight={600}
        style={{
          fill: active ? '#0a0a1a' : 'var(--diagram-inactive-text)',
          transition: 'fill 0.4s ease',
        }}
      >
        {label}
      </text>
      <text x={x + w / 2} y={y + 28} textAnchor="middle"
        fontSize={10}
        fontFamily="'Consolas', monospace"
        style={{
          fill: active ? '#1a1a2e' : 'var(--diagram-inactive-stroke)',
          transition: 'fill 0.4s ease',
        }}
      >
        {value ? truncHex(value, 10) : ''}
      </text>
    </g>
  );
}

// AES Encrypt/Decrypt operation box. Clickable when onClick is provided and active.
export function AESBox({ x, y, w = 100, h = 44, isEncrypt = true, active, delay = 0, onClick }) {
  const bgActive = isEncrypt ? '#5c8a5c' : '#8a6a5c';
  const strokeActive = isEncrypt ? '#7cba7c' : '#ba8a7c';
  const clickable = !!onClick && active;
  return (
    <g
      className={`diagram-node ${active ? 'active' : ''} ${clickable ? 'aes-box-clickable' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={clickable ? onClick : undefined}
    >
      <rect x={x} y={y} width={w} height={h} rx={4}
        strokeWidth={1.5}
        style={{
          fill: active ? bgActive : 'var(--diagram-aes-inactive-bg)',
          stroke: active ? strokeActive : 'var(--diagram-inactive-stroke)',
          transition: 'all 0.4s ease',
        }}
      />
      <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle"
        fontSize={12} fontWeight={700}
        style={{
          fill: active ? '#fff' : 'var(--diagram-inactive-text)',
          transition: 'fill 0.4s ease',
        }}
      >
        {isEncrypt ? 'Encrypt' : 'Decrypt'}
      </text>
      {clickable && (
        <text x={x + w - 6} y={y + 10} textAnchor="end"
          fill="#fff" fontSize={9} opacity={0.7}>
          🔍
        </text>
      )}
    </g>
  );
}

// XOR circle
export function XORCircle({ cx, cy, active, delay = 0 }) {
  return (
    <g className={`diagram-node ${active ? 'active' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      <circle cx={cx} cy={cy} r={12}
        strokeWidth={1.5}
        style={{
          fill: active ? '#ffab40' : 'var(--diagram-xor-inactive-fill)',
          stroke: active ? '#ffcc80' : 'var(--diagram-inactive-stroke)',
          transition: 'all 0.4s ease',
        }}
      />
      <text x={cx} y={cy + 4} textAnchor="middle"
        fontSize={14} fontWeight={700}
        style={{
          fill: active ? '#1a1a2e' : 'var(--diagram-inactive-text)',
          transition: 'fill 0.4s ease',
        }}
      >
        ⊕
      </text>
    </g>
  );
}

// Key arrow — short stub with "K" label, clearly not connected to other elements
export function KeyArrow({ x, y, label = 'K', active, delay = 0 }) {
  const arrowLen = 25;
  const startX = x - arrowLen;
  return (
    <g className={`diagram-node ${active ? 'active' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {/* "K" label in a small circle */}
      <circle cx={startX - 10} cy={y} r={9}
        strokeWidth={1}
        style={{
          fill: active ? 'rgba(99,102,241,0.15)' : 'transparent',
          stroke: active ? '#6366f1' : 'var(--diagram-inactive-stroke)',
          transition: 'all 0.4s ease',
        }}
      />
      <text x={startX - 10} y={y + 4} textAnchor="middle"
        fontSize={10} fontStyle="italic" fontWeight={700}
        style={{
          fill: active ? '#6366f1' : 'var(--diagram-inactive-text)',
          transition: 'fill 0.4s ease',
        }}
      >
        {label}
      </text>
      {/* Short arrow from circle to AES box */}
      <line x1={startX - 1} y1={y} x2={x} y2={y}
        strokeWidth={1.2}
        markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
        style={{
          stroke: active ? '#6366f1' : 'var(--diagram-inactive-stroke)',
          transition: 'stroke 0.4s ease',
        }}
      />
    </g>
  );
}

// Dots indicating more blocks ("...")
export function Ellipsis({ x, y }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={20} fontWeight={700}
      style={{ fill: 'var(--diagram-inactive-text)' }}>
      . . .
    </text>
  );
}

// SVG defs for arrowhead markers — small and clean
export function DiagramDefs() {
  return (
    <defs>
      <marker id="arrowhead" markerWidth={6} markerHeight={4} refX={5.5} refY={2} orient="auto">
        <polygon points="0 0, 6 2, 0 4" style={{ fill: 'var(--diagram-arrow-marker-inactive)' }} />
      </marker>
      <marker id="arrowhead-active" markerWidth={6} markerHeight={4} refX={5.5} refY={2} orient="auto">
        <polygon points="0 0, 6 2, 0 4" style={{ fill: 'var(--diagram-arrow-marker-active)' }} />
      </marker>
    </defs>
  );
}
