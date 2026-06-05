// src/App.jsx
import React, { useEffect, useState } from 'react'
import { StoreProvider } from './store'
import Onboarding from './components/Onboarding'
import Layout from './components/Layout'
import './App.css'

function AppContent() {
  const [authenticated, setAuthenticated] = useState(!!localStorage.getItem('token'))

  function handleAuth() {
    setAuthenticated(true)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <Onboarding onAuth={handleAuth} />
  }

  return <Layout onLogout={handleLogout} />
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}
