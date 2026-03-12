import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Loader2, Copy, Check, ArrowRight, RefreshCw } from 'lucide-react'
import { getHistory, generateSecureConfig } from '../api'

// Rebuild stripped keys from findings so the secure generator can fix them
function rebuildFullConfig(configSummary, findings) {
    const cfg = { ...configSummary }

    for (const f of findings) {
        // S3-006: wildcard bucket policy was stripped from config_summary
        if (f.id === 'S3-006' && !cfg.policy) {
            cfg.policy = {
                Version: '2012-10-17',
                Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:*', Resource: '*' }],
            }
        }
        // IAM-001: policy_document was stripped from config_summary
        if (f.id === 'IAM-001' && !cfg.policy_document) {
            cfg.policy_document = {
                Version: '2012-10-17',
                Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }],
            }
        }
        // GCP-001: iam_bindings was stripped from config_summary
        if (f.id === 'GCP-001' && !cfg.iam_bindings) {
            cfg.iam_bindings = [
                { role: 'roles/storage.objectViewer', members: ['allUsers'] },
            ]
        }
    }

    return cfg
}

export default function SecureConfig() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [copiedOriginal, setCopiedOriginal] = useState(false)
    const [copiedSecure, setCopiedSecure] = useState(false)

    useEffect(() => {
        loadAndGenerate()
    }, [])

    const loadAndGenerate = async () => {
        setLoading(true)
        setError('')
        try {
            const histRes = await getHistory(1)
            const scans = histRes.data.scans || []
            if (scans.length === 0) {
                setError('No scans found. Run a scan first to generate a secure configuration.')
                setLoading(false)
                return
            }
            const scan = scans[0]
            const configSummary = scan.config_summary || {}
            const findings = scan.findings || []

            if (findings.length === 0) {
                setResult({
                    original_config: configSummary,
                    secure_config: configSummary,
                    changes: [],
                    total_changes: 0,
                })
                setLoading(false)
                return
            }

            // Rebuild full config with stripped keys so generator can fix everything
            const fullConfig = rebuildFullConfig(configSummary, findings)

            setGenerating(true)
            const genRes = await generateSecureConfig(fullConfig, findings)
            setResult(genRes.data)
        } catch (e) {
            setError('Failed to generate secure configuration. Ensure the backend is running.')
        } finally {
            setLoading(false)
            setGenerating(false)
        }
    }

    const copyConfig = (text, setter) => {
        navigator.clipboard.writeText(JSON.stringify(text, null, 2)).then(() => {
            setter(true)
            setTimeout(() => setter(false), 2000)
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-8 gap-3">
                <Loader2 size={32} className="animate-spin text-sky-400" />
                {generating && <p className="text-sm text-slate-400">Generating secure configuration…</p>}
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-8 px-6 pb-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Secure Configuration Generator</h1>
                        <p className="text-slate-400">
                            {result ? `${result.total_changes} fix${result.total_changes !== 1 ? 'es' : ''} applied automatically` : 'Auto-fix your cloud configuration'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadAndGenerate}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                            style={{ border: '1px solid #1a2d4a' }}>
                            <RefreshCw size={14} /> Regenerate
                        </button>
                        <button onClick={() => navigate('/advisor')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                            style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
                            AI Advisor <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-center py-20 animate-fade-in">
                        <Lock size={48} className="mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400 mb-4">{error}</p>
                        <button onClick={() => navigate('/scan')}
                            className="px-6 py-2 rounded-xl text-white text-sm font-medium"
                            style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                            Run a Scan
                        </button>
                    </div>
                )}

                {result && (
                    <>
                        {/* Changes Summary */}
                        {result.changes.length > 0 && (
                            <div className="rounded-xl p-5 mb-6 animate-fade-in"
                                style={{ background: '#0a1628', border: '1px solid rgba(34,197,94,0.3)' }}>
                                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Changes Applied</p>
                                <ul className="space-y-2">
                                    {result.changes.map((change, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.changes.length === 0 && (
                            <div className="rounded-xl p-8 mb-6 text-center animate-fade-in"
                                style={{ background: '#0a1628', border: '1px solid rgba(34,197,94,0.3)' }}>
                                <Check size={40} className="mx-auto mb-3" style={{ color: '#22c55e' }} />
                                <p className="text-white font-semibold">Configuration is already secure!</p>
                                <p className="text-sm text-slate-400 mt-1">No changes needed.</p>
                            </div>
                        )}

                        {/* Side-by-side comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                            {/* Original */}
                            <div className="rounded-xl overflow-hidden"
                                style={{ background: '#0a1628', border: '1px solid rgba(239,68,68,0.3)' }}>
                                <div className="flex items-center justify-between px-5 py-3"
                                    style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
                                    <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Original Configuration</span>
                                    <button onClick={() => copyConfig(result.original_config, setCopiedOriginal)}
                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-all"
                                        style={{ background: copiedOriginal ? '#0ea5e920' : '#1a2d4a', color: copiedOriginal ? '#0ea5e9' : '#94a3b8' }}>
                                        {copiedOriginal ? <Check size={12} /> : <Copy size={12} />}
                                        {copiedOriginal ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="p-5 text-xs font-mono text-red-300 overflow-x-auto max-h-[500px] overflow-y-auto">
                                    {JSON.stringify(result.original_config, null, 2)}
                                </pre>
                            </div>

                            {/* Secure */}
                            <div className="rounded-xl overflow-hidden"
                                style={{ background: '#0a1628', border: '1px solid rgba(34,197,94,0.3)' }}>
                                <div className="flex items-center justify-between px-5 py-3"
                                    style={{ background: 'rgba(34,197,94,0.1)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
                                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Secure Configuration</span>
                                    <button onClick={() => copyConfig(result.secure_config, setCopiedSecure)}
                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-all"
                                        style={{ background: copiedSecure ? '#0ea5e920' : '#1a2d4a', color: copiedSecure ? '#0ea5e9' : '#94a3b8' }}>
                                        {copiedSecure ? <Check size={12} /> : <Copy size={12} />}
                                        {copiedSecure ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="p-5 text-xs font-mono text-green-400 overflow-x-auto max-h-[500px] overflow-y-auto">
                                    {JSON.stringify(result.secure_config, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
