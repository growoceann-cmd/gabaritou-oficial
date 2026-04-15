import React from 'react'

const colorMap = {
  neon: 'stat-value-neon',
  cyan: 'stat-value-cyan',
  violet: 'stat-value-violet',
  gold: 'stat-value-gold',
}

export default function StatsCard({ value, label, color = 'violet', change, changeLabel, icon }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className={`stat-value ${colorMap[color] || colorMap.violet}`}>
            {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
            {value}
          </div>
          <div className="stat-label">{label}</div>
          {change !== undefined && (
            <div className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              {changeLabel && <span style={{ marginLeft: 4, fontWeight: 400, opacity: 0.8 }}>{changeLabel}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
