// src/components/AddMedicineModal.jsx
import React, { useState } from 'react'
import { api } from '../api'

export default function AddMedicineModal({ onClose, onAdded }) {
  const [name, setName] = useState('')
  const [takenBy, setTakenBy] = useState('me')
  const [scheduleType, setScheduleType] = useState('fixed')
  const [fixedTime, setFixedTime] = useState('08:00')
  const [flexibleDeadline, setFlexibleDeadline] = useState('22:00')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await api.addMedicine({
        name: name.trim(),
        takenBy,
        scheduleType,
        fixedTime,
        flexibleDeadline,
        note,
      })
      onAdded()
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">➕ 添加药品</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>药品名称</label>
            <input type="text" className="input" value={name}
              onChange={e => setName(e.target.value)} placeholder="如：维生素 B 族" required />
          </div>

          <div className="form-group">
            <label>谁需要吃</label>
            <div className="tag-group">
              {[
                { value: 'me', label: '我 🙋' },
                { value: 'her', label: 'TA 💕' },
                { value: 'both', label: '两个人都吃 💑' }
              ].map(t => (
                <span key={t.value}
                  className={`tag ${takenBy === t.value ? 'active' : ''}`}
                  onClick={() => setTakenBy(t.value)}>{t.label}</span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>服用时间</label>
            <div className="tag-group">
              <span className={`tag ${scheduleType === 'fixed' ? 'active' : ''}`}
                onClick={() => setScheduleType('fixed')}>固定时间 ⏰</span>
              <span className={`tag ${scheduleType === 'flexible' ? 'active' : ''}`}
                onClick={() => setScheduleType('flexible')}>灵活时段 🕐</span>
            </div>
            {scheduleType === 'fixed' ? (
              <input type="time" className="input" value={fixedTime}
                onChange={e => setFixedTime(e.target.value)} />
            ) : (
              <div>
                <input type="time" className="input" value={flexibleDeadline}
                  onChange={e => setFlexibleDeadline(e.target.value)} />
                <small className="hint">在此时间前打卡即算按时</small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>备注（可选）</label>
            <input type="text" className="input" value={note}
              onChange={e => setNote(e.target.value)} placeholder="如：早餐后服用" />
          </div>

          <button type="submit" className="btn btn-primary btn-submit"
            disabled={loading}>
            {loading ? '添加中...' : '✅ 添加药品'}
          </button>
        </form>
      </div>
    </div>
  )
}
