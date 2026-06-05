import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function StatsPage() {
  const [period, setPeriod] = useState(7)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.getStats(period).then(setStats).catch(() => {})
  }, [period])

  if (!stats) {
    return <div className="stats-page"><h3>📊 统计</h3><p className="page-subtitle">加载中...</p></div>
  }

  const maxDailyTotal = Math.max(1, ...stats.daily.map(d => d.total))

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h3>📊 统计</h3>
        <div className="period-toggle">
          <button className={`period-btn ${period === 7 ? 'active' : ''}`}
            onClick={() => setPeriod(7)}>7天</button>
          <button className={`period-btn ${period === 30 ? 'active' : ''}`}
            onClick={() => setPeriod(30)}>30天</button>
        </div>
      </div>

      {/* Ring chart */}
      <div className="stats-ring-card">
        <div className="stats-ring">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#667eea" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.rate / 100)}`}
              transform="rotate(-90 50 50)" strokeLinecap="round" />
          </svg>
          <div className="stats-ring-text">{stats.rate}%</div>
        </div>
        <div className="stats-ring-label">打卡率</div>
      </div>

      {/* Summary */}
      <div className="stats-summary">
        <div className="stat-item">
          <div className="stat-value" style={{color:'var(--success)'}}>{stats.ontime}</div>
          <div className="stat-label">按时</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{color:'var(--warning)'}}>{stats.late}</div>
          <div className="stat-label">迟到</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{color:'var(--danger)'}}>{stats.missed}</div>
          <div className="stat-label">漏打</div>
        </div>
      </div>

      {/* Daily chart */}
      <div className="stats-daily">
        <h4>每日明细</h4>
        <div className="stats-chart">
          {stats.daily.length === 0 && <p className="empty-state">暂无数据</p>}
          {stats.daily.map(d => (
            <div key={d.date} className="stats-day">
              <div className="stats-bar" style={{
                height: `${Math.max(4, (d.total / maxDailyTotal) * 60)}px`,
                background: d.late > 0 ? 'var(--warning)' : 'var(--success)'
              }} title={`${d.date}: ${d.ontime}按时 ${d.late}迟到 ${d.missed}漏打`} />
              <div className="stats-day-label">
                {new Date(d.date + 'T00:00:00').toLocaleDateString('zh-CN', {
                  weekday: 'short'
                })}
              </div>
            </div>
          ))}
        </div>
        {stats.daily.map(d => (
          <div key={d.date} className="stats-row">
            <span className="stats-date">{d.date}</span>
            <span className="stats-bar-text">
              <span style={{color:'var(--success)'}}>● {d.ontime}</span>
              {d.late > 0 && <span style={{color:'var(--warning)', marginLeft:8}}>● {d.late}</span>}
              {d.missed > 0 && <span style={{color:'var(--danger)', marginLeft:8}}>● {d.missed}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
