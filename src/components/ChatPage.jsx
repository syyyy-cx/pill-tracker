// src/components/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function ChatPage() {
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const bottomRef = useRef(null)

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const poll = async () => {
      const latest = state.messages.length > 0
        ? state.messages[state.messages.length - 1].created_at
        : undefined
      try {
        const newMsgs = await api.getMessages(latest)
        if (newMsgs.length > 0) {
          dispatch({ type: 'SET_MESSAGES', payload: [...state.messages, ...newMsgs] })
        }
      } catch(e) { /* ignore polling errors */ }
    }
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [state.messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await api.sendMessage(text.trim())
      setText('')
    } catch(err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleAIEncourage() {
    setAiLoading(true)
    try {
      await api.generateEncouragement()
      // Will be picked up by next poll
    } catch(err) {
      alert(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const myId = localStorage.getItem('userId')

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h3>💬 消息</h3>
        <button className="btn-ai-trigger" onClick={handleAIEncourage} disabled={aiLoading}>
          {aiLoading ? '⏳' : '🤖'} 生成鼓励
        </button>
      </div>

      <div className="chat-messages">
        {state.messages.map(msg => (
          <div key={msg.id} className={`chat-msg ${
            msg.sender_id === myId ? 'chat-msg-right' : 'chat-msg-left'
          } ${msg.type !== 'text' ? 'chat-msg-system' : ''}`}>
            {msg.sender_id !== myId && msg.type === 'text' && (
              <div className="chat-sender">{msg.sender_name || '对方'}</div>
            )}
            <div className="chat-bubble">
              {msg.content}
              {msg.type === 'ai_encourage' && <div className="chat-ai-badge">🤖 AI 鼓励</div>}
            </div>
            <div className="chat-time">
              {new Date(msg.created_at).toLocaleTimeString('zh-CN', {
                hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input className="chat-input" type="text" value={text}
          onChange={e => setText(e.target.value)}
          placeholder="输入消息..." maxLength={200} />
        <button className="chat-send-btn" type="submit"
          disabled={sending || !text.trim()}>➤</button>
      </form>
    </div>
  )
}
