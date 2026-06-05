import React, { useState } from 'react'
import DailyMessage from './DailyMessage'
import MedicineCard from './MedicineCard'
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

  const checkedCount = state.todayCheckIns.filter(
    c => state.medicines.some(m => m.id === c.medicine_id)
  ).length
  const totalCount = state.medicines.length
  const lateCount = state.todayCheckIns.filter(c => c.status === 'late').length
  const ontimeCount = state.todayCheckIns.filter(c => c.status === 'ontime').length

  return (
    <div className="home-page">
      <DailyMessage />

      <div className="progress-card">
        <div className="progress-header">
          <span>今日打卡 <strong>{checkedCount}/{totalCount}</strong></span>
          <span className={lateCount > 0 ? 'text-danger' : 'text-success'}>
            ⏰ 按时 {ontimeCount}{lateCount > 0 ? ` · 迟到 ${lateCount}` : ''}
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
          <MedicineCard key={med.id} medicine={med} />
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
