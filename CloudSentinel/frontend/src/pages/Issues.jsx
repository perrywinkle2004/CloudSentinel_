import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldAlert, Loader2, Search, ArrowRight } from 'lucide-react'
import { getIssues } from '../api'
import IssueCard from '../components/IssueCard'
import RiskMeter from '../components/RiskMeter'

const SEV_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const SEV_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

export default function Issues() {
    const navigate = useNavigate()
    const location = useLocation()
    const passedIssues = location.state?.issues
    const passedScore = location.state?.score

    const [issues, setIssues] = useState(passedIssues || [])
    const [score, setScore] = useState(passedScore || null)
    const [counts, setCounts] = useState({})
    const [loading, setLoading] = useState(!passedIssues)

    useEffect(() => {
        if (!passedIssues) {
            getIssues()
                .then(r => {
                    setIssues(r.data.issues || [])
                    setScore(r.data.score)
                    setCounts(r.data.counts || {})
                })
                .catch(() => { })
                .finally(() => setLoading(false))
        } else {
            // Compute counts from passed issues
            const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
            passedIssues.forEach(i => { c[i.severity] = (c[i.severity] || 0) + 1 })
            setCounts(c)
        }
    }, [passedIssues])

    // Group by severity
    const grouped = {}
    SEV_ORDER.forEach(sev => { grouped[sev] = [] })
    issues.forEach(issue => {
        const sev = issue.severity || 'LOW'
        if (!grouped[sev]) grouped[sev] = []
        grouped[sev].push(issue)
    })

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-8">
                <Loader2 size={32} className="animate-spin text-sky-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-8 px-6 pb-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Security Issues Detected</h1>
                        <p className="text-slate-400">
                            {issues.length} issue{issues.length !== 1 ? 's' : ''} found across your scanned configuration
                        </p>
                    </div>
                    <button onClick={() => navigate('/fix-suggestions')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                        style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
                        View Fixes <ArrowRight size={14} />
                    </button>
                </div>

                {issues.length === 0 ? (
                    <div className="text-center py-20 animate-fade-in">
                        <ShieldAlert size={48} className="mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400 mb-4">No security issues found. Run a scan first.</p>
                        <button onClick={() => navigate('/upload')}
                            className="px-6 py-2 rounded-xl text-white text-sm font-medium"
                            style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                            Upload Configuration
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Summary Row */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-fade-in">
                            {score !== null && (
                                <div className="flex flex-col items-center p-4 rounded-xl"
                                    style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
                                    <RiskMeter score={score} size={80} />
                                </div>
                            )}
                            {SEV_ORDER.map(sev => (
                                <div key={sev} className="p-4 rounded-xl text-center"
                                    style={{ background: '#0a1628', border: `1px solid ${SEV_COLORS[sev]}30` }}>
                                    <div className="text-3xl font-bold font-mono" style={{ color: SEV_COLORS[sev] }}>
                                        {counts[sev] || 0}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1 capitalize">{sev.toLowerCase()}</div>
                                </div>
                            ))}
                        </div>

                        {/* Grouped Issues */}
                        {SEV_ORDER.map(sev => {
                            const items = grouped[sev]
                            if (!items || items.length === 0) return null
                            return (
                                <div key={sev} className="mb-8 animate-fade-in">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full" style={{ background: SEV_COLORS[sev] }} />
                                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                                            {sev}
                                        </h2>
                                        <span className="text-sm text-slate-500">({items.length})</span>
                                    </div>
                                    <div className="space-y-3">
                                        {items.map((issue, i) => (
                                            <IssueCard key={issue.id || i} issue={issue} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </>
                )}
            </div>
        </div>
    )
}
