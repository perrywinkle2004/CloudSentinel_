import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '10px',
      padding: '14px 18px', fontSize: '12px', color: '#e2e8f0',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>{label}</div>
      <div style={{ marginBottom: 2 }}>Risk Score: <strong style={{ color: '#a78bfa' }}>{d.score}</strong></div>
      <div>
        Delta: <strong style={{ color: d.delta > 0 ? '#ef4444' : d.delta < 0 ? '#22c55e' : '#64748b' }}>
          {d.delta > 0 ? '+' : ''}{d.delta}
        </strong>
      </div>
    </div>
  )
}

export default function ConfigDrift({ scans = [] }) {
  if (scans.length < 2) {
    return (
      <div className="analytics-card" style={{ minHeight: 300 }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
          Configuration Drift Intelligence
        </p>
        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)'
            }}>
              <span style={{ fontSize: '28px' }}>📉</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: 4 }}>
              Need at least 2 scans to analyze configuration drift
            </p>
            <p style={{ color: '#475569', fontSize: '12px' }}>(currently {scans.length})</p>
          </div>
        </div>
      </div>
    )
  }

  const reversed = scans.slice(0, 20).reverse()
  const data = reversed.map((s, i) => {
    const score = s.risk_score ?? s.score ?? 0
    const prevScore = i > 0 ? (reversed[i - 1].risk_score ?? reversed[i - 1].score ?? 0) : score
    const delta = i > 0 ? score - prevScore : 0
    return { name: `Scan ${i + 1}`, score, delta, isSpike: Math.abs(delta) > 15 }
  })

  const spikes = data.filter(d => d.isSpike)

  return (
    <div className="analytics-card" style={{ minHeight: 300 }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
        Configuration Drift Intelligence
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis domain={[0, 100]} stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2.5}
            dot={{ r: 4, fill: '#a78bfa', stroke: '#0f172a', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#c4b5fd', stroke: '#a78bfa', strokeWidth: 2 }}
            animationDuration={800} />
          {spikes.map(spike => (
            <ReferenceDot key={spike.name} x={spike.name} y={spike.score} r={8}
              fill={spike.delta > 0 ? '#ef4444' : '#22c55e'} fillOpacity={0.3}
              stroke={spike.delta > 0 ? '#ef4444' : '#22c55e'} strokeWidth={1.5} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {spikes.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          {spikes.map(spike => (
            <span key={spike.name} style={{
              fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              background: spike.delta > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
              color: spike.delta > 0 ? '#ef4444' : '#22c55e',
              border: `1px solid ${spike.delta > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`
            }}>
              {spike.name}: {spike.delta > 0 ? '+' : ''}{spike.delta}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
