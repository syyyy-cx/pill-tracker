// src/components/BottomNav.jsx
import React from 'react'

const TABS = [
  { key: 'home', label: '打卡', icon: '💊' },
  { key: 'stats', label: '统计', icon: '📊' },
  { key: 'achievements', label: '成就', icon: '🏆' },
  { key: 'chat', label: '消息', icon: '💬' },
  { key: 'contract', label: '契约', icon: '📜' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`bottom-nav-item ${active === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
