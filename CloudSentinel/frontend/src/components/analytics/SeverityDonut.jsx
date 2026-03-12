import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const SEV_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '10px',
      padding: '12px 16px', fontSize: '12px', color: '#e2e8f0',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ fontWeight: 700, color: SEV_COLORS[d.name] || '#64748b', marginBottom: 4 }}>{d.name}</div>
      <div>Count: <strong>{d.value}</strong></div>
      <div>Percentage: <strong>{d.percent}%</strong></div>
    </div>
  )
}

export default function SeverityDonut({ counts = {} }) {
  const total = (counts.CRITICAL || 0) + (counts.HIGH || 0) + (counts.MEDIUM || 0) + (counts.LOW || 0)
  const hasData = total > 0

  const data = hasData
    ? ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => ({
        name: sev,
        value: counts[sev] || 0,
        percent: ((counts[sev] || 0) / total * 100).toFixed(1)
      }))
    : [{ name: 'No Issues', value: 1, percent: '100.0' }]

  return (
    <div className="analytics-card" style={{ minHeight: 300 }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
        Severity Distribution
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
            paddingAngle={hasData ? 3 : 0} dataKey="value" animationBegin={0} animationDuration={800}>
            {hasData
              ? data.map(d => <Cell key={d.name} fill={SEV_COLORS[d.name]} stroke="none" />)
              : <Cell fill="#334155" stroke="none" />
            }
          </Pie>
          {hasData && <Tooltip content={<CustomTooltip />} />}
        </PieChart>
      </ResponsiveContainer>
      {!hasData && (
        <p style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginTop: '-8px' }}>
          No issues detected
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEV_COLORS[sev] }} />
            <span style={{ color: '#94a3b8' }}>{sev}</span>
            <span style={{ color: SEV_COLORS[sev], fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{counts[sev] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
