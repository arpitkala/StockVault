import React, { useEffect, useRef } from 'react';

// Generates a simple SVG sparkline
export default function MiniChart({ symbol, positive = true }) {
  // Generate deterministic fake sparkline data based on symbol
  const points = generateSparkline(symbol, positive);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 80, H = 32, pad = 2;

  const svgPoints = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (W - pad * 2);
    const y = H - pad - ((p - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const color = positive ? '#00b386' : '#eb5757';
  const fillId = `fill-${symbol}`;

  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <polygon
        points={`${pad},${H} ${svgPoints} ${W - pad},${H}`}
        fill={`url(#${fillId})`}
      />
      {/* Line */}
      <polyline
        points={svgPoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function generateSparkline(seed, positive) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const rng = (n) => {
    hash = (hash * 1664525 + 1013904223) & 0xffffffff;
    return ((hash >>> 0) / 0xffffffff) * n;
  };

  const points = [100];
  for (let i = 1; i < 12; i++) {
    const delta = (rng(6) - (positive ? 2.5 : 3.5));
    points.push(Math.max(50, Math.min(150, points[i - 1] + delta)));
  }
  return points;
}
