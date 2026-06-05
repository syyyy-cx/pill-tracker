// src/components/Onboarding.jsx
import React, { useState } from 'react'
import { api } from '../api'

const AVATARS = ['😊', '🥰', '😎', '🤗', '🫶', '💪', '🌟', '🦋', '🌈', '🎀', '🐱', '🐶']

export default function Onboarding({ onAuth }) {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('😊')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nickname.trim()) { setError('请输入昵称'); return }
    setLoading(true); setError('')

    try {
      let result
      if (mode === 'create') {
        result = await api.createPharmacy(nickname, avatar)
        setCreatedCode(result.inviteCode)
      } else {
        result = await api.joinPharmacy(nickname, inviteCode, avatar)
      }
      localStorage.setItem('token', result.token)
      localStorage.setItem('userId', result.userId)
      onAuth(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mode) {
    return (
      <div className="onboarding">
        <div className="onboarding-hero">💊</div>
        <h1 className="onboarding-title">甜蜜吃药</h1>
        <p className="onboarding-subtitle">二人专属药品监督伴侣 💕</p>
        <div className="onboarding-buttons">
          <button className="btn btn-primary btn-lg" onClick={() => setMode('create')}>
            🏥 创建我们的药局
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => setMode('join')}>
            🔑 输入邀请码加入
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="onboarding" onSubmit={handleSubmit}>
      <h2 style={{marginBottom: 24}}>
        {mode === 'create' ? '🏥 创建药局' : '🔑 加入药局'}
      </h2>

      <div className="form-group">
        <label>你的昵称</label>
        <input
          type="text" value={nickname} onChange={e => setNickname(e.target.value)}
          placeholder="输入昵称..." maxLength={10} required
        />
      </div>

      <div className="form-group">
        <label>选择头像</label>
        <div className="avatar-grid">
          {AVATARS.map(a => (
            <span key={a}
              className={`avatar-option ${avatar === a ? 'selected' : ''}`}
              onClick={() => setAvatar(a)}
            >{a}</span>
          ))}
        </div>
      </div>

      {mode === 'join' && (
        <div className="form-group">
          <label>邀请码</label>
          <input type="text" value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="输入 6 位邀请码" maxLength={6} required
          />
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
        style={{width:'100%'}}>
        {loading ? '处理中...' : mode === 'create' ? '创建并生成邀请码' : '加入药局'}
      </button>
      <button type="button" className="btn-text" onClick={() => {setMode(null); setError(''); setCreatedCode('')}}
        style={{marginTop: 12}}>返回</button>
    </form>
  )
}
