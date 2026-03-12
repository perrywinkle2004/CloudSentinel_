import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Search, BarChart3, Zap, Lock, Eye, ChevronRight } from 'lucide-react'

const features = [
  { icon: Search, title: 'Config Scanner', desc: 'Upload JSON/YAML cloud configs and detect misconfigurations instantly.' },
  { icon: Shield, title: 'Rule Engine', desc: '20+ security rules covering AWS, Azure, and GCP services.' },
  { icon: BarChart3, title: 'Risk Scoring', desc: 'Quantified risk score with severity-weighted penalty calculation.' },
  { icon: Zap, title: 'Instant Remediation', desc: 'Copy-paste fix configs and CLI commands for every finding.' },
  { icon: Lock, title: 'Simulation Mode', desc: 'Test scenarios without real cloud credentials — fully local.' },
  { icon: Eye, title: 'Scan History', desc: 'Track posture over time with persistent scan history.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: '#050d1a' }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#1a2d4a 1px,transparent 1px),linear-gradient(90deg,#1a2d4a 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium mb-6"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Educational Security Prototype · Fully Local · No Real Credentials
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 leading-tight">
            Cloud<span style={{ color: '#0ea5e9' }}>Sentinel</span>
          </h1>
          <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto">
            Cloud Security Posture & Misconfiguration Scanner
          </p>
          <p className="text-slate-500 mb-10 max-w-xl mx-auto">
            Scan cloud configuration files, detect security misconfigurations, calculate risk scores,
            and get actionable remediation guidance — all running locally.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/scan')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', boxShadow: '0 0 30px rgba(14,165,233,0.3)' }}>
              <Search size={18} /> Start Scanning
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/10"
              style={{ border: '1px solid #1a2d4a', color: '#94a3b8' }}>
              <BarChart3 size={18} /> View Dashboard <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="p-5 rounded-xl card-hover animate-fade-in"
              style={{ background: '#0a1628', border: '1px solid #1a2d4a', animationDelay: `${i * 0.1}s` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: 'rgba(14,165,233,0.1)' }}>
                <Icon size={20} style={{ color: '#0ea5e9' }} />
              </div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            { label: 'Security Rules', value: '20+' },
            { label: 'Cloud Providers', value: '3' },
            { label: 'Severity Levels', value: '4' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-6 rounded-xl"
              style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
              <div className="text-3xl font-bold font-mono" style={{ color: '#0ea5e9' }}>{value}</div>
              <div className="text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
