import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Scan from './pages/Scan'
import Results from './pages/Results'
import History from './pages/History'
import Upload from './pages/Upload'
import Issues from './pages/Issues'
import FixSuggestions from './pages/FixSuggestions'
import SecureConfig from './pages/SecureConfig'
import Advisor from './pages/Advisor'
import ThreatIntel from './pages/ThreatIntel'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
  const [authed, setAuthed] = useState(() => {
    // Aggressive clear on reload: Destroy session completely
    sessionStorage.removeItem('cs_auth')
    localStorage.removeItem('cs_auth')
    return false
  })

  const handleLogin = () => setAuthed(true)

  const handleLogout = () => {
    sessionStorage.removeItem('cs_auth')
    setAuthed(false)
  }

  if (!authed) {
    return (
      <div className="min-h-screen" style={{ background: '#050d1a' }}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#050d1a' }}>
      <Navbar onLogout={handleLogout} />
      <div className="pt-16">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/results" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/fix-suggestions" element={<FixSuggestions />} />
        <Route path="/secure-config" element={<SecureConfig />} />
        <Route path="/advisor" element={<Advisor />} />
        <Route path="/threat-intel" element={<ThreatIntel />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </div>
  )
}
