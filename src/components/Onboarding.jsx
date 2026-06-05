// src/components/Onboarding.jsx
import React, { useState, useRef } from 'react'
import { api } from '../api'

const AVATARS = ['😊', '🥰', '😎', '🤗', '🫶', '💪', '🌟', '🦋', '🌈', '🎀', '🐱', '🐶']

export default function Onboarding({ onAuth }) {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('😊')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdData, setCreatedData] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nickname.trim()) { setError('请输入昵称'); return }
    setLoading(true); setError('')

    try {
      if (mode === 'create') {
        const result = await api.createPharmacy(nickname, avatar)
        // Show the invite code before entering
        setCreatedData(result)
      } else {
        const result = await api.joinPharmacy(nickname, inviteCode, avatar)
        localStorage.setItem('token', result.token)
        localStorage.setItem('userId', result.userId)
        onAuth(result)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleEnterApp() {
    if (!createdData) return
    localStorage.setItem('token', createdData.token)
    localStorage.setItem('userId', createdData.userId)
    onAuth(createdData)
  }

  function handleCopyCode() {
    if (createdData?.inviteCode) {
      navigator.clipboard.writeText(createdData.inviteCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {
        // Fallback: select the text
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  // Show invite code after creation
  if (createdData) {
    return (
      <div className="onboarding">
        <div className="onboarding-hero">🎉</div>
        <h1 className="onboarding-title">药局创建成功！</h1>
        <p className="onboarding-subtitle">把邀请码发给对方就可以绑定了 💕</p>

        <div className="invite-code-box">
          <div className="invite-code-label">你的邀请码</div>
          <div className="invite-code">{createdData.inviteCode}</div>
          <div className="invite-code-hint">有效期 7 天</div>
        </div>

        <div className="onboarding-buttons" style={{marginTop: 24}}>
          <button className="btn btn-primary btn-lg" onClick={handleCopyCode}
            style={{background:'white', color:'var(--primary)'}}>
            {copied ? '✅ 已复制！' : '📋 复制邀请码'}
          </button>
          <button className="btn btn-secondary btn-lg" onClick={handleEnterApp}>
            🚀 开始使用
          </button>
        </div>
      </div>
    )
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
