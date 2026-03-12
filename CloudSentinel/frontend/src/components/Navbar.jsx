import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Shield, LayoutDashboard, Search, Clock, Home, ShieldAlert, Wrench, Lock, Bot, Menu, X, LogOut, Crosshair } from 'lucide-react'

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scan', icon: Search, label: 'Scan' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/issues', icon: ShieldAlert, label: 'Issues' },
  { to: '/fix-suggestions', icon: Wrench, label: 'Fixes' },
  { to: '/secure-config', icon: Lock, label: 'Secure Config' },
  { to: '/advisor', icon: Bot, label: 'Advisor' },
  { to: '/threat-intel', icon: Crosshair, label: 'Threat Intel' },
]

export default function Navbar({ onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
      style={{ background: 'rgba(5,13,26,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a2d4a' }}>
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 group flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
          <Shield size={16} className="text-white" />
        </div>
        <span className="font-bold text-white tracking-tight">
          Cloud<span style={{ color: '#0ea5e9' }}>Sentinel</span>
        </span>
      </NavLink>

      {/* Desktop Links */}
      <div className="hidden lg:flex items-center gap-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isActive
                ? 'text-sky-400 bg-sky-400/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'}`
            }>
            <Icon size={13} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button className="lg:hidden p-2 text-slate-400 hover:text-white"
        onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Status + Logout */}
      <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          API Connected
        </div>
        {onLogout && (
          <button onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Sign Out">
            <LogOut size={13} />
            Logout
          </button>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 py-2 px-4 lg:hidden"
          style={{ background: 'rgba(5,13,26,0.98)', borderBottom: '1px solid #1a2d4a' }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                  ? 'text-sky-400 bg-sky-400/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`
              }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {onLogout && (
            <button onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all mt-2"
              style={{ borderTop: '1px solid #1a2d4a' }}>
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  )
}

