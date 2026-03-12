import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'
import { signupReq } from '../api'

export default function Signup() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!username.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Please fill in all fields.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            await signupReq({ username, email, password })
            setSuccess(true)
            setTimeout(() => {
                navigate('/login', { replace: true })
            }, 2000)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create account.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: '#050d1a' }}>

            <div className="fixed inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#1a2d4a 1px,transparent 1px),linear-gradient(90deg,#1a2d4a 1px,transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', filter: 'blur(80px)' }} />

            <div className="relative w-full max-w-md animate-fade-in">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow"
                        style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                        <Shield size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Cloud<span style={{ color: '#0ea5e9' }}>Sentinel</span>
                    </h1>
                    <p className="text-slate-400 mt-2">Create your account</p>
                </div>

                <div className="rounded-2xl p-8"
                    style={{ background: '#0a1628', border: '1px solid #1a2d4a', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>

                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                                <Shield size={32} style={{ color: '#22c55e' }} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
                            <p className="text-sm text-slate-400">Redirecting to login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                                    Username
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="johndoe"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 outline-none transition-all focus:border-sky-500/50"
                                        style={{ background: '#020a14', border: '1px solid #1a2d4a' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 outline-none transition-all focus:border-sky-500/50"
                                        style={{ background: '#020a14', border: '1px solid #1a2d4a' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 outline-none transition-all focus:border-sky-500/50"
                                        style={{ background: '#020a14', border: '1px solid #1a2d4a' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 outline-none transition-all focus:border-sky-500/50"
                                        style={{ background: '#020a14', border: '1px solid #1a2d4a' }}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl text-white font-semibold transition-all disabled:opacity-60 hover:scale-[1.02] hover:shadow-lg"
                                style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', boxShadow: '0 0 30px rgba(14,165,233,0.2)' }}>
                                {loading ? (
                                    <><Loader2 size={18} className="animate-spin" /> Creating Account…</>
                                ) : (
                                    <>Sign Up <ArrowRight size={16} /></>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium">
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
