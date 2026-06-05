import React, { useState } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function MedicineCard({ medicine }) {
  const { state, dispatch } = useStore()
  const [showMsg, setShowMsg] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const checkin = state.todayCheckIns.find(c => c.medicine_id === medicine.id)
  const isChecked = !!checkin

  function getCardClass() {
    if (isChecked) return 'med-card med-card-done'
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    if (medicine.schedule_type === 'fixed') {
      const [h, m] = (medicine.fixed_time || '00:00').split(':').map(Number)
      if (cur > h * 60 + m + 30) return 'med-card med-card-late'
      return 'med-card med-card-pending'
    }
    const [dh, dm] = (medicine.flexible_deadline || '00:00').split(':').map(Number)
    if (cur > dh * 60 + dm) return 'med-card med-card-late'
    return 'med-card med-card-flexible'
  }

  async function handleCheckin() {
    if (!showMsg) { setShowMsg(true); return }
    setLoading(true)
    try {
      const result = await api.doCheckIn(medicine.id, message)
      dispatch({ type: 'ADD_CHECKIN', payload: {
        medicine_id: medicine.id,
        status: result.status,
        check_time: result.check_time,
        message
      }})
      setShowMsg(false)
      setMessage('')
      // Check achievements
      api.checkAchievements().then(data => {
        if (data.unlocked && data.unlocked.length > 0) {
          api.getAchievements().then(a => dispatch({ type: 'SET_ACHIEVEMENTS', payload: a }))
        }
      }).catch(() => {})
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const takenLabel = medicine.taken_by === 'me' ? '仅我' : medicine.taken_by === 'her' ? '仅 TA' : '双方'
  const scheduleLabel = medicine.schedule_type === 'fixed'
    ? `⏰ ${medicine.fixed_time} 吃`
    : `🕐 ${medicine.flexible_deadline} 前吃`

  const isLate = getCardClass().includes('med-card-late')
  const isFlexible = getCardClass().includes('med-card-flexible')

  return (
    <div className={getCardClass()}>
      <div className="med-card-accent" />
      <div className="med-card-inner">
        <div className="med-icon">{isChecked ? '✅' : isLate ? '⏰' : '💊'}</div>
        <div className="med-info">
          <div className="med-name">{medicine.name}</div>
          <div className="med-meta">{takenLabel} · {scheduleLabel}</div>
          {medicine.note && <div className="med-note">{medicine.note}</div>}
          {isChecked && checkin.message && (
            <div className="med-message">💌 {checkin.message}</div>
          )}
        </div>
        <div className="med-action">
          {isChecked ? (
            <span className="med-badge med-badge-done">{checkin.check_time}</span>
          ) : (
            <div>
              {!showMsg ? (
                <button className={`med-btn ${isLate ? 'med-btn-late' : ''}`}
                  onClick={handleCheckin} disabled={loading}>已吃 ✅</button>
              ) : (
                <div className="checkin-popup">
                  <input className="checkin-input" placeholder="附言 💌"
                    value={message} onChange={e => setMessage(e.target.value)} maxLength={50} autoFocus />
                  <button className="med-btn" onClick={handleCheckin}
                    disabled={loading}>确认</button>
                  <button className="btn-ghost-sm" onClick={() => {setShowMsg(false); setMessage('')}}>✕</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
