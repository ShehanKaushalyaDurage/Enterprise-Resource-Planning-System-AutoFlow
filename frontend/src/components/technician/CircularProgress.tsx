import React from 'react'

interface Props {
  value: number
  size?: number
  strokeWidth?: number
}

export default function CircularProgress({ value, size = 120, strokeWidth = 10 }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Fill Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--accent-blue)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.35s ease-in-out' }}
        />
      </svg>
      {/* Center Label */}
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: `${size * 0.18}px`, fontWeight: 800, color: 'var(--text-primary)' }}>
          {Math.round(value)}%
        </span>
        <span style={{ fontSize: `${size * 0.08}px`, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>
          Target
        </span>
      </div>
    </div>
  )
}
