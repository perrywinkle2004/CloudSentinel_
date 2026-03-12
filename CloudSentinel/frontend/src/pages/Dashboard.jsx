import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Shield, AlertTriangle, TrendingUp, Clock, Search } from 'lucide-react'
import { getHistory, getLatestScan } from '../api'
import RiskMeter from '../components/RiskMeter'
import { useNavigate } from 'react-router-dom'
import RiskSummaryCards from '../components/analytics/RiskSummaryCards'
import SeverityDonut from '../components/analytics/SeverityDonut'
import RiskHeatMap from '../components/analytics/RiskHeatMap'
import RiskTrendChart from '../components/analytics/RiskTrendChart'
import RiskVectorSpace from '../components/analytics/RiskVectorSpace'
import ConfigDrift from '../components/analytics/ConfigDrift'
import SecurityAlertModal from '../components/SecurityAlertModal'

const SEV_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

export default function Dashboard() {
  const [scans, setScans] = useState([])
  const [latestScan, setLatestScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [overlayDismissed, setOverlayDismissed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getHistory(100).then(r => setScans(r.data.scans || [])).catch(() => { }),
      getLatestScan().then(r => setLatestScan(r.data.scan || null)).catch(() => { })
    ]).finally(() => setLoading(false))
  }, [])

  // DO NOT compute scores locally. Use exact values from backend.
  const displayScore = latestScan ? (latestScan.risk_score ?? latestScan.score ?? 0) : 0
  const displayCounts = latestScan?.counts || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }

  // Aggregate stats for charts
  const totalCounts = scans.reduce((acc, s) => {
    const c = s.counts || {}
    acc.CRITICAL += c.CRITICAL || 0
    acc.HIGH += c.HIGH || 0
    acc.MEDIUM += c.MEDIUM || 0
    acc.LOW += c.LOW || 0
    return acc
  }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 })

  const pieData = Object.entries(totalCounts).map(([name, value]) => ({ name, value }))

  const barData = scans.slice(0, 10).reverse().map((s, i) => ({
    name: `#${i + 1}`,
    score: s.risk_score ?? s.score ?? 0,
    issues: s.total_issues || 0,
  }))

  // Category breakdown
  const categoryMap = {}
  scans.forEach(s => {
    (s.findings || []).forEach(f => {
      const cat = f.category || 'Other'
      categoryMap[cat] = (categoryMap[cat] || 0) + 1
    })
  })
  const categoryData = Object.entries(categoryMap).map(([name, count]) => ({ name, count }))

  return (
    <div className="min-h-screen pt-20 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Security Dashboard</h1>
            <p className="text-slate-400">{scans.length} total scans · aggregate posture overview</p>
          </div>
          <button onClick={() => navigate('/scan')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
            <Search size={16} /> New Scan
          </button>
        </div>

        {scans.length === 0 && !loading && (
          <div className="text-center py-20">
            <Shield size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 mb-4">No scans yet. Run your first scan to populate the dashboard.</p>
            <button onClick={() => navigate('/scan')}
              className="px-6 py-2 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
              Start Scanning
            </button>
          </div>
        )}

        {scans.length > 0 && (
          <>
            {/* Top row - Using Latest Scan directly from backend */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
              <div className="flex flex-col items-center p-6 rounded-xl"
                style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
                <RiskMeter score={displayScore} size={120} />
                <p className="text-xs text-slate-400 mt-2 mb-3">Latest Risk Score</p>
                {displayScore >= 40 && (
                  <button onClick={() => navigate('/fix-suggestions')}
                    className="w-full flex justify-center items-center py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: '1px solid #047857' }}>
                    Auto-Fix Suggestions
                  </button>
                )}
              </div>
              {[
                { label: 'Latest Critical', value: displayCounts.CRITICAL || 0, color: '#ef4444', icon: AlertTriangle },
                { label: 'Latest High', value: displayCounts.HIGH || 0, color: '#f97316', icon: TrendingUp },
                { label: 'Total Scans', value: scans.length, color: '#0ea5e9', icon: Clock },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="p-6 rounded-xl flex flex-col justify-between"
                  style={{ background: '#0a1628', border: `1px solid ${color}30` }}>
                  <Icon size={20} style={{ color }} />
                  <div>
                    <div className="text-4xl font-bold font-mono mt-2" style={{ color }}>{value}</div>
                    <div className="text-sm text-slate-400 mt-1">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Severity Pie */}
              <div className="p-6 rounded-xl" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-4">Overall Severity Distribution</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map(({ name }) => <Cell key={name} fill={SEV_COLORS[name]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid #1a2d4a', color: '#e2e8f0', fontSize: 12 }} />
                    <Legend formatter={(v) => <span style={{ color: SEV_COLORS[v], fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Score trend */}
              <div className="p-6 rounded-xl" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-4">Score Trend (Last 10 Scans)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke="#475569" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid #1a2d4a', color: '#e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="score" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown */}
            {categoryData.length > 0 && (
              <div className="p-6 rounded-xl" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-4">Misconfiguration Categories</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} layout="vertical">
                    <XAxis type="number" stroke="#475569" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fontSize: 11 }} width={130} />
                    <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid #1a2d4a', color: '#e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ═══════ Advanced Risk Intelligence ═══════ */}
            <section style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, #1e3a5f, transparent)' }} />
                <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
                  Advanced Risk Intelligence
                </h2>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, #1e3a5f, transparent)' }} />
              </div>

              {/* Row 1: Risk Summary Cards */}
              <div style={{ marginBottom: '24px' }} className="animate-fade-in">
                <RiskSummaryCards riskScore={displayScore} counts={totalCounts} />
              </div>

              {/* Row 2: Severity Distribution + Risk Heat Map */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }} className="animate-fade-in">
                <SeverityDonut counts={totalCounts} />
                <RiskHeatMap scans={scans} />
              </div>

              {/* Row 3: Risk Trend + Config Drift */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }} className="animate-fade-in">
                <RiskTrendChart scans={scans} />
                <ConfigDrift scans={scans} />
              </div>

              {/* Row 4: Risk Vector Space */}
              <div style={{ marginBottom: '24px' }} className="animate-fade-in">
                <RiskVectorSpace scans={scans} />
              </div>
            </section>
          </>
        )}
      </div>

      {/* Critical Risk Overlay */}
      {(displayScore >= 90 && !overlayDismissed) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="relative max-w-md w-full rounded-2xl p-8 text-center flex flex-col items-center"
            style={{ background: '#0f172a', border: '2px solid #ef4444', boxShadow: '0 25px 60px -12px rgba(239, 68, 68, 0.5)' }}>

            <button
              onClick={() => setOverlayDismissed(true)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-pulse"
              style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)' }}>
              <AlertTriangle size={50} style={{ color: '#eab308' }} />
            </div>

            <h2 className="text-4xl font-black mb-2 tracking-widest text-white">CAUTION!</h2>

            <div className="my-6 w-full p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Risk Score</p>
              <p className="text-6xl font-mono font-black text-red-500">{displayScore}</p>
            </div>

            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              <strong>Critical vulnerabilities</strong> have been detected in your cloud configuration. Immediate action is required to prevent data exposure or system compromise.
            </p>

            <button
              onClick={() => navigate('/fix-suggestions')}
              className="w-full py-4 rounded-xl text-white font-bold tracking-wider transition-all hover:scale-105 uppercase"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 8px 20px rgba(239,68,68,0.4)', border: '1px solid #b91c1c' }}>
              Mitigation Measures
            </button>
          </div>
        </div>
      )}
      <SecurityAlertModal findings={latestScan?.findings} />
    </div>
  )
}
