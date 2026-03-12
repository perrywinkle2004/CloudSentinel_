import React, { useState } from 'react'

const CATEGORIES = [
  'Public Access',
  'Encryption Disabled',
  'Weak IAM Permissions',
  'Logging Disabled',
  'Versioning Disabled',
  'TLS Misconfiguration'
]

const SEV_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
  NONE: '#1e293b'
}

const SEV_LABELS = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', NONE: 'None' }

const CATEGORY_MAP = {
  'Public Access': 'Access Control',
  'Encryption Disabled': 'Encryption',
  'Weak IAM Permissions': 'Identity & Access Management',
  'Logging Disabled': 'Logging',
  'Versioning Disabled': 'Versioning',
  'TLS Misconfiguration': 'Network Security'
};

function getMaxSeverity(findings, category) {
  const mappedCategory = CATEGORY_MAP[category] || category;
  const matched = findings.filter(f => (f.category || '') === mappedCategory);
  if (matched.length === 0) return 'NONE';
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  for (const sev of order) {
    if (matched.some(f => (f.severity || '').toUpperCase() === sev)) return sev;
  }
  return 'NONE';
}

export default function RiskHeatMap({ scans = [] }) {
  const [hoveredCell, setHoveredCell] = useState(null)

  // Build grid: rows = categories, columns = scans
  const displayScans = scans.slice(0, 10).reverse()

  const grid = CATEGORIES.map(cat => ({
    category: cat,
    cells: displayScans.map((scan, idx) => ({
      scanIndex: idx + 1,
      severity: getMaxSeverity(scan.findings || [], cat),
      scanId: scan.id || `Scan ${idx + 1}`
    }))
  }))

  const cellSize = 36
  const labelWidth = 140
  const headerHeight = 28

  return (
    <div className="analytics-card" style={{ minHeight: 300 }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
        Risk Heat Map
      </p>

      <div style={{ overflowX: 'auto' }}>
        {/* Header row */}
        <div style={{ display: 'flex', marginLeft: labelWidth, marginBottom: 4 }}>
          {displayScans.map((_, i) => (
            <div key={i} style={{
              width: cellSize, textAlign: 'center', fontSize: '9px', fontWeight: 600,
              color: '#64748b', fontFamily: "'JetBrains Mono', monospace"
            }}>
              S{i + 1}
            </div>
          ))}
          {displayScans.length === 0 && (
            <div style={{ fontSize: '11px', color: '#475569', padding: '4px 0' }}>No scans yet</div>
          )}
        </div>

        {/* Grid rows */}
        {grid.map((row, ri) => (
          <div key={row.category} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <div style={{
              width: labelWidth, fontSize: '10px', color: '#94a3b8', fontWeight: 500,
              paddingRight: 8, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {row.category}
            </div>
            {row.cells.map((cell, ci) => {
              const isHovered = hoveredCell && hoveredCell.row === ri && hoveredCell.col === ci
              return (
                <div
                  key={ci}
                  onMouseEnter={() => setHoveredCell({ row: ri, col: ci })}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    width: cellSize - 2, height: cellSize - 6, marginRight: 2,
                    borderRadius: 4,
                    background: SEV_COLORS[cell.severity],
                    opacity: cell.severity === 'NONE' ? 0.4 : (isHovered ? 1 : 0.85),
                    transition: 'opacity 0.15s, transform 0.15s',
                    transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {isHovered && (
                    <div style={{
                      position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                      background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8,
                      padding: '8px 12px', fontSize: '11px', color: '#e2e8f0', whiteSpace: 'nowrap',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 50, pointerEvents: 'none'
                    }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 2 }}>Scan {cell.scanIndex}</div>
                      <div>{row.category}</div>
                      <div style={{ color: SEV_COLORS[cell.severity], fontWeight: 600 }}>
                        {SEV_LABELS[cell.severity]}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '14px' }}>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].map(sev => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: SEV_COLORS[sev], opacity: sev === 'NONE' ? 0.4 : 1 }} />
            <span style={{ color: '#94a3b8' }}>{SEV_LABELS[sev]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
