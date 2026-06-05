// src/components/DailyMessage.jsx
import React, { useMemo } from 'react'

const MESSAGES = [
  '照顾好自己，就是爱的最好方式 💕',
  '每一颗药都是对明天的承诺 🌅',
  '你们的健康，是彼此最好的礼物 🎁',
  '今天也要一起加油哦 💪',
  '爱是记得，也是坚持 🌸',
  '小小的药片，大大的关心 ❤️',
  '愿你今天充满能量和笑容 ☀️',
  '一起吃药的每一天，都是甜蜜的日常 🫶',
  '健康是给彼此最长情的告白 💌',
  '互相提醒，彼此珍惜，这就是爱 🥰',
]

export default function DailyMessage() {
  const message = useMemo(() => {
    const dayOfYear = new Date().toISOString().split('T')[0].replace(/-/g, '')
    return MESSAGES[parseInt(dayOfYear, 10) % MESSAGES.length]
  }, [])

  return <div className="daily-message">「{message}」</div>
}
