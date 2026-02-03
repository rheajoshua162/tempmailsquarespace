import { create } from 'zustand'

const API_BASE = '/api'

export const useStore = create((set, get) => ({
  // Inbox state
  inbox: null,
  emails: [],
  selectedEmail: null,
  domains: [],
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Fetch domains
  fetchDomains: async () => {
    try {
      const res = await fetch(`${API_BASE}/inbox/domains`)
      const data = await res.json()
      set({ domains: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Create random inbox
  createRandomInbox: async (domain) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/inbox/random`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ inbox: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      return null
    }
  },

  // Create custom inbox (with optional PIN)
  createCustomInbox: async (username, domain, pin = null) => {
    set({ loading: true, error: null })
    try {
      const body = { username, domain }
      if (pin) body.pin = pin
      
      const res = await fetch(`${API_BASE}/inbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        // Check if inbox has PIN and suggest reclaim
        if (data.hasPin) {
          set({ error: data.message || data.error, loading: false })
          return { needsReclaim: true }
        }
        throw new Error(data.error)
      }
      set({ inbox: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      return null
    }
  },

  // Check if inbox exists and has PIN
  checkInbox: async (username, domain) => {
    try {
      const res = await fetch(`${API_BASE}/inbox/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, domain })
      })
      const data = await res.json()
      return data
    } catch (err) {
      return { exists: false, hasPin: false }
    }
  },

  // Reclaim inbox with PIN
  reclaimInbox: async (username, domain, pin) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/inbox/reclaim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, domain, pin })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ inbox: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      return null
    }
  },

  // Get inbox info
  getInbox: async (sessionId) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/inbox/${sessionId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ inbox: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false, inbox: null })
      return null
    }
  },

  // Fetch emails
  fetchEmails: async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/inbox/${sessionId}/emails`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ emails: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Add new email (from socket)
  addEmail: (email) => {
    set((state) => ({
      emails: [email, ...state.emails]
    }))
  },

  // Get single email
  getEmail: async (sessionId, emailId) => {
    try {
      const res = await fetch(`${API_BASE}/inbox/${sessionId}/emails/${emailId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ selectedEmail: data })
      // Update read status in list
      set((state) => ({
        emails: state.emails.map(e => 
          e.id === emailId ? { ...e, is_read: 1 } : e
        )
      }))
      return data
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  // Delete email
  deleteEmail: async (sessionId, emailId) => {
    try {
      const res = await fetch(`${API_BASE}/inbox/${sessionId}/emails/${emailId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      set((state) => ({
        emails: state.emails.filter(e => e.id !== emailId),
        selectedEmail: state.selectedEmail?.id === emailId ? null : state.selectedEmail
      }))
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    }
  },

  // Extend inbox
  extendInbox: async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/inbox/${sessionId}/extend`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ inbox: data })
      return data
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  // Clear inbox
  clearInbox: () => set({ inbox: null, emails: [], selectedEmail: null }),
  clearSelectedEmail: () => set({ selectedEmail: null })
}))
