import React, { useEffect, useState, useRef } from 'react'
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react'
import { askAdvisor, getQuickQuestions, getHistory } from '../api'

export default function Advisor() {
    const [messages, setMessages] = useState([
        {
            role: 'advisor',
            topic: 'Welcome',
            text: "Hello! I'm your **AI Security Advisor**. Ask me anything about cloud security, misconfigurations, or best practices.\n\nYou can also click any of the quick questions below to get started.",
        },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [quickQuestions, setQuickQuestions] = useState([])
    const [scanContext, setScanContext] = useState(null)
    const bottomRef = useRef(null)

    useEffect(() => {
        // Load quick questions
        getQuickQuestions()
            .then(r => setQuickQuestions(r.data.questions || []))
            .catch(() => {
                setQuickQuestions([
                    'Why is public bucket access risky?',
                    'How do I fix a wildcard IAM policy?',
                    'What are best practices for cloud storage security?',
                    'How does the risk scoring work?',
                ])
            })

        // Load latest scan for context
        getHistory(1)
            .then(r => {
                const scans = r.data.scans || []
                if (scans.length > 0) setScanContext(scans[0])
            })
            .catch(() => { })
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (question) => {
        if (!question.trim()) return

        const userMsg = { role: 'user', text: question }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await askAdvisor(question, scanContext)
            const data = res.data
            const advisorMsg = {
                role: 'advisor',
                topic: data.topic,
                text: data.response + (data.context_note || ''),
            }
            setMessages(prev => [...prev, advisorMsg])
        } catch {
            setMessages(prev => [...prev, {
                role: 'advisor',
                topic: 'Error',
                text: 'Sorry, I encountered an error. Please make sure the backend is running and try again.',
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        sendMessage(input)
    }

    return (
        <div className="min-h-screen pt-8 px-6 pb-6 flex flex-col">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl"
                            style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">AI Security Advisor</h1>
                            <p className="text-sm text-slate-400">Rule-based security guidance — fully local, no external APIs</p>
                        </div>
                    </div>
                    {scanContext && (
                        <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                            <Sparkles size={12} style={{ color: '#0ea5e9' }} />
                            <span className="text-slate-400">
                                Context loaded from latest scan: <span className="text-sky-400 font-mono">
                                    {scanContext.provider?.toUpperCase()}/{scanContext.service?.toUpperCase()}
                                </span> · Score: <span className="font-mono text-sky-400">{scanContext.score}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'advisor' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1"
                                    style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                                    <Bot size={14} className="text-white" />
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-xl p-4 ${msg.role === 'user'
                                ? 'bg-sky-500/10 border border-sky-500/30'
                                : ''
                                }`}
                                style={msg.role === 'advisor' ? { background: '#0a1628', border: '1px solid #1a2d4a' } : {}}>
                                {msg.topic && msg.role === 'advisor' && (
                                    <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">{msg.topic}</p>
                                )}
                                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line"
                                    dangerouslySetInnerHTML={{
                                        __html: msg.text
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                            .replace(/`(.*?)`/g, '<code class="text-sky-400 bg-black/30 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                                            .replace(/^• /gm, '<span class="text-sky-400 mr-1">•</span>')
                                            .replace(/^(\d+)\. /gm, '<span class="text-sky-400 font-mono mr-1">$1.</span>')
                                    }}
                                />
                            </div>
                            {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 bg-slate-700">
                                    <User size={14} className="text-slate-300" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 animate-fade-in">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                                <Bot size={14} className="text-white" />
                            </div>
                            <div className="rounded-xl p-4" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Loader2 size={14} className="animate-spin" />
                                    Thinking…
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Quick Questions */}
                {messages.length <= 1 && quickQuestions.length > 0 && (
                    <div className="mb-4 animate-fade-in">
                        <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickQuestions.map((q, i) => (
                                <button key={i} onClick={() => sendMessage(q)}
                                    disabled={loading}
                                    className="text-xs px-3 py-1.5 rounded-lg transition-all hover:border-sky-400/50 hover:text-white disabled:opacity-50"
                                    style={{ background: '#0a1628', border: '1px solid #1a2d4a', color: '#94a3b8' }}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Ask about cloud security, misconfigurations, best practices…"
                        className="flex-1 px-4 py-3 rounded-xl text-sm text-slate-200 outline-none transition-all focus:border-sky-400/50 disabled:opacity-50"
                        style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}
                    />
                    <button type="submit" disabled={loading || !input.trim()}
                        className="px-4 py-3 rounded-xl text-white font-medium transition-all hover:scale-105 disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    )
}
