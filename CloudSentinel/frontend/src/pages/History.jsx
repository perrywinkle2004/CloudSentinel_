import React, { useEffect, useState } from 'react'
import { getHistory } from '../api'
import { Clock, Search, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const RATING_COLOR = { 'Secure': '#22c55e', 'Moderate Risk': '#eab308', 'High Risk': '#f97316', 'Critical Risk': '#ef4444' }

export default function History() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    getHistory(50).then(r => setScans(r.data.scans || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen pt-8 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Scan History</h1>
            <p className="text-slate-400">{scans.length} scans stored</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
              style={{ border: '1px solid #1a2d4a' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => navigate('/scan')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
              <Search size={16} /> New Scan
            </button>
          </div>
        </div>

        {scans.length === 0 && !loading && (
          <div className="text-center py-20">
            <Clock size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">No scans yet. Run your first scan to see history here.</p>
          </div>
        )}

        {scans.length > 0 && (
          <div className="rounded-xl overflow-hidden animate-fade-in" style={{ border: '1px solid #1a2d4a' }}>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
              style={{ background: '#0d1e35', borderBottom: '1px solid #1a2d4a' }}>
              <div className="col-span-3">Timestamp</div>
              <div className="col-span-2">Provider</div>
              <div className="col-span-2">Service</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-1">Issues</div>
              <div className="col-span-2">Rating</div>
            </div>

            {/* Rows */}
            {scans.map((scan, i) => {
              const color = RATING_COLOR[scan.rating] || '#94a3b8'
              const date = scan.created_at ? new Date(scan.created_at).toLocaleString() : '—'
              return (
                <div key={i} className="grid grid-cols-12 gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-white/5"
                  style={{ borderBottom: i < scans.length - 1 ? '1px solid #1a2d4a' : 'none', background: i % 2 === 0 ? '#0a1628' : 'transparent' }}>
                  <div className="col-span-3 text-slate-400 font-mono text-xs truncate">{date}</div>
                  <div className="col-span-2 text-slate-200 uppercase font-mono text-xs">{scan.provider || '—'}</div>
                  <div className="col-span-2 text-slate-200 uppercase font-mono text-xs">{scan.service || '—'}</div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: '#1a2d4a' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${scan.score || 0}%`, background: color }} />
                      </div>
                      <span className="font-mono text-xs font-bold" style={{ color }}>{scan.score ?? '—'}</span>
                    </div>
                  </div>
                  <div className="col-span-1 font-mono text-xs text-slate-300">{scan.total_issues ?? '—'}</div>
                  <div className="col-span-2">
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                      {scan.rating || '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
