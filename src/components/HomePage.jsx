import React, { useState, useEffect } from 'react'
import DailyMessage from './DailyMessage'
import MedicineCard from './MedicineCard'
import AddMedicineModal from './AddMedicineModal'
import { useStore } from '../store'
import { api } from '../api'

export default function HomePage() {
  const { state, dispatch } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone || document.referrer.includes('android-app://')) {
      setIsInstalled(true)
    }

    // Listen for PWA install prompt (Android Chrome)
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Listen for install success
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    }
  }

  async function refreshMedicines() {
    const medicines = await api.getMedicines()
    dispatch({ type: 'SET_MEDICINES', payload: medicines })
  }

  async function refreshCheckIns() {
    const checkins = await api.getTodayCheckIns()
    dispatch({ type: 'SET_TODAY_CHECKINS', payload: checkins })
  }

  const user = state.pharmacy || {}
  const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div className="home-page">
      <DailyMessage />

      {/* Hero Card */}
      <div className="hero-card">
        <div className="hero-top">
          <span className="hero-greeting">👋 {user.nickname || '早安'}</span>
          <span className="hero-date">{today}</span>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">{checkedCount}/{totalCount}</div>
            <div className="hero-stat-label">已打卡</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{ontimeCount}</div>
            <div className="hero-stat-label">按时</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{lateCount}</div>
            <div className="hero-stat-label">迟到</div>
          </div>
        </div>
        <div className="hero-bar-wrap">
          <div className="hero-bar-header">
            <span>今日进度</span>
            <span>{totalCount > 0 ? Math.round((checkedCount/totalCount)*100) : 0}%</span>
          </div>
          <div className="hero-bar">
            <div className="hero-bar-fill" style={{
              width: totalCount > 0 ? `${(checkedCount/totalCount)*100}%` : '0%'
            }} />
          </div>
        </div>
      </div>

      {/* Medicines */}
      <div className="section-header">
        <h3>📋 今天的药</h3>
        <span className="med-count">{state.medicines.length} 种</span>
      </div>

      <div className="med-list">
        {state.medicines.map(med => (
          <MedicineCard key={med.id} medicine={med} />
        ))}
        {state.medicines.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💊</div>
            <p className="empty-title">还没有药品</p>
            <p className="empty-desc">点击下方按钮添加今天的药吧</p>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button className="fab" onClick={() => setShowAddModal(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>

      {showAddModal && (
        <AddMedicineModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { refreshMedicines(); refreshCheckIns(); }}
        />
      )}

      {!isInstalled && (
        <div className="install-banner">
          <span>📱 添加到桌面更方便</span>
          {deferredPrompt ? (
            <button className="install-btn" onClick={handleInstall}>安装</button>
          ) : (
            <span className="install-hint">iOS: Safari分享 → 添加到主屏幕</span>
          )}
        </div>
      )}
    </div>
  )
}
