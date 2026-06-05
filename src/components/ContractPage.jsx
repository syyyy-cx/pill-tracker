import React, { useState } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function ContractPage() {
  const { state, dispatch } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '吃药契约', punishment: '', settlementType: 'weekly',
    ontime: 10, late: 3, missed: -5, bonus: 20,
  })

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.createContract({
        name: form.name,
        punishment: form.punishment,
        settlementType: form.settlementType,
        rules: { ontime: form.ontime, late: form.late, missed: form.missed, bonus: form.bonus },
      })
      const contract = await api.getContract()
      dispatch({ type: 'SET_CONTRACT', payload: contract })
      setShowCreate(false)
    } catch(err) { alert(err.message) }
  }

  const contract = state.contract

  if (!contract && !showCreate) {
    return (
      <div className="contract-page">
        <h3>📜 契约</h3>
        <div className="empty-state">
          <p>还没有契约，创建一个来增加动力吧！</p>
          <button className="btn btn-create-contract"
            onClick={() => setShowCreate(true)}>创建契约</button>
        </div>
      </div>
    )
  }

  if (showCreate) {
    return (
      <div className="contract-page">
        <h3>📜 创建契约</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>契约名称</label>
            <input className="input" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>结算周期</label>
            <select className="input" value={form.settlementType}
              onChange={e => setForm({...form, settlementType: e.target.value})}>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
          <div className="form-group">
            <label>按时打卡 +? 分</label>
            <input type="number" className="input" value={form.ontime}
              onChange={e => setForm({...form, ontime: +e.target.value})} />
          </div>
          <div className="form-group">
            <label>迟到 +? 分</label>
            <input type="number" className="input" value={form.late}
              onChange={e => setForm({...form, late: +e.target.value})} />
          </div>
          <div className="form-group">
            <label>漏打卡 ? 分</label>
            <input type="number" className="input" value={form.missed}
              onChange={e => setForm({...form, missed: +e.target.value})} />
          </div>
          <div className="form-group">
            <label>全勤奖励</label>
            <input type="number" className="input" value={form.bonus}
              onChange={e => setForm({...form, bonus: +e.target.value})} />
          </div>
          <div className="form-group">
            <label>惩罚内容</label>
            <input className="input" value={form.punishment}
              onChange={e => setForm({...form, punishment: e.target.value})}
              placeholder="输的人请喝奶茶 🧋" />
          </div>
          <div style={{display:'flex', gap:8}}>
            <button type="submit" className="btn btn-create-contract">创建契约</button>
            <button type="button" className="btn btn-ghost"
              onClick={() => setShowCreate(false)}>取消</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="contract-page">
      <h3>📜 {contract.name}</h3>
      <div className="contract-card">
        <div className="contract-score">
          <div className="contract-score-item">
            <div className="contract-score-label">{state.members?.[0]?.nickname || '我'}</div>
            <div className="contract-score-value">{contract.myScore || 0}</div>
          </div>
          <div className="contract-vs">VS</div>
          <div className="contract-score-item">
            <div className="contract-score-label">{state.members?.[1]?.nickname || '对方'}</div>
            <div className="contract-score-value">{contract.partnerScore || 0}</div>
          </div>
        </div>
        {contract.punishment && (
          <p className="contract-punishment">💢 惩罚：{contract.punishment}</p>
        )}
        <div className="contract-meta">
          📅 {contract.settlement_type === 'daily' ? '每天' : contract.settlement_type === 'weekly' ? '每周' : '每月'}结算
          {contract.end_date && ` · 截止 ${contract.end_date}`}
        </div>
      </div>
      <button className="btn-text" style={{marginTop:16}}
        onClick={() => setShowCreate(true)}>重新创建契约</button>
    </div>
  )
}
