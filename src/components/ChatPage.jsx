// src/components/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { api } from '../api'

export default function ChatPage() {
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
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
          dispatch({ type: 'ADD_MESSAGE', payload: newMsgs[newMsgs.length - 1] })
          // Actually we need to set all messages, not just the last one
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

  function getSenderLabel(msg) {
    if (msg.type === 'system') return '系统'
    if (msg.type === 'ai_encourage') return '🤖 小助手'
    return msg.sender_name || '未知'
  }

  const myId = localStorage.getItem('userId')

  return (
    <div className="chat-page">
      <h3 className="chat-title">💬 消息</h3>

      <div className="chat-messages">
        {state.messages.map(msg => (
          <div key={msg.id} className={`chat-msg ${
            msg.sender_id === myId ? 'chat-msg-right' : 'chat-msg-left'
          } ${msg.type !== 'text' ? 'chat-msg-system' : ''}`}>
            {msg.sender_id !== myId && msg.type === 'text' && (
              <div className="chat-sender">{getSenderLabel(msg)}</div>
            )}
            <div className="chat-bubble">{msg.content}</div>
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
