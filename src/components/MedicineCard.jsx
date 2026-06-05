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
    if (isChecked) return 'card card-done'
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    if (medicine.schedule_type === 'fixed') {
      const [h, m] = (medicine.fixed_time || '00:00').split(':').map(Number)
      if (cur > h * 60 + m + 30) return 'card card-late'
      return 'card card-pending'
    }
    const [dh, dm] = (medicine.flexible_deadline || '00:00').split(':').map(Number)
    if (cur > dh * 60 + dm) return 'card card-late'
    return 'card card-flexible'
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

  return (
    <div className={getCardClass()}>
      <div className="card-body">
        <div className="card-main">
          <div className="card-name">💊 {medicine.name}</div>
          <div className="card-meta">{takenLabel} · {scheduleLabel}</div>
          {medicine.note && <div className="card-note">{medicine.note}</div>}
          {isChecked && checkin.message && (
            <div className="card-message">💌 {checkin.message}</div>
          )}
        </div>
        <div className="card-action">
          {isChecked ? (
            <span className="badge-success">✅ {checkin.check_time}</span>
          ) : (
            <div>
              {!showMsg ? (
                <button className="btn-checkin" onClick={handleCheckin}
                  disabled={loading}>已吃 ✅</button>
              ) : (
                <div className="checkin-box">
                  <input className="input-sm" placeholder="附言 💌"
                    value={message} onChange={e => setMessage(e.target.value)} maxLength={50} autoFocus />
                  <button className="btn-checkin btn-sm" onClick={handleCheckin}
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
