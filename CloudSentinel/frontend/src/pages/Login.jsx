import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { loginReq } from '../api'

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.')
            return
        }

        setLoading(true)
        try {
            if (email === 'admin@cloudsentinel.io' && password === 'admin123') {
                // Preserve the original demo flow seamlessly
                await new Promise(r => setTimeout(r, 1000))
            } else {
                await loginReq({ email, password })
            }

            // Store auth state
            sessionStorage.setItem('cs_auth', JSON.stringify({ email, loggedIn: true }))
            onLogin()
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid email or password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: '#050d1a' }}>

            {/* Background effects */}
            <div className="fixed inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#1a2d4a 1px,transparent 1px),linear-gradient(90deg,#1a2d4a 1px,transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', filter: 'blur(80px)' }} />

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow"
                        style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                        <Shield size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Cloud<span style={{ color: '#0ea5e9' }}>Sentinel</span>
                    </h1>
                    <p className="text-slate-400 mt-2">Cloud Security Posture Scanner</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-8"
                    style={{ background: '#0a1628', border: '1px solid #1a2d4a', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
                    <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
                    <p className="text-sm text-slate-400 mb-6">Sign in to your account to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-200 outline-none transition-all focus:border-sky-500/50"
                                    style={{ background: '#020a14', border: '1px solid #1a2d4a' }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-slate-200 outline-none transition-all focus:border-sky-500/50"
                                    style={{ background: '#020a14', border: '1px solid #1a2d4a' }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember + Forgot */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-600 accent-sky-500" />
                                Remember me
                            </label>
                            <span className="text-sky-400 hover:text-sky-300 cursor-pointer transition-colors text-xs">
                                Forgot password?
                            </span>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-60 hover:scale-[1.02] hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', boxShadow: '0 0 30px rgba(14,165,233,0.2)' }}>
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Signing in…</>
                            ) : (
                                <>Sign In <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px" style={{ background: '#1a2d4a' }} />
                        <span className="text-xs text-slate-500">or</span>
                        <div className="flex-1 h-px" style={{ background: '#1a2d4a' }} />
                    </div>

                    {/* Demo login */}
                    <button type="button"
                        onClick={() => { setEmail('admin@cloudsentinel.io'); setPassword('admin123') }}
                        className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all hover:bg-white/5"
                        style={{ border: '1px solid #1a2d4a' }}>
                        Use Demo Credentials
                    </button>

                    <div className="mt-6 text-center text-sm text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-sky-400 hover:text-sky-300 font-medium">
                            Sign Up
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-600 mt-6">
                    Educational Security Prototype · Fully Local · No Real Credentials Required
                </p>
            </div>
        </div>
    )
}
