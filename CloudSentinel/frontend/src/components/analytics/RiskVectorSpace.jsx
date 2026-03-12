import React, { useEffect, useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis } from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '10px',
      padding: '14px 18px', fontSize: '12px', color: '#e2e8f0',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>{d.label}</div>
      <div style={{ marginBottom: 2 }}>Risk Score: <strong style={{ color: '#3b82f6' }}>{d.riskScore}</strong></div>
      <div style={{ marginBottom: 2 }}>Critical: <strong style={{ color: '#ef4444' }}>{d.critical}</strong></div>
      <div>High: <strong style={{ color: '#f97316' }}>{d.high}</strong></div>
    </div>
  )
}

function GlowNode(props) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  const getColor = (score) => {
    if (score >= 90) return '#ef4444'
    if (score >= 70) return '#f97316'
    if (score >= 40) return '#eab308'
    return '#22c55e'
  }
  const color = getColor(payload.riskScore)
  return (
    <g>
      <circle cx={cx} cy={cy} r={16} fill={color} opacity={0.1} className="node-glow" />
      <circle cx={cx} cy={cy} r={10} fill={color} opacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="#0f172a" strokeWidth={1.5} />
    </g>
  )
}

export default function RiskVectorSpace({ scans = [] }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  if (scans.length < 3) {
    return (
      <div className="analytics-card" style={{ minHeight: 300 }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
          Risk Vector Space
        </p>
        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)'
            }}>
              <span style={{ fontSize: '28px' }}>🔬</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: 4 }}>
              Need at least 3 configurations to generate risk vector space
            </p>
            <p style={{ color: '#475569', fontSize: '12px' }}>(currently {scans.length})</p>
          </div>
        </div>
      </div>
    )
  }

  const maxIssues = Math.max(...scans.map(s => s.total_issues || 1), 1)
  const data = scans.map((s, i) => {
    const c = s.counts || {}
    const severityIndex = (c.CRITICAL || 0) * 4 + (c.HIGH || 0) * 3 + (c.MEDIUM || 0) * 2 + (c.LOW || 0) * 1
    const normalizedSeverity = Math.min((severityIndex / (maxIssues * 4)) * 100, 100)
    const density = ((s.total_issues || 0) / maxIssues) * 100
    return {
      x: Math.round(normalizedSeverity * 10) / 10,
      y: Math.round(density * 10) / 10,
      z: 100,
      label: `Scan ${i + 1}`,
      riskScore: s.risk_score ?? s.score ?? 0,
      critical: c.CRITICAL || 0,
      high: c.HIGH || 0,
    }
  })

  return (
    <div className="analytics-card" style={{ minHeight: 340, opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
        Risk Vector Space
      </p>
      <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>
        Each node represents a scan projected into severity × density space
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis type="number" dataKey="x" name="Severity Index" domain={[0, 100]} stroke="#334155"
            tick={{ fontSize: 10, fill: '#64748b' }}
            label={{ value: 'Risk Severity Index', position: 'bottom', offset: -2, style: { fill: '#475569', fontSize: 10 } }} />
          <YAxis type="number" dataKey="y" name="Density" domain={[0, 100]} stroke="#334155"
            tick={{ fontSize: 10, fill: '#64748b' }}
            label={{ value: 'Misconfig Density', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#475569', fontSize: 10 } }} />
          <ZAxis type="number" dataKey="z" range={[80, 200]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1e3a5f', strokeDasharray: '5 5' }} />
          <Scatter data={data} shape={<GlowNode />} animationDuration={800} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
