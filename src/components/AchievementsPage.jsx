// src/components/AchievementsPage.jsx
import React, { useEffect } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function AchievementsPage() {
  const { state, dispatch } = useStore()

  useEffect(() => {
    api.getAchievements().then(data => {
      dispatch({ type: 'SET_ACHIEVEMENTS', payload: data })
    }).catch(() => {})
  }, [])

  return (
    <div className="achievements-page">
      <h3>🏆 成就</h3>
      <p className="page-subtitle">坚持打卡，解锁所有成就吧！</p>

      <div className="achievements-grid">
        {state.achievements.map(ach => {
          const unlocked = !!ach.unlocked_at
          return (
            <div key={ach.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
              onClick={() => {
                if (!unlocked && ach.progress < 100) return
              }}>
              <div className="achievement-icon">{ach.icon}</div>
              <div className="achievement-name">{ach.name}</div>
              <div className="achievement-desc">{ach.description}</div>
              {unlocked && (
                <div className="achievement-date">
                  🎉 {new Date(ach.unlocked_at).toLocaleDateString('zh-CN')}
                </div>
              )}
              {!unlocked && ach.progress > 0 && (
                <div className="achievement-progress">进度 {ach.progress}%</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
