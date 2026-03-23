import React from 'react';

/**
 * Shared SVG primitives used by all mode flow diagrams.
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
      stroke={active ? '#00d4ff' : '#4a4a6a'}
      strokeWidth={active ? 1.8 : 1.2}
      markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
      className="flow-arrow"
      style={{ transition: 'stroke 0.4s ease, stroke-width 0.4s ease', transitionDelay: `${delay}ms` }}
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
      stroke={active ? '#00d4ff' : '#4a4a6a'}
      strokeWidth={active ? 1.8 : 1.2}
      markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
      className="flow-arrow"
      style={{ transition: 'stroke 0.4s ease, stroke-width 0.4s ease', transitionDelay: `${delay}ms` }}
    />
  );
}

// Data block (plaintext, ciphertext, IV, counter)
export function DataBox({ x, y, w = 120, h = 36, label, value, color = '#b8d4e3', active, delay = 0 }) {
  const fill = active ? color : '#2a2a4a';
  const textColor = active ? '#0a0a1a' : '#6c6c80';
  return (
    <g className={`diagram-node ${active ? 'active' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      <rect x={x} y={y} width={w} height={h} rx={4}
        fill={fill} stroke={active ? color : '#4a4a6a'} strokeWidth={1.5}
        style={{ transition: 'all 0.4s ease' }}
      />
      <text x={x + w / 2} y={y + 13} textAnchor="middle"
        fill={textColor} fontSize={9} fontWeight={600}
        style={{ transition: 'fill 0.4s ease' }}
      >
        {label}
      </text>
      <text x={x + w / 2} y={y + 27} textAnchor="middle"
        fill={active ? '#1a1a2e' : '#4a4a6a'} fontSize={8}
        fontFamily="'Consolas', monospace"
        style={{ transition: 'fill 0.4s ease' }}
      >
        {value ? truncHex(value, 12) : ''}
      </text>
    </g>
  );
}

// AES Encrypt/Decrypt operation box
export function AESBox({ x, y, w = 100, h = 44, isEncrypt = true, active, delay = 0 }) {
  const bgActive = isEncrypt ? '#5c8a5c' : '#8a6a5c';
  const bgInactive = '#2a3a2a';
  return (
    <g className={`diagram-node ${active ? 'active' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      <rect x={x} y={y} width={w} height={h} rx={4}
        fill={active ? bgActive : bgInactive}
        stroke={active ? (isEncrypt ? '#7cba7c' : '#ba8a7c') : '#4a4a6a'}
        strokeWidth={1.5}
        style={{ transition: 'all 0.4s ease' }}
      />
      <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle"
        fill={active ? '#fff' : '#6c6c80'} fontSize={12} fontWeight={700}
        style={{ transition: 'fill 0.4s ease' }}
      >
        {isEncrypt ? 'Encrypt' : 'Decrypt'}
      </text>
    </g>
  );
}

// XOR circle
export function XORCircle({ cx, cy, active, delay = 0 }) {
  return (
    <g className={`diagram-node ${active ? 'active' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      <circle cx={cx} cy={cy} r={12}
        fill={active ? '#ffab40' : '#2a2a3a'}
        stroke={active ? '#ffcc80' : '#4a4a6a'}
        strokeWidth={1.5}
        style={{ transition: 'all 0.4s ease' }}
      />
      <text x={cx} y={cy + 4} textAnchor="middle"
        fill={active ? '#1a1a2e' : '#6c6c80'} fontSize={14} fontWeight={700}
        style={{ transition: 'fill 0.4s ease' }}
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
        fill={active ? 'rgba(0,212,255,0.15)' : 'transparent'}
        stroke={active ? '#00d4ff' : '#4a4a6a'} strokeWidth={1}
        style={{ transition: 'all 0.4s ease' }}
      />
      <text x={startX - 10} y={y + 4} textAnchor="middle"
        fill={active ? '#00d4ff' : '#6c6c80'} fontSize={10} fontStyle="italic" fontWeight={700}
        style={{ transition: 'fill 0.4s ease' }}
      >
        {label}
      </text>
      {/* Short arrow from circle to AES box */}
      <line x1={startX - 1} y1={y} x2={x} y2={y}
        stroke={active ? '#00d4ff' : '#4a4a6a'} strokeWidth={1.2}
        markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
        style={{ transition: 'stroke 0.4s ease' }}
      />
    </g>
  );
}

// Dots indicating more blocks ("...")
export function Ellipsis({ x, y }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill="#6c6c80" fontSize={20} fontWeight={700}>
      . . .
    </text>
  );
}

// SVG defs for arrowhead markers — small and clean
export function DiagramDefs() {
  return (
    <defs>
      <marker id="arrowhead" markerWidth={6} markerHeight={4} refX={5.5} refY={2} orient="auto">
        <polygon points="0 0, 6 2, 0 4" fill="#6c8ca0" />
      </marker>
      <marker id="arrowhead-active" markerWidth={6} markerHeight={4} refX={5.5} refY={2} orient="auto">
        <polygon points="0 0, 6 2, 0 4" fill="#00d4ff" />
      </marker>
    </defs>
  );
}
