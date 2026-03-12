import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ShieldAlert, X } from 'lucide-react'

// Track seen findings signatures across component mounts/renders to prevent repetitions
const seenFindings = new Set()

export default function SecurityAlertModal({ findings }) {
  const navigate = useNavigate()
  const [alertsQueue, setAlertsQueue] = useState([])
  const [currentAlert, setCurrentAlert] = useState(null)

  useEffect(() => {
    if (!findings || findings.length === 0) return

    // Create a signature to uniquely identify this set of findings for the session
    const sig = JSON.stringify(findings)
    if (seenFindings.has(sig)) return
    seenFindings.add(sig)

    const gen001 = findings.find(f => f.id === 'GEN-001' || f.rule_id === 'GEN-001')
    const gen002 = findings.find(f => f.id === 'GEN-002' || f.rule_id === 'GEN-002')

    const newQueue = []
    
    if (gen001) {
      newQueue.push({
        id: 'GEN-001',
        title: '⚠ Critical Security Risk Detected',
        subtitle: 'Public Storage Access Enabled',
        description: 'This storage configuration allows public access.\nSensitive data may be exposed to anonymous internet users.',
        severity: 'CRITICAL'
      })
    }
    if (gen002) {
      newQueue.push({
        id: 'GEN-002',
        title: '⚠ High Risk Security Issue',
        subtitle: 'Weak Access Permissions Detected',
        description: 'The configuration grants overly permissive access.\nThis may allow unauthorized control over cloud resources.',
        severity: 'HIGH'
      })
    }
    
    setAlertsQueue(newQueue)
    if (newQueue.length > 0) {
      setCurrentAlert(newQueue[0])
    }
  }, [findings])

  const handleDismiss = () => {
    const nextQueue = alertsQueue.slice(1)
    setAlertsQueue(nextQueue)
    if (nextQueue.length > 0) {
      setCurrentAlert(nextQueue[0])
    } else {
      setCurrentAlert(null)
    }
  }

  const handleFix = () => {
    navigate('/fix-suggestions')
    handleDismiss()
  }

  if (!currentAlert) return null

  const isCritical = currentAlert.severity === 'CRITICAL'
  const primaryColor = isCritical ? '#ef4444' : '#f97316' // red or orange

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      {/* Container matching user's exact design specifications */}
      <div className="relative max-w-md w-full flex flex-col items-center text-center transition-all"
        style={{ 
          background: '#0b1220', 
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.45)' 
        }}>
        
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          title="Dismiss">
          <X size={24} />
        </button>

        <div className="pt-8 pb-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse"
            style={{ background: `${primaryColor}20`, border: `1px solid ${primaryColor}60` }}>
            {isCritical ? (
              <ShieldAlert size={40} style={{ color: primaryColor }} />
            ) : (
              <AlertTriangle size={40} style={{ color: primaryColor }} />
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-1 px-6">
            {currentAlert.title}
          </h2>
          <h3 className="text-lg font-semibold px-6" style={{ color: primaryColor }}>
            {currentAlert.subtitle}
          </h3>
        </div>

        <div className="w-full px-6 pb-6 text-left">
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-6 text-center">
            {currentAlert.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 text-white font-medium transition-all hover:bg-slate-800"
              style={{ borderRadius: '8px', border: '1px solid #334155' }}>
              Dismiss
            </button>
            <button
              onClick={handleFix}
              className="flex-1 py-3 text-white font-bold transition-all hover:scale-105"
              style={{ 
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${primaryColor}, ${isCritical ? '#dc2626' : '#ea580c'})`, 
                border: `1px solid ${isCritical ? '#b91c1c' : '#c2410c'}`
              }}>
              View Auto-Fix Suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
