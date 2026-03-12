import React, { useEffect, useState, useRef } from 'react'
import { Shield, AlertTriangle, AlertOctagon, AlertCircle, CheckCircle } from 'lucide-react'

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return value
}

function SummaryCard({ label, value, color, icon: Icon, delay = 0 }) {
  const animatedValue = useCountUp(value, 800)
  return (
    <div className="analytics-card" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}18`, border: `1px solid ${color}30`
        }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color, lineHeight: 1 }}>
        {animatedValue}
      </div>
    </div>
  )
}

export default function RiskSummaryCards({ riskScore = 0, counts = {} }) {
  const cards = [
    { label: 'Overall Risk Score', value: riskScore, color: '#3b82f6', icon: Shield },
    { label: 'Critical Findings', value: counts.CRITICAL || 0, color: '#ef4444', icon: AlertOctagon },
    { label: 'High Findings', value: counts.HIGH || 0, color: '#f97316', icon: AlertTriangle },
    { label: 'Medium Findings', value: counts.MEDIUM || 0, color: '#eab308', icon: AlertCircle },
    { label: 'Low Findings', value: counts.LOW || 0, color: '#22c55e', icon: CheckCircle },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
      {cards.map((card, i) => (
        <SummaryCard key={card.label} {...card} delay={i * 80} />
      ))}
    </div>
  )
}
