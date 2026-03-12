import React from 'react'
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react'

const SEV_CONFIG = {
    CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: ShieldAlert },
    HIGH: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', icon: AlertTriangle },
    MEDIUM: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', icon: AlertCircle },
    LOW: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', icon: Info },
}

export default function IssueCard({ issue, index = 0 }) {
    const sev = issue.severity || 'LOW'
    const cfg = SEV_CONFIG[sev] || SEV_CONFIG.LOW
    const Icon = cfg.icon

    return (
        <div className="rounded-xl p-5 card-hover animate-fade-in"
            style={{
                background: '#0a1628',
                border: `1px solid ${cfg.border}`,
                animationDelay: `${index * 0.06}s`,
            }}>
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: cfg.bg }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {sev}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{issue.id}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{issue.title}</h3>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">{issue.description}</p>

            {/* Details */}
            <div className="flex flex-wrap gap-2">
                {issue.category && (
                    <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono">
                        {issue.category}
                    </span>
                )}
                {issue.resource && (
                    <span className="text-xs px-2 py-1 rounded text-slate-400 font-mono"
                        style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                        Resource: {issue.resource}
                    </span>
                )}
                {issue.provider && issue.service && (
                    <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono uppercase">
                        {issue.provider} / {issue.service}
                    </span>
                )}
            </div>
        </div>
    )
}
