// src/components/HomePage.jsx
import React from 'react'
import DailyMessage from './DailyMessage'
import { useStore } from '../store'

export default function HomePage() {
  const { state } = useStore()

  return (
    <div className="home-page">
      <DailyMessage />

      <div className="progress-card">
        <div className="progress-header">
          <span>今日打卡 <strong>{state.todayCheckIns.length}/{state.medicines.length}</strong></span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill"
            style={{ width: state.medicines.length > 0
              ? `${(state.todayCheckIns.length / state.medicines.length) * 100}%`
              : '0%' }}
          />
        </div>
      </div>

      <div className="medicines-header">
        <h3>📋 今天的药</h3>
      </div>

      <div className="medicines-list">
        {state.medicines.length === 0 && (
          <p className="empty-state">还没有药品，点右上角添加吧 📋</p>
        )}
      </div>
    </div>
  )
}
