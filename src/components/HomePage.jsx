// src/components/HomePage.jsx
import React, { useState } from 'react'
import DailyMessage from './DailyMessage'
import AddMedicineModal from './AddMedicineModal'
import { useStore } from '../store'
import { api } from '../api'

export default function HomePage() {
  const { state, dispatch } = useStore()
  const [showAddModal, setShowAddModal] = useState(false)

  async function refreshMedicines() {
    const medicines = await api.getMedicines()
    dispatch({ type: 'SET_MEDICINES', payload: medicines })
  }

  async function refreshCheckIns() {
    const checkins = await api.getTodayCheckIns()
    dispatch({ type: 'SET_TODAY_CHECKINS', payload: checkins })
  }

  const checkedCount = state.todayCheckIns.length
  const totalCount = state.medicines.length

  return (
    <div className="home-page">
      <DailyMessage />

      <div className="progress-card">
        <div className="progress-header">
          <span>今日打卡 <strong>{checkedCount}/{totalCount}</strong></span>
          <span className={`text-${state.todayCheckIns.filter(c => c.status === 'late').length > 0 ? 'danger' : 'success'}`}>
            ⏰ 按时 {state.todayCheckIns.filter(c => c.status === 'ontime').length}
            {state.todayCheckIns.filter(c => c.status === 'late').length > 0 &&
              ` · 迟到 ${state.todayCheckIns.filter(c => c.status === 'late').length}`}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{
            width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%'
          }} />
        </div>
      </div>

      <div className="medicines-header">
        <h3>📋 今天的药</h3>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>+ 添加</button>
      </div>

      <div className="medicines-list">
        {state.medicines.map(med => (
          <MedicineItem key={med.id} medicine={med} checkin={state.todayCheckIns.find(c => c.medicine_id === med.id)} />
        ))}
        {state.medicines.length === 0 && (
          <p className="empty-state">还没有药品，点右上角添加吧 📋</p>
        )}
      </div>

      {showAddModal && (
        <AddMedicineModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { refreshMedicines(); refreshCheckIns(); }}
        />
      )}
    </div>
  )
}

function MedicineItem({ medicine, checkin }) {
  const isChecked = !!checkin

  function getCardClass() {
    if (isChecked) return 'card card-done'
    if (medicine.schedule_type === 'fixed') {
      const now = new Date()
      const [h, m] = (medicine.fixed_time || '00:00').split(':').map(Number)
      const medMin = h * 60 + m
      const curMin = now.getHours() * 60 + now.getMinutes()
      if (curMin > medMin + 30) return 'card card-late'
      return 'card card-pending'
    }
    const [dh, dm] = (medicine.flexible_deadline || '00:00').split(':').map(Number)
    const deadMin = dh * 60 + dm
    const curMin = new Date().getHours() * 60 + new Date().getMinutes()
    if (curMin > deadMin) return 'card card-late'
    return 'card card-flexible'
  }

  const takenLabel = medicine.taken_by === 'me' ? '仅我' : medicine.taken_by === 'her' ? '仅 TA' : '双方'
  const scheduleLabel = medicine.schedule_type === 'fixed'
    ? `⏰ ${medicine.fixed_time} 吃`
    : `🕐 ${medicine.flexible_deadline} 前吃`

  return (
    <div className={getCardClass()}>
      <div className="card-body">
        <div>
          <div className="card-name">💊 {medicine.name}</div>
          <div className="card-meta">{takenLabel} · {scheduleLabel}</div>
          {medicine.note && <div className="card-note">{medicine.note}</div>}
        </div>
        <div>
          {isChecked ? (
            <span className="badge-success">✅ {checkin.check_time}</span>
          ) : (
            <span className={`badge-waiting ${medicine.schedule_type === 'fixed' ? 'badge-blue' : ''}`}>
              待打卡
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
