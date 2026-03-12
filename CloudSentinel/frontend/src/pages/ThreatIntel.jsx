import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getThreatIntel } from '../api'
import {
  Crosshair, AlertTriangle, ArrowLeft, Shield, Search, Loader2,
  FileWarning, FolderOpen, ChevronRight, Terminal, Clock, Eye,
  Zap, Target, Database, Lock
} from 'lucide-react'

const SEV_COLOR = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e',
  secure: '#22c55e', alert: '#ef4444', CRITICAL: '#ef4444', HIGH: '#f97316',
  MEDIUM: '#eab308', LOW: '#22c55e', NONE: '#64748b',
}

const CARD = { background: '#0a1628', border: '1px solid #1a2d4a' }

export default function ThreatIntel() {
  const location = useLocation()
  const navigate = useNavigate()
  const [scanResult, setScanResult] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load scan data: 1) location.state  2) localStorage  3) null
  useEffect(() => {
    const stateResult = location.state?.result || location.state
    if (stateResult) {
      setScanResult(stateResult)
      localStorage.setItem('latestScanResult', JSON.stringify(stateResult))
    } else {
      const saved = localStorage.getItem('latestScanResult')
      if (saved) {
        try { setScanResult(JSON.parse(saved)) } catch { /* ignore */ }
      }
    }
  }, [])

  // Fetch threat intel once scanResult is available
  useEffect(() => {
    if (!scanResult) { setLoading(false); return }
    setLoading(true)
    getThreatIntel(scanResult)
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => { setError('Threat intelligence analysis failed.'); setLoading(false) })
  }, [scanResult])

  if (!scanResult && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-8">
        <p className="text-slate-400 mb-4">No scan results to analyze.</p>
        <button onClick={() => navigate('/scan')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sky-400 hover:bg-sky-400/10 transition-colors">
          <Search size={16} /> Run a Scan
        </button>
      </div>
    )
  }

  if (loading || (scanResult && !data && !error)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-8">
        <Loader2 size={32} className="animate-spin text-sky-400 mb-4" />
        <p className="text-slate-400">Running threat intelligence analysis…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-8">
        <AlertTriangle size={32} className="text-red-400 mb-4" />
        <p className="text-slate-400">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { attack_simulation, attack_path, exposure_prediction, security_timeline, attacker_view } = data

  return (
    <div className="min-h-screen pt-8 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Results
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}>
              <Crosshair size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Threat Intelligence</h1>
              <p className="text-slate-400 text-sm">
                {scanResult.provider?.toUpperCase()} / {scanResult.service?.toUpperCase()}
                {scanResult.scenario && <span> · {scanResult.scenario}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ─── 1. ATTACK SIMULATION ─── */}
        <Section icon={Zap} title="Attack Simulation Engine" color="#ef4444"
          subtitle="Simulated attacker actions based on detected misconfigurations">
          {attack_simulation.length === 0 ? (
            <AllClear text="No exploitable findings detected." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attack_simulation.map((sim, i) => (
                <div key={i} className="rounded-xl p-5" style={CARD}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: SEV_COLOR[sim.severity] }} />
                    <h3 className="text-white font-semibold text-sm">{sim.finding}</h3>
                    <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: `${SEV_COLOR[sim.severity]}20`, color: SEV_COLOR[sim.severity] }}>
                      {sim.severity}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">Attacker Actions</p>
                  <ul className="space-y-1.5 mb-4">
                    {sim.actions.map((a, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                        <ChevronRight size={12} className="mt-0.5 text-red-400 flex-shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  {sim.mock_files.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Exposed Files (Mock)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sim.mock_files.map((f, j) => (
                          <span key={j} className="text-xs px-2 py-1 rounded-md text-orange-300"
                            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 2. ATTACK PATH VISUALIZER ─── */}
        <Section icon={Target} title="Attack Path Visualizer" color="#f97316"
          subtitle="Simulated escalation chain showing attacker progression">
          <div className="rounded-xl p-6" style={CARD}>
            <div className="relative">
              {attack_path.map((node, i) => (
                <div key={i} className="flex items-start gap-4 mb-0 last:mb-0">
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: SEV_COLOR[node.risk] || '#64748b', boxShadow: `0 0 12px ${SEV_COLOR[node.risk] || '#64748b'}40` }}>
                      {i + 1}
                    </div>
                    {i < attack_path.length - 1 && (
                      <div className="w-0.5 h-10" style={{ background: 'linear-gradient(to bottom, #1a2d4a, #0a1628)' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-6">
                    <h4 className="text-white font-semibold text-sm">{node.step}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{node.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── 3. EXPOSURE PREDICTION ─── */}
        <Section icon={Database} title="Exposure Prediction" color="#eab308"
          subtitle="Predicted sensitive data categories based on resource metadata">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {exposure_prediction.map((item, i) => (
              <div key={i} className="rounded-xl p-4 text-center group hover:scale-[1.03] transition-transform"
                style={CARD}>
                <FileWarning size={24} className="mx-auto mb-2" style={{ color: '#eab308' }} />
                <p className="text-sm text-white font-medium">{item}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── 4. SECURITY DRIFT TIMELINE ─── */}
        <Section icon={Clock} title="Security Drift Timeline" color="#6366f1"
          subtitle="Simulated timeline of how misconfigurations may have evolved">
          <div className="rounded-xl p-6" style={CARD}>
            {/* Horizontal timeline */}
            <div className="overflow-x-auto">
              <div className="flex items-start gap-0 min-w-max">
                {security_timeline.map((evt, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ minWidth: 180 }}>
                    {/* Connector + dot */}
                    <div className="flex items-center w-full">
                      {i > 0 && <div className="flex-1 h-0.5" style={{ background: '#1a2d4a' }} />}
                      <div className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{
                          background: SEV_COLOR[evt.severity] || '#64748b',
                          boxShadow: `0 0 10px ${SEV_COLOR[evt.severity] || '#64748b'}50`,
                        }} />
                      {i < security_timeline.length - 1 && <div className="flex-1 h-0.5" style={{ background: '#1a2d4a' }} />}
                    </div>
                    {/* Label */}
                    <div className="mt-3 text-center px-2">
                      <span className="text-xs font-bold font-mono block mb-1"
                        style={{ color: SEV_COLOR[evt.severity] || '#64748b' }}>
                        Day {evt.day}
                      </span>
                      <p className="text-xs text-slate-300 leading-tight" style={{ maxWidth: 160 }}>
                        {evt.event}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 5. ATTACKER VIEW SIMULATION ─── */}
        <Section icon={Eye} title="Attacker View Simulation" color="#ef4444"
          subtitle="Simulated filesystem listing an attacker would see">
          <div className="rounded-xl overflow-hidden" style={CARD}>
            {/* Terminal header */}
            <div className="px-4 py-2.5 flex items-center gap-2"
              style={{ background: '#050d1a', borderBottom: '1px solid #1a2d4a' }}>
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-slate-500 ml-2 font-mono">
                attacker@kali ~ $ ls /{attacker_view.resource_name}/
              </span>
            </div>
            {/* Terminal body */}
            <div className="p-4 font-mono text-xs" style={{ background: '#020a14' }}>
              <div className="mb-3 flex items-center gap-4 text-slate-500">
                <span>Provider: <span className="text-sky-400">{attacker_view.provider}</span></span>
                <span>Access: <span className="text-red-400">{attacker_view.access_level}</span></span>
                <span>Sensitive: <span className="text-orange-400">{attacker_view.total_sensitive} files</span></span>
              </div>
              <div className="space-y-1">
                {attacker_view.files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {file.type === 'directory' ? (
                      <FolderOpen size={14} className="text-sky-400 flex-shrink-0" />
                    ) : (
                      <Terminal size={14} className={`flex-shrink-0 ${file.sensitive ? 'text-red-400' : 'text-slate-500'}`} />
                    )}
                    <span className={file.sensitive ? 'text-red-300' : 'text-slate-400'}>
                      {file.name}
                    </span>
                    <span className="text-slate-600 ml-auto">{file.size}</span>
                    {file.sensitive && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 ml-2">
                        SENSITIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

      </div>
    </div>
  )
}


/* ─── Reusable section wrapper ─── */
function Section({ icon: Icon, title, subtitle, color, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function AllClear({ text }) {
  return (
    <div className="rounded-xl p-8 flex flex-col items-center justify-center" style={CARD}>
      <Shield size={40} className="text-green-400 mb-3" />
      <p className="text-white font-semibold">All Clear</p>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}
