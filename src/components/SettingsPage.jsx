// src/components/SettingsPage.jsx
import React, { useState } from 'react'
import { useStore } from '../store'
import { api } from '../api'

const AVATARS = ['😊', '🥰', '😎', '🤗', '🫶', '💪', '🌟', '🦋', '🌈', '🎀', '🐱', '🐶']

export default function SettingsPage({ onLogout }) {
  const { state, dispatch } = useStore()
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState(state.pharmacy?.nickname || '')
  const [avatar, setAvatar] = useState(state.pharmacy?.avatar || '😊')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const members = state.members || []
  const pharmacy = state.pharmacy || {}

  async function handleSave(e) {
    e.preventDefault()
    if (!nickname.trim()) return
    setSaving(true)
    try {
      await api.updateProfile({ nickname: nickname.trim(), avatar })
      // Refresh pharmacy info
      const info = await api.getPharmacy()
      dispatch({ type: 'SET_PHARMACY', payload: info })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleLeave() {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    onLogout()
  }

  return (
    <div className="settings-page">
      <h3>⚙️ 设置</h3>

      {/* Profile */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h4>👤 我的信息</h4>
          {!editing && (
            <button className="btn-edit" onClick={() => { setEditing(true); setSaved(false) }}>
              编辑
            </button>
          )}
        </div>

        {!editing ? (
          <>
            <div className="settings-row">
              <span>昵称</span>
              <span className="settings-value">{pharmacy.nickname || '未知'}</span>
            </div>
            <div className="settings-row">
              <span>头像</span>
              <span style={{fontSize: '1.5rem'}}>{pharmacy.avatar || '😊'}</span>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group" style={{marginTop: 8}}>
              <label style={{color: 'var(--text-secondary)', fontSize: '0.82rem'}}>昵称</label>
              <input
                type="text" className="input"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={10} required
                style={{background: 'var(--bg)'}}
              />
            </div>
            <div className="form-group">
              <label style={{color: 'var(--text-secondary)', fontSize: '0.82rem'}}>头像</label>
              <div className="avatar-grid" style={{justifyContent: 'flex-start'}}>
                {AVATARS.map(a => (
                  <span key={a}
                    className={`avatar-option ${avatar === a ? 'selected' : ''}`}
                    style={{fontSize: '1.3rem', padding: '8px', background: avatar === a ? 'var(--primary-light)' : '#f1f5f9'}}
                    onClick={() => setAvatar(a)}
                  >{a}</span>
                ))}
              </div>
            </div>
            <div style={{display: 'flex', gap: 8}}>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? '保存中...' : saved ? '✅ 已保存' : '💾 保存'}
              </button>
              <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>
                取消
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Pharmacy */}
      <div className="settings-section">
        <h4>🏥 当前药局</h4>
        <div className="settings-row">
          <span>药局 ID</span>
          <span className="settings-mono">{(pharmacy.pharmacy_id || '').slice(0, 8)}...</span>
        </div>
        <div className="settings-row">
          <span>成员 ({members.length} 人)</span>
          <span></span>
        </div>
        {members.map(m => (
          <div key={m.id} className="settings-member">
            <span>{m.avatar} {m.nickname}</span>
            <span className="settings-badge">
              {pharmacy.is_creator && m.id === pharmacy.id ? '👑 创建者' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Invite Code */}
      <div className="settings-section">
        <h4>📋 邀请码</h4>
        {pharmacy.invite_code ? (
          <div className="settings-invite-code">{pharmacy.invite_code}</div>
        ) : (
          <p className="settings-hint">邀请码仅在创建药局时显示</p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="settings-section settings-danger">
        <h4>⚠️ 危险操作</h4>
        {!confirmLeave ? (
          <button className="btn btn-danger" onClick={() => setConfirmLeave(true)}>
            🚪 退出药局
          </button>
        ) : (
          <div>
            <p className="settings-warning">退出后需要重新创建或加入药局才能使用</p>
            <div style={{display: 'flex', gap: 8, marginTop: 8}}>
              <button className="btn btn-danger" onClick={handleLeave}>确认退出</button>
              <button className="btn-ghost" onClick={() => setConfirmLeave(false)}>取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
