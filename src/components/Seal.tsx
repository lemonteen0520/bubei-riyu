import type { CSSProperties } from 'react'

interface SealProps {
  /** 0..1 掌握度 */
  value: number
  size?: number
  label?: string
}

// 签名元素：朱印进度印记。淡墨 → 朱红，随掌握度加深。
export default function Seal({ value, size = 64, label }: SealProps) {
  const clamped = Math.max(0, Math.min(1, value))
  const filled = clamped > 0.02
  const color = clamped >= 0.8 ? '#b23b2e' : clamped >= 0.4 ? '#8a4b3c' : '#b7aca0'
  const ringColor = filled ? color : '#d8d1c6'
  const dash = Math.PI * 2 * (size / 2 - 6)
  const offset = dash * (1 - clamped)

  return (
    <div
      className="seal"
      style={{ '--seal-size': `${size}px` } as CSSProperties}
      role="img"
      aria-label={label || `掌握度 ${Math.round(clamped * 100)}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 6}
          fill="none"
          stroke={ringColor}
          strokeWidth={2.5}
          opacity={filled ? 1 : 0.5}
        />
        <circle
          className="seal-ring"
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 6}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          style={{ fontFamily: 'var(--font-serif)', fontSize: size * 0.34, opacity: filled ? 1 : 0.25 }}
        >
          {clamped >= 0.8 ? '熟' : clamped >= 0.4 ? '習' : '学'}
        </text>
      </svg>
    </div>
  )
}
