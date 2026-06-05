// src/components/Layout.jsx
import React, { useState, useEffect } from 'react'
import BottomNav from './BottomNav'
import HomePage from './HomePage'
import StatsPage from './StatsPage'
import AchievementsPage from './AchievementsPage'
import ChatPage from './ChatPage'
import ContractPage from './ContractPage'
import { useStore } from '../store'
import { api } from '../api'

export default function Layout({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home')
  const { state, dispatch } = useStore()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [pharmacyInfo, medicines, checkins, msgs, achievements, contract] = await Promise.all([
        api.getPharmacy(),
        api.getMedicines(),
        api.getTodayCheckIns(),
        api.getMessages(),
        api.getAchievements(),
        api.getContract().catch(() => null),
      ])
      dispatch({ type: 'SET_PHARMACY', payload: pharmacyInfo })
      dispatch({ type: 'SET_MEDICINES', payload: medicines })
      dispatch({ type: 'SET_TODAY_CHECKINS', payload: checkins })
      dispatch({ type: 'SET_MESSAGES', payload: msgs })
      dispatch({ type: 'SET_ACHIEVEMENTS', payload: achievements })
      dispatch({ type: 'SET_CONTRACT', payload: contract })
    } catch (e) {
      console.error('Failed to load data:', e)
    }
  }

  function renderPage() {
    switch (activeTab) {
      case 'home': return <HomePage />
      case 'stats': return <StatsPage />
      case 'achievements': return <AchievementsPage />
      case 'chat': return <ChatPage />
      case 'contract': return <ContractPage />
      default: return <HomePage />
    }
  }

  return (
    <div className="layout">
      <main className="main-content">
        {renderPage()}
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
