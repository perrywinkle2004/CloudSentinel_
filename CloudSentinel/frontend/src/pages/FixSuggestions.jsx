import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Loader2, Copy, Check, ExternalLink, ChevronDown, ChevronUp, ShieldAlert, ArrowRight } from 'lucide-react'
import { getFixSuggestions } from '../api'

const SEV_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

function CopyBtn({ text }) {
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

function FixCard({ suggestion, index }) {
    const [open, setOpen] = useState(index === 0)
    const sev = suggestion.severity || 'LOW'
    const color = SEV_COLORS[sev] || '#94a3b8'

    return (
        <div className="rounded-xl overflow-hidden card-hover animate-fade-in"
            style={{ background: '#0a1628', border: `1px solid ${color}40`, animationDelay: `${index * 0.06}s` }}>
            {/* Header */}
            <button className="w-full flex items-center gap-3 p-5 text-left" onClick={() => setOpen(!open)}>
                <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
                    <Wrench size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                            style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>
                            {sev}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{suggestion.id}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{suggestion.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{suggestion.fix_title}</p>
                </div>
                {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>

            {/* Body */}
            {open && (
                <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #1a2d4a' }}>
                    {/* Steps */}
                    {suggestion.steps?.length > 0 && (
                        <div className="pt-4">
                            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-3">Recommended Fix Steps</p>
                            <ol className="space-y-2">
                                {suggestion.steps.map((step, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                                        <span className="text-sky-400 font-mono font-bold flex-shrink-0">{i + 1}.</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Config Example */}
                    {suggestion.config_example && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Configuration Example</p>
                                <CopyBtn text={suggestion.config_example} />
                            </div>
                            <pre className="text-xs bg-black/40 border border-slate-700 rounded-lg p-4 overflow-x-auto text-green-400 font-mono">
                                {suggestion.config_example}
                            </pre>
                        </div>
                    )}

                    {/* CLI Command */}
                    {suggestion.cli_example && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">CLI Command</p>
                                <CopyBtn text={suggestion.cli_example} />
                            </div>
                            <pre className="text-xs bg-black/40 border border-slate-700 rounded-lg p-4 overflow-x-auto text-yellow-300 font-mono">
                                {suggestion.cli_example}
                            </pre>
                        </div>
                    )}

                    {/* Reference */}
                    {suggestion.reference && (
                        <a href={suggestion.reference} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                            <ExternalLink size={11} /> Documentation Reference
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}

export default function FixSuggestions() {
    const navigate = useNavigate()
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [score, setScore] = useState(null)

    useEffect(() => {
        getFixSuggestions()
            .then(r => {
                setSuggestions(r.data.suggestions || [])
                setScore(r.data.score)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-8">
                <Loader2 size={32} className="animate-spin text-sky-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-8 px-6 pb-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Fix Suggestions</h1>
                        <p className="text-slate-400">
                            {suggestions.length} remediation suggestion{suggestions.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                    <button onClick={() => navigate('/secure-config')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                        style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
                        Auto-Fix Config <ArrowRight size={14} />
                    </button>
                </div>

                {suggestions.length === 0 ? (
                    <div className="text-center py-20 animate-fade-in">
                        <Wrench size={48} className="mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400 mb-4">No fix suggestions available. Run a scan first.</p>
                        <button onClick={() => navigate('/upload')}
                            className="px-6 py-2 rounded-xl text-white text-sm font-medium"
                            style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                            Upload Configuration
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {suggestions.map((s, i) => (
                            <FixCard key={s.id || i} suggestion={s} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
