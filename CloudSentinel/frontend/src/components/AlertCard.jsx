import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink, AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react'

const SEV_CONFIG = {
  CRITICAL: { cls: 'badge-critical', icon: ShieldAlert, border: '#ef444440' },
  HIGH:     { cls: 'badge-high',     icon: AlertTriangle, border: '#f9731640' },
  MEDIUM:   { cls: 'badge-medium',   icon: AlertCircle,  border: '#eab30840' },
  LOW:      { cls: 'badge-low',      icon: Info,         border: '#22c55e40' },
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-all"
      style={{ background: copied ? '#0ea5e920' : '#1a2d4a', color: copied ? '#0ea5e9' : '#94a3b8' }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function AlertCard({ finding, index = 0 }) {
  const [open, setOpen] = useState(index === 0)
  const sev = finding.severity || 'LOW'
  const cfg = SEV_CONFIG[sev] || SEV_CONFIG.LOW
  const Icon = cfg.icon
  const rec = finding.recommendation || {}

  return (
    <div className="rounded-xl overflow-hidden card-hover animate-fade-in"
      style={{ background: '#0a1628', border: `1px solid ${cfg.border}`, animationDelay: `${index * 0.05}s` }}>
      {/* Header */}
      <button className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(!open)}>
        <Icon size={18} style={{ color: sev === 'CRITICAL' ? '#ef4444' : sev === 'HIGH' ? '#f97316' : sev === 'MEDIUM' ? '#eab308' : '#22c55e', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${cfg.cls}`}>{sev}</span>
            <span className="text-xs text-slate-500 font-mono">{finding.id}</span>
          </div>
          <p className="text-sm font-medium text-slate-200 mt-0.5">{finding.title}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />}
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid #1a2d4a' }}>
          {/* Description */}
          <p className="text-sm text-slate-400 pt-3">{finding.description}</p>

          {/* Category */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{finding.category}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{finding.provider?.toUpperCase()} / {finding.service?.toUpperCase()}</span>
          </div>

          {/* Fix Steps */}
          {rec.steps && rec.steps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">Remediation Steps</p>
              <ol className="space-y-1">
                {rec.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-sky-400 font-mono font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Config Example */}
          {rec.config_example && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Config Fix</p>
                <CopyButton text={rec.config_example} />
              </div>
              <pre className="text-xs bg-black/40 border border-slate-700 rounded-lg p-3 overflow-x-auto text-green-400 font-mono">
                {rec.config_example}
              </pre>
            </div>
          )}

          {/* CLI Example */}
          {rec.cli_example && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">CLI Command</p>
                <CopyButton text={rec.cli_example} />
              </div>
              <pre className="text-xs bg-black/40 border border-slate-700 rounded-lg p-3 overflow-x-auto text-yellow-300 font-mono">
                {rec.cli_example}
              </pre>
            </div>
          )}

          {/* Reference */}
          {rec.reference && (
            <a href={rec.reference} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors">
              <ExternalLink size={11} /> AWS Documentation
            </a>
          )}
        </div>
      )}
    </div>
  )
}
