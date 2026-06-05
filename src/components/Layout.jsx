// src/components/Layout.jsx
import React, { useState, useEffect } from 'react'
import BottomNav from './BottomNav'
import HomePage from './HomePage'
import StatsPage from './StatsPage'
import AchievementsPage from './AchievementsPage'
import ChatPage from './ChatPage'
import ContractPage from './ContractPage'
import SettingsPage from './SettingsPage'
import { useStore } from '../store'
import { api } from '../api'

export default function Layout({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const { state, dispatch } = useStore()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [pharmacyInfo, medicines, checkins] = await Promise.all([
        api.getPharmacy(),
        api.getMedicines(),
        api.getTodayCheckIns(),
      ])
      dispatch({ type: 'SET_PHARMACY', payload: pharmacyInfo })
      dispatch({ type: 'SET_MEDICINES', payload: medicines })
      dispatch({ type: 'SET_TODAY_CHECKINS', payload: checkins })
      setLoading(false)

      // Load non-critical data in background
      Promise.all([
        api.getMessages().then(m => dispatch({ type: 'SET_MESSAGES', payload: m })).catch(() => {}),
        api.getAchievements().then(a => dispatch({ type: 'SET_ACHIEVEMENTS', payload: a })).catch(() => {}),
        api.getContract().then(c => dispatch({ type: 'SET_CONTRACT', payload: c })).catch(() => {}),
      ])
    } catch (e) {
      console.error('Failed to load data:', e)
      setLoading(false)
    }
  }

  function renderPage() {
    if (showSettings) return <SettingsPage onLogout={onLogout} />
    if (loading) return <HomePageSkeleton />
    switch (activeTab) {
      case 'home': return <HomePage key="home" />
      case 'stats': return <StatsPage key="stats" />
      case 'achievements': return <AchievementsPage key="achievements" />
      case 'chat': return <ChatPage key="chat" />
      case 'contract': return <ContractPage key="contract" />
      default: return <HomePage key="home" />
    }
  }

  function handleTabChange(tab) {
    setShowSettings(false)
    setActiveTab(tab)
  }

  return (
    <div className="layout">
      <main className="main-content">
        <div className="layout-header">
          <span className="layout-title">💊 甜蜜吃药</span>
          <button className="settings-gear" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? '✕' : '⚙️'}
          </button>
        </div>
        <div className="fade-in" key={showSettings ? 'settings' : activeTab}>
          {renderPage()}
        </div>
      </main>
      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  )
}

function HomePageSkeleton() {
  return (
    <div className="home-page">
      <div className="skeleton skeleton-message" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  )
}
