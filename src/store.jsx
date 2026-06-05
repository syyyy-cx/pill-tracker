// src/store.js - Global state management
import React, { createContext, useContext, useReducer } from 'react'

const StoreContext = createContext()

const initialState = {
  user: null,
  pharmacy: null,
  members: [],
  medicines: [],
  todayCheckIns: [],
  messages: [],
  achievements: [],
  contract: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_PHARMACY': {
      const raw = action.payload?.members
      const members = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : []
      return { ...state, pharmacy: action.payload, members }
    }
    case 'SET_MEDICINES':
      return { ...state, medicines: action.payload }
    case 'SET_TODAY_CHECKINS':
      return { ...state, todayCheckIns: action.payload }
    case 'ADD_CHECKIN':
      return { ...state, todayCheckIns: [...state.todayCheckIns, action.payload] }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload }
    case 'SET_CONTRACT':
      return { ...state, contract: action.payload }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
