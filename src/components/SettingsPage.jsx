// src/components/SettingsPage.jsx
import React, { useState } from 'react'
import { useStore } from '../store'

export default function SettingsPage({ onLogout }) {
  const { state } = useStore()
  const [confirmLeave, setConfirmLeave] = useState(false)

  function handleLeave() {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    onLogout()
  }

  const members = state.members || []
  const pharmacy = state.pharmacy || {}

  return (
    <div className="settings-page">
      <h3>⚙️ 设置</h3>

      <div className="settings-section">
        <h4>👤 我的信息</h4>
        <div className="settings-row">
          <span>昵称</span>
          <span>{pharmacy.nickname || '未知'}</span>
        </div>
        <div className="settings-row">
          <span>头像</span>
          <span>{pharmacy.avatar || '😊'}</span>
        </div>
      </div>

      <div className="settings-section">
        <h4>🏥 当前药局</h4>
        <div className="settings-row">
          <span>药局 ID</span>
          <span className="settings-mono">{(pharmacy.pharmacy_id || '').slice(0, 8)}...</span>
        </div>
        <div className="settings-row">
          <span>成员</span>
          <span>{members.length} 人</span>
        </div>
        {members.map(m => (
          <div key={m.id} className="settings-member">
            <span>{m.avatar} {m.nickname}</span>
            <span className="settings-badge">{pharmacy.is_creator && m.id === pharmacy.id ? '👑 创建者' : ''}</span>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h4>📋 邀请码</h4>
        {state.pharmacy?.invite_code ? (
          <div className="settings-invite-code">{state.pharmacy.invite_code}</div>
        ) : (
          <p className="settings-hint">邀请码仅在创建药局时显示</p>
        )}
      </div>

      <div className="settings-section settings-danger">
        <h4>⚠️ 危险操作</h4>
        {!confirmLeave ? (
          <button className="btn btn-danger" onClick={() => setConfirmLeave(true)}>
            🚪 退出药局
          </button>
        ) : (
          <div>
            <p className="settings-warning">退出后需要重新创建或加入药局才能使用</p>
            <div style={{display:'flex', gap: 8, marginTop: 8}}>
              <button className="btn btn-danger" onClick={handleLeave}>确认退出</button>
              <button className="btn btn-ghost" onClick={() => setConfirmLeave(false)}>取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
