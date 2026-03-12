import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileCode, Clipboard, Loader2, Shield, Lock, CheckCircle2 } from 'lucide-react'
import UploadBox from '../components/UploadBox'
import { scanUpload } from '../api'

const TABS = [
    { id: 'dragdrop', label: 'Drag & Drop', icon: Upload },
    { id: 'browse', label: 'Browse Files', icon: FileCode },
    { id: 'paste', label: 'Paste Config', icon: Clipboard },
]

const SCAN_STAGES = [
    { label: 'Scanning configuration', icon: Shield },
    { label: 'Analyzing permissions', icon: Lock },
    { label: 'Evaluating security rules', icon: CheckCircle2 },
]

export default function UploadPage() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('dragdrop')
    const [file, setFile] = useState(null)
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [stage, setStage] = useState(0)
    const [error, setError] = useState('')

    const runScan = async () => {
        setError('')

        const fd = new FormData()
        if ((tab === 'dragdrop' || tab === 'browse') && file) {
            fd.append('file', file)
        } else if (tab === 'paste' && text.trim()) {
            fd.append('text', text)
        } else {
            setError('Please provide a configuration file or paste configuration text.')
            return
        }

        setLoading(true)
        setStage(0)

        // Animate through scan stages
        const stageTimer1 = setTimeout(() => setStage(1), 1200)
        const stageTimer2 = setTimeout(() => setStage(2), 2400)

        try {
            const result = await scanUpload(fd)
            clearTimeout(stageTimer1)
            clearTimeout(stageTimer2)
            navigate('/results', { state: { result: result.data } })
        } catch (e) {
            clearTimeout(stageTimer1)
            clearTimeout(stageTimer2)
            setError(e?.response?.data?.detail || 'Scan failed. Ensure the backend is running on port 8000.')
        } finally {
            setLoading(false)
        }
    }

    const handleBrowse = (e) => {
        const selected = e.target.files?.[0]
        if (selected) { setFile(selected); setError('') }
    }

    return (
        <div className="min-h-screen pt-8 px-6 pb-12">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-white mb-2">Configuration Upload</h1>
                    <p className="text-slate-400">
                        Upload your cloud configuration file to scan for security misconfigurations.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl mb-6"
                    style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => { setTab(id); setError('') }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${tab === id ? 'text-sky-400' : 'text-slate-400 hover:text-white'
                                }`}
                            style={tab === id ? { background: 'rgba(14,165,233,0.15)' } : {}}>
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content Panel */}
                <div className="rounded-xl p-6 animate-fade-in"
                    style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>

                    {/* Drag & Drop */}
                    {tab === 'dragdrop' && (
                        <UploadBox file={file} onFileSelect={(f) => { setFile(f); setError('') }}
                            onClear={() => setFile(null)} />
                    )}

                    {/* Browse Files */}
                    {tab === 'browse' && (
                        <div className="text-center py-6">
                            <label className="cursor-pointer inline-flex flex-col items-center gap-4">
                                <div className="p-6 rounded-xl transition-all hover:border-sky-400/50"
                                    style={{ border: '2px dashed #1a2d4a' }}>
                                    <FileCode size={48} className="mx-auto mb-3" style={{ color: '#475569' }} />
                                    <p className="text-slate-300 font-medium">Click to select a file</p>
                                    <p className="text-sm text-slate-500 mt-1">JSON, YAML, or TXT</p>
                                </div>
                                <input type="file" className="hidden" accept=".json,.yaml,.yml,.txt"
                                    onChange={handleBrowse} />
                            </label>
                            {file && (
                                <div className="mt-4 flex items-center justify-center gap-3 p-3 rounded-lg mx-auto max-w-sm"
                                    style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)' }}>
                                    <FileCode size={16} style={{ color: '#0ea5e9' }} />
                                    <span className="text-sm text-slate-200 truncate">{file.name}</span>
                                    <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Paste Config */}
                    {tab === 'paste' && (
                        <div>
                            <label className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-2">
                                Paste JSON or YAML Configuration
                            </label>
                            <textarea value={text} onChange={e => setText(e.target.value)} rows={16}
                                className="w-full font-mono text-xs text-green-400 rounded-lg p-4 outline-none resize-none"
                                style={{ background: '#020a14', border: '1px solid #1a2d4a' }}
                                placeholder={'{\n  "provider": "aws",\n  "service": "s3",\n  "acl": "public-read-write",\n  "encryption": { "enabled": false },\n  "versioning": false\n}'} />
                        </div>
                    )}
                </div>

                {/* Scanning Animation */}
                {loading && (
                    <div className="mt-6 rounded-xl p-6 animate-fade-in"
                        style={{ background: '#0a1628', border: '1px solid rgba(14,165,233,0.3)' }}>
                        <div className="space-y-4">
                            {SCAN_STAGES.map(({ label, icon: Icon }, i) => (
                                <div key={label}
                                    className={`flex items-center gap-3 transition-all duration-500 ${i <= stage ? 'opacity-100' : 'opacity-30'
                                        }`}>
                                    {i < stage ? (
                                        <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                                    ) : i === stage ? (
                                        <Loader2 size={20} className="animate-spin" style={{ color: '#0ea5e9' }} />
                                    ) : (
                                        <Icon size={20} className="text-slate-600" />
                                    )}
                                    <span className={`text-sm font-medium ${i <= stage ? 'text-white' : 'text-slate-600'
                                        }`}>{label}</span>
                                    {i < stage && (
                                        <span className="text-xs text-green-400 ml-auto">Complete</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 flex items-center gap-2 p-3 rounded-lg text-sm"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                        {error}
                    </div>
                )}

                {/* Run Button */}
                {!loading && (
                    <button onClick={runScan}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-lg transition-all hover:scale-[1.02] hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', boxShadow: '0 0 30px rgba(14,165,233,0.2)' }}>
                        <Shield size={20} /> Scan Configuration
                    </button>
                )}
            </div>
        </div>
    )
}
