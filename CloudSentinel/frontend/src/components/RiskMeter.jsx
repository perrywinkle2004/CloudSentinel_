import React, { useEffect, useState } from 'react'

const getColor = (score) => {
  if (score >= 90) return { color: '#ef4444', label: 'Critical Risk' }
  if (score >= 70) return { color: '#f97316', label: 'High Risk' }
  if (score >= 40) return { color: '#eab308', label: 'Moderate Risk' }
  return { color: '#22c55e', label: 'Secure' }
}

export default function RiskMeter({ score = 0, size = 160 }) {
  const [displayScore, setDisplayScore] = useState(0)
  const { color, label } = getColor(score)

  useEffect(() => {
    let start = 0
    const step = score / 40
    const timer = setInterval(() => {
      start = Math.min(start + step, score)
      setDisplayScore(Math.round(start))
      if (start >= score) clearInterval(timer)
    }, 25)
    return () => clearInterval(timer)
  }, [score])

  const r = (size / 2) - 12
  const circ = 2 * Math.PI * r
  const progress = ((100 - displayScore) / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#1a2d4a" strokeWidth="10" />
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={progress}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s linear, stroke 0.5s' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono" style={{ color }}>{displayScore}</span>
          <span className="text-xs text-slate-400 font-mono">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold px-3 py-1 rounded-full"
        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
        {label}
      </span>
    </div>
  )
}
