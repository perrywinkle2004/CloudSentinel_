import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '10px',
      padding: '14px 18px', fontSize: '12px', color: '#e2e8f0',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 8, height: 3, borderRadius: 2, background: p.stroke }} />
          <span>{p.name}: <strong style={{ color: p.stroke }}>{p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

export default function RiskTrendChart({ scans = [] }) {
  const data = scans.slice(0, 20).reverse().map((s, i) => {
    const c = s.counts || {}
    return {
      name: `Scan ${i + 1}`,
      'Risk Score': s.risk_score ?? s.score ?? 0,
      'Critical': c.CRITICAL || 0,
      'High': c.HIGH || 0,
    }
  })

  return (
    <div className="analytics-card" style={{ minHeight: 300 }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
        Risk Trend Analytics
      </p>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <defs>
              <filter id="glowBlue">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glowRed">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
            />
            <Line
              type="monotone" dataKey="Risk Score" stroke="#3b82f6" strokeWidth={2.5}
              dot={{ r: 3, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#60a5fa', stroke: '#3b82f6', strokeWidth: 2 }}
              animationDuration={800} filter="url(#glowBlue)"
            />
            <Line
              type="monotone" dataKey="Critical" stroke="#ef4444" strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 3, fill: '#ef4444', stroke: '#0f172a', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#fca5a5', stroke: '#ef4444', strokeWidth: 2 }}
              animationDuration={800} filter="url(#glowRed)"
            />
            <Line
              type="monotone" dataKey="High" stroke="#f97316" strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2, fill: '#f97316', stroke: '#0f172a', strokeWidth: 1 }}
              activeDot={{ r: 5, fill: '#fdba74', stroke: '#f97316', strokeWidth: 2 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#475569', fontSize: '13px' }}>No scan data available</p>
        </div>
      )}
    </div>
  )
}
