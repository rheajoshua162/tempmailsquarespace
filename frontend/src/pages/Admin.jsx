import { useState, useEffect } from 'react'

const API_BASE = '/api/admin'

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  
  const [stats, setStats] = useState(null)
  const [domains, setDomains] = useState([])
  const [inboxes, setInboxes] = useState([])
  const [newDomain, setNewDomain] = useState('')
  const [activeTab, setActiveTab] = useState('stats')

  // Check for saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken')
    if (savedToken) {
      setToken(savedToken)
      setIsLoggedIn(true)
    }
  }, [])

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn && token) {
      loadStats()
      loadDomains()
      loadInboxes()
    }
  }, [isLoggedIn, token])

  const authHeaders = () => ({
    'Authorization': `Basic ${token}`,
    'Content-Type': 'application/json'
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setToken(data.token)
      localStorage.setItem('adminToken', data.token)
      setIsLoggedIn(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setToken('')
    localStorage.removeItem('adminToken')
  }

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const loadDomains = async () => {
    try {
      const res = await fetch(`${API_BASE}/domains`, { headers: authHeaders() })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setDomains(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const loadInboxes = async () => {
    try {
      const res = await fetch(`${API_BASE}/inboxes`, { headers: authHeaders() })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setInboxes(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const addDomain = async (e) => {
    e.preventDefault()
    if (!newDomain.trim()) return
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/domains`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ domain: newDomain.trim() })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setNewDomain('')
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleDomain = async (id, isActive) => {
    try {
      await fetch(`${API_BASE}/domains/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !isActive })
      })
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteDomain = async (id) => {
    if (!confirm('Are you sure you want to delete this domain?')) return
    
    try {
      const res = await fetch(`${API_BASE}/domains/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteInbox = async (id) => {
    if (!confirm('Are you sure you want to delete this inbox?')) return
    
    try {
      await fetch(`${API_BASE}/inboxes/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      loadInboxes()
      loadStats()
    } catch (err) {
      setError(err.message)
    }
  }

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card-brutal">
          <h2 className="font-display text-4xl text-brutal-black mb-6 text-center">
            ADMIN LOGIN
          </h2>
          
          {error && (
            <div className="mb-4 p-3 border-3 border-red-500 bg-red-100 text-red-700 font-bold">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block font-bold text-brutal-black mb-2 uppercase">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="input-brutal"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block font-bold text-brutal-black mb-2 uppercase">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="input-brutal"
                required
              />
            </div>
            
            <button type="submit" className="btn-brutal w-full">
              LOGIN →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-4xl text-brutal-black">
          ADMIN PANEL
        </h2>
        <button onClick={handleLogout} className="btn-brutal-danger">
          LOGOUT
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 border-3 border-red-500 bg-red-100 text-red-700 font-bold flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['stats', 'domains', 'inboxes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 border-4 border-brutal-black font-bold uppercase transition-all
              ${activeTab === tab 
                ? 'bg-brutal-orange shadow-brutal' 
                : 'bg-brutal-white hover:bg-brutal-gray'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'Active Domains', value: stats.activeDomains, total: stats.totalDomains },
            { label: 'Active Inboxes', value: stats.activeInboxes },
            { label: 'Emails Today', value: stats.emailsToday, total: stats.totalEmails }
          ].map((stat, i) => (
            <div key={i} className="card-brutal text-center">
              <p className="font-display text-5xl text-brutal-orange">{stat.value}</p>
              <p className="font-bold text-brutal-black uppercase mt-2">{stat.label}</p>
              {stat.total !== undefined && (
                <p className="text-sm text-brutal-dark mt-1">/ {stat.total} total</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="card-brutal">
          <form onSubmit={addDomain} className="flex gap-4 mb-6">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="input-brutal flex-1"
            />
            <button type="submit" className="btn-brutal">
              ADD DOMAIN
            </button>
          </form>

          <div className="border-4 border-brutal-black">
            <div className="grid grid-cols-4 gap-4 p-4 bg-brutal-black text-brutal-white font-bold uppercase">
              <div>Domain</div>
              <div>Status</div>
              <div>Active Inboxes</div>
              <div>Actions</div>
            </div>
            
            {domains.map((domain) => (
              <div key={domain.id} className="grid grid-cols-4 gap-4 p-4 border-t-3 border-brutal-black items-center">
                <div className="font-bold">{domain.domain}</div>
                <div>
                  <span className={`badge-brutal ${domain.is_active ? '' : 'bg-brutal-gray'}`}>
                    {domain.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div>{domain.active_inboxes || 0}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleDomain(domain.id, domain.is_active)}
                    className="btn-brutal-outline text-xs py-1 px-3"
                  >
                    {domain.is_active ? 'DISABLE' : 'ENABLE'}
                  </button>
                  <button
                    onClick={() => deleteDomain(domain.id)}
                    className="btn-brutal-danger text-xs py-1 px-3"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inboxes Tab */}
      {activeTab === 'inboxes' && (
        <div className="card-brutal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl">Active Inboxes</h3>
            <button onClick={loadInboxes} className="btn-brutal-outline text-sm">
              REFRESH
            </button>
          </div>

          <div className="border-4 border-brutal-black overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brutal-black text-brutal-white font-bold uppercase">
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Created</th>
                  <th className="p-4 text-left">Expires</th>
                  <th className="p-4 text-left">Emails</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inboxes.map((inbox) => (
                  <tr key={inbox.id} className="border-t-3 border-brutal-black">
                    <td className="p-4 font-bold">{inbox.username}@{inbox.domain}</td>
                    <td className="p-4 text-sm">{new Date(inbox.created_at).toLocaleString()}</td>
                    <td className="p-4 text-sm">{new Date(inbox.expires_at).toLocaleString()}</td>
                    <td className="p-4">{inbox.email_count}</td>
                    <td className="p-4">
                      <button
                        onClick={() => deleteInbox(inbox.id)}
                        className="btn-brutal-danger text-xs py-1 px-3"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))}
                {inboxes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-brutal-dark">
                      No active inboxes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
