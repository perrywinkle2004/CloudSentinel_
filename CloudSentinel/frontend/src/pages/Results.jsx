import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import RiskMeter from '../components/RiskMeter'
import AlertCard from '../components/AlertCard'
import SecurityAlertModal from '../components/SecurityAlertModal'
import { Search, ArrowLeft, CheckCircle2, Crosshair } from 'lucide-react'

const SEV_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result

  // Persist latest scan result for Threat Intel page
  useEffect(() => {
    if (result) {
      localStorage.setItem('latestScanResult', JSON.stringify(result))
    }
  }, [result])

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-8">
        <p className="text-slate-400 mb-4">No scan results found.</p>
        <button onClick={() => navigate('/scan')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sky-400 hover:bg-sky-400/10 transition-colors">
          <Search size={16} /> Run a Scan
        </button>
      </div>
    )
  }

  const { rating, counts, findings, provider, service, scenario } = result
  const displayScore = result.risk_score ?? result.score ?? 0

  const pieData = Object.entries(counts || {})
    .map(([name, value]) => ({ name, value }))

  const totalIssues = pieData.reduce((sum, d) => sum + d.value, 0)

  const sortedFindings = [...(findings || [])].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
  })

  return (
    <div className="min-h-screen pt-8 px-6 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Back + Threat Intel */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/scan')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> New Scan
          </button>
          <button onClick={() => navigate('/threat-intel', { state: { result } })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 0 20px rgba(239,68,68,0.2)' }}>
            <Crosshair size={14} /> View Threat Intel
          </button>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in">
          {/* Score */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl"
            style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
            <RiskMeter score={displayScore} size={140} />
          </div>

          {/* Meta */}
          <div className="p-6 rounded-xl col-span-2 flex flex-col justify-between"
            style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
            <div>
              <span className="text-xs font-mono text-slate-500">SCAN RESULT</span>
              <h2 className="text-2xl font-bold text-white mt-1">
                {provider?.toUpperCase()} / {service?.toUpperCase()}
                {scenario && <span className="text-slate-400 text-lg"> · {scenario}</span>}
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Critical', count: counts.CRITICAL, color: '#ef4444' },
                { label: 'High', count: counts.HIGH, color: '#f97316' },
                { label: 'Medium', count: counts.MEDIUM, color: '#eab308' },
                { label: 'Low', count: counts.LOW, color: '#22c55e' },
              ].map(({ label, count, color }) => (
                <div key={label} className="text-center p-3 rounded-lg"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <div className="text-2xl font-bold font-mono" style={{ color }}>{count}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie chart + findings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-6 rounded-xl" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-4">Severity Distribution</p>
            {totalIssues > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {pieData.map(({ name }) => (
                      <Cell key={name} fill={SEV_COLORS[name]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#0a1628', border: '1px solid #1a2d4a', color: '#e2e8f0', fontSize: 12 }} />
                  <Legend formatter={(v) => <span style={{ color: SEV_COLORS[v], fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center" style={{ height: 180 }}>
                <CheckCircle2 size={40} className="mb-2" style={{ color: '#22c55e' }} />
                <p className="text-sm text-slate-400">No issues found!</p>
              </div>
            )}
          </div>

          {/* Findings list */}
          <div className="md:col-span-2 space-y-3">
            {sortedFindings.length === 0 ? (
              <div className="p-8 rounded-xl flex flex-col items-center justify-center"
                style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
                <CheckCircle2 size={48} style={{ color: '#22c55e' }} className="mb-3" />
                <p className="text-lg font-semibold text-white mb-1">All Clear!</p>
                <p className="text-sm text-slate-400">No security misconfigurations detected.</p>
              </div>
            ) : (
              sortedFindings.map((f, i) => <AlertCard key={f.id} finding={f} index={i} />)
            )}
          </div>
        </div>
      </div>
      <SecurityAlertModal findings={result.findings} />
    </div>
  )
}
