import { useState, useEffect } from 'react'

const API_BASE = '/api/admin'

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [loginForm, setLoginForm] = useState({ password: '' })
  const [error, setError] = useState('')
  
  const [stats, setStats] = useState(null)
  const [domains, setDomains] = useState([])
  const [inboxes, setInboxes] = useState([])
  const [gmailAccounts, setGmailAccounts] = useState([])
  const [newDomain, setNewDomain] = useState('')
  const [newDomainGmail, setNewDomainGmail] = useState('')
  const [newGmail, setNewGmail] = useState({ 
    email: '', 
    app_password: '', 
    description: '',
    imap_host: 'imap.gmail.com',
    imap_port: 993
  })
  const [selectedProvider, setSelectedProvider] = useState('gmail')
  const [showGmailForm, setShowGmailForm] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [setupActiveTab, setSetupActiveTab] = useState('cloudflare')

  // Email provider presets
  const emailProviders = {
    gmail: { name: 'Gmail', host: 'imap.gmail.com', port: 993 },
    outlook: { name: 'Outlook/Hotmail', host: 'outlook.office365.com', port: 993 },
    yahoo: { name: 'Yahoo Mail', host: 'imap.mail.yahoo.com', port: 993 },
    zoho: { name: 'Zoho Mail', host: 'imap.zoho.com', port: 993 },
    icloud: { name: 'iCloud Mail', host: 'imap.mail.me.com', port: 993 },
    yandex: { name: 'Yandex Mail', host: 'imap.yandex.com', port: 993 },
    gmx: { name: 'GMX Mail', host: 'imap.gmx.com', port: 993 },
    custom: { name: 'Custom IMAP', host: '', port: 993 }
  }

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider)
    if (provider !== 'custom') {
      setNewGmail(prev => ({
        ...prev,
        imap_host: emailProviders[provider].host,
        imap_port: emailProviders[provider].port
      }))
    }
  }
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
      loadGmailAccounts()
    }
  }, [isLoggedIn, token])

  const authHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  })

  // Setup page providers data
  const setupProviders = {
    cloudflare: {
      name: 'Cloudflare',
      icon: '☁️',
      steps: [
        'Login ke Cloudflare → pilih domain kamu',
        'Klik "Email" di sidebar kiri',
        'Klik "Email Routing" → Enable jika belum aktif',
        'Scroll ke "Routing rules" → klik "Create address"',
        'Pilih "Catch-all address"',
        'Action: "Forward to" → isi email Gmail kamu',
        'Klik "Save"',
        'Verifikasi email di Gmail jika diminta'
      ]
    },
    squarespace: {
      name: 'Squarespace',
      icon: '⬛',
      steps: [
        'Login ke Squarespace → buka Settings',
        'Klik "Domains" → pilih domain kamu',
        'Klik "Email" di menu domain',
        'Klik "Email Forwarding"',
        'Klik "Add Forwarder"',
        'Email Prefix: ketik * (bintang/asterisk)',
        'Forward To: isi email Gmail kamu',
        'Klik "Save"',
        'Verifikasi email di Gmail jika diminta'
      ]
    },
    namecheap: {
      name: 'Namecheap',
      icon: '🟠',
      steps: [
        'Login ke Namecheap → Domain List',
        'Klik "Manage" pada domain kamu',
        'Klik tab "Email Forwarding"',
        'Enable Email Forwarding',
        'Alias: ketik * (catch-all)',
        'Forward To: isi email Gmail kamu',
        'Klik "Add Forwarder"',
        'Verifikasi email di Gmail jika diminta'
      ]
    },
    godaddy: {
      name: 'GoDaddy',
      icon: '🟢',
      steps: [
        'Login ke GoDaddy → My Products',
        'Klik domain kamu → "DNS"',
        'Scroll ke "Forwarding" → "Email Forwarding"',
        'Klik "Add" atau "Create"',
        'Forward: ketik * (catch-all)',
        'To: isi email Gmail kamu',
        'Klik "Save"',
        'Verifikasi email di Gmail jika diminta'
      ]
    },
    googledomains: {
      name: 'Google Domains',
      icon: '🔵',
      steps: [
        'Login ke Google Domains',
        'Pilih domain kamu',
        'Klik "Email" di sidebar',
        'Klik "Email Forwarding"',
        'Klik "Add email alias"',
        'Alias: ketik * (catch-all)',
        'Forward to: isi email Gmail kamu',
        'Klik "Add"'
      ]
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginForm.password })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setToken(data.token)
      localStorage.setItem('adminToken', data.token)
      setIsLoggedIn(true)
      setLoginForm({ password: '' })
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

  const loadGmailAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts`, { headers: authHeaders() })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setGmailAccounts(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const addGmailAccount = async (e) => {
    e.preventDefault()
    if (!newGmail.email.trim() || !newGmail.app_password.trim()) return
    if (selectedProvider === 'custom' && !newGmail.imap_host.trim()) {
      setError('IMAP Host is required for custom provider')
      return
    }
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...newGmail,
          description: newGmail.description || emailProviders[selectedProvider].name
        })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setNewGmail({ email: '', app_password: '', description: '', imap_host: 'imap.gmail.com', imap_port: 993 })
      setSelectedProvider('gmail')
      setShowGmailForm(false)
      loadGmailAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleGmailAccount = async (id, isActive) => {
    try {
      await fetch(`${API_BASE}/gmail-accounts/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !isActive })
      })
      loadGmailAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteGmailAccount = async (id) => {
    if (!confirm('Are you sure you want to delete this Gmail account?')) return
    
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      loadGmailAccounts()
      loadDomains()
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
        body: JSON.stringify({ 
          domain: newDomain.trim(),
          gmail_account_id: newDomainGmail || null
        })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setNewDomain('')
      setNewDomainGmail('')
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const updateDomainGmail = async (domainId, gmailAccountId) => {
    try {
      await fetch(`${API_BASE}/domains/${domainId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ gmail_account_id: gmailAccountId || null })
      })
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

  // Login form - password only
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card-brutal">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="font-display text-4xl text-brutal-black">
              ADMIN LOGIN
            </h2>
            <p className="text-brutal-dark mt-2 text-sm">Enter password to access admin panel</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 border-3 border-red-500 bg-red-100 text-red-700 font-bold">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block font-bold text-brutal-black mb-2 uppercase">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="input-brutal text-center text-xl tracking-widest"
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>
            
            <button type="submit" className="btn-brutal w-full">
              LOGIN →
            </button>
          </form>
          
          <div className="mt-4 p-3 bg-brutal-gray border-2 border-brutal-black text-center">
            <p className="text-xs text-brutal-dark">
              🔒 Password is securely hashed with SHA256
            </p>
          </div>
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
      <div className="flex flex-wrap gap-2 mb-6">
        {['stats', 'gmail', 'domains', 'inboxes', 'setup'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 border-4 border-brutal-black font-bold uppercase transition-all
              ${activeTab === tab 
                ? 'bg-brutal-orange shadow-brutal' 
                : 'bg-brutal-white hover:bg-brutal-gray'}`}
          >
            {tab === 'gmail' ? '📧 EMAIL' : tab === 'setup' ? '📖 SETUP' : tab}
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

      {/* Email Accounts Tab */}
      {activeTab === 'gmail' && (
        <div className="card-brutal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl">Email Accounts (IMAP)</h3>
            <button onClick={() => setShowGmailForm(!showGmailForm)} className="btn-brutal">
              {showGmailForm ? 'CANCEL' : '+ ADD EMAIL'}
            </button>
          </div>

          {showGmailForm && (
            <form onSubmit={addGmailAccount} className="mb-6 p-4 border-4 border-brutal-black bg-brutal-gray">
              {/* Provider Selection */}
              <div className="mb-4">
                <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Email Provider</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(emailProviders).map(([key, provider]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleProviderChange(key)}
                      className={`p-2 border-3 border-brutal-black font-bold text-sm transition-all
                        ${selectedProvider === key 
                          ? 'bg-brutal-orange shadow-brutal' 
                          : 'bg-brutal-white hover:bg-brutal-gray'}`}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Email Address</label>
                  <input
                    type="email"
                    value={newGmail.email}
                    onChange={(e) => setNewGmail({ ...newGmail, email: e.target.value })}
                    placeholder={selectedProvider === 'gmail' ? 'yourmail@gmail.com' : 'yourmail@example.com'}
                    className="input-brutal"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">App Password</label>
                  <input
                    type="password"
                    value={newGmail.app_password}
                    onChange={(e) => setNewGmail({ ...newGmail, app_password: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="input-brutal"
                    required
                  />
                </div>
              </div>

              {/* Custom IMAP Settings */}
              {selectedProvider === 'custom' && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">IMAP Host</label>
                    <input
                      type="text"
                      value={newGmail.imap_host}
                      onChange={(e) => setNewGmail({ ...newGmail, imap_host: e.target.value })}
                      placeholder="imap.example.com"
                      className="input-brutal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">IMAP Port</label>
                    <input
                      type="number"
                      value={newGmail.imap_port}
                      onChange={(e) => setNewGmail({ ...newGmail, imap_port: parseInt(e.target.value) || 993 })}
                      placeholder="993"
                      className="input-brutal"
                    />
                  </div>
                </div>
              )}

              {/* Show current IMAP settings for non-custom */}
              {selectedProvider !== 'custom' && (
                <div className="mb-4 p-2 bg-brutal-white border-2 border-brutal-black text-sm">
                  <span className="font-bold">IMAP Server:</span> {emailProviders[selectedProvider].host}:{emailProviders[selectedProvider].port}
                </div>
              )}

              <div className="mb-4">
                <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Description (Optional)</label>
                <input
                  type="text"
                  value={newGmail.description}
                  onChange={(e) => setNewGmail({ ...newGmail, description: e.target.value })}
                  placeholder="e.g. Main account for domain xyz.com"
                  className="input-brutal"
                />
              </div>
              <button type="submit" className="btn-brutal">
                SAVE EMAIL ACCOUNT
              </button>
            </form>
          )}

          <div className="border-4 border-brutal-black overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brutal-black text-brutal-white font-bold uppercase text-sm">
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">IMAP Server</th>
                  <th className="p-3 text-left">Provider</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Domains</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gmailAccounts.map((account) => (
                  <tr key={account.id} className="border-t-3 border-brutal-black">
                    <td className="p-3 font-bold text-sm break-all">{account.email}</td>
                    <td className="p-3 text-xs font-mono">{account.imap_host}:{account.imap_port}</td>
                    <td className="p-3 text-sm">{account.description || '-'}</td>
                    <td className="p-3">
                      <span className={`badge-brutal text-xs ${account.is_active ? '' : 'bg-brutal-gray'}`}>
                        {account.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-3">{account.domain_count || 0}</td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleGmailAccount(account.id, account.is_active)}
                          className="btn-brutal-outline text-xs py-1 px-2"
                        >
                          {account.is_active ? 'DISABLE' : 'ENABLE'}
                        </button>
                        <button
                          onClick={() => deleteGmailAccount(account.id)}
                          className="btn-brutal-danger text-xs py-1 px-2"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {gmailAccounts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-brutal-dark">
                      No email accounts configured. Add one to start receiving emails.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-yellow-100 border-4 border-brutal-black">
            <p className="font-bold text-brutal-black mb-2">📌 SUPPORTED EMAIL PROVIDERS:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
              <div className="p-2 bg-white border-2 border-brutal-black">
                <strong>Gmail</strong><br/>
                <span className="text-xs text-brutal-dark">imap.gmail.com</span>
              </div>
              <div className="p-2 bg-white border-2 border-brutal-black">
                <strong>Outlook</strong><br/>
                <span className="text-xs text-brutal-dark">outlook.office365.com</span>
              </div>
              <div className="p-2 bg-white border-2 border-brutal-black">
                <strong>Yahoo</strong><br/>
                <span className="text-xs text-brutal-dark">imap.mail.yahoo.com</span>
              </div>
              <div className="p-2 bg-white border-2 border-brutal-black">
                <strong>Zoho</strong><br/>
                <span className="text-xs text-brutal-dark">imap.zoho.com</span>
              </div>
            </div>
            <p className="font-bold text-brutal-black mb-1">✅ Ready Account:</p>
            <ul className="list-disc list-inside text-sm">
              <li><strong>rheajoshua162@gmail.com</strong> - Gmail IMAP</li>
            </ul>
          </div>
        </div>
      )}

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="card-brutal">
          <form onSubmit={addDomain} className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="input-brutal flex-1"
              />
              <select
                value={newDomainGmail}
                onChange={(e) => setNewDomainGmail(e.target.value)}
                className="input-brutal md:w-64"
              >
                <option value="">-- Select Gmail Account --</option>
                {gmailAccounts.filter(g => g.is_active).map((g) => (
                  <option key={g.id} value={g.id}>{g.email}</option>
                ))}
              </select>
              <button type="submit" className="btn-brutal">
                ADD DOMAIN
              </button>
            </div>
          </form>

          <div className="border-4 border-brutal-black overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brutal-black text-brutal-white font-bold uppercase text-sm">
                  <th className="p-4 text-left">Domain</th>
                  <th className="p-4 text-left">Gmail Account</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Inboxes</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain) => (
                  <tr key={domain.id} className="border-t-3 border-brutal-black">
                    <td className="p-4 font-bold">{domain.domain}</td>
                    <td className="p-4">
                      <select
                        value={domain.gmail_account_id || ''}
                        onChange={(e) => updateDomainGmail(domain.id, e.target.value)}
                        className="input-brutal text-sm py-1"
                      >
                        <option value="">-- Not assigned --</option>
                        {gmailAccounts.filter(g => g.is_active).map((g) => (
                          <option key={g.id} value={g.id}>{g.email}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`badge-brutal text-xs ${domain.is_active ? '' : 'bg-brutal-gray'}`}>
                        {domain.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4">{domain.active_inboxes || 0}</td>
                    <td className="p-4">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Setup Tab - moved from separate page */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* How it works */}
          <div className="card-brutal">
            <h3 className="font-display text-2xl text-brutal-black mb-4">🔧 CARA KERJA TEMPMAIL</h3>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="p-4 border-4 border-brutal-black bg-brutal-gray">
                <div className="text-3xl mb-2">1️⃣</div>
                <p className="font-bold text-sm">Email masuk ke<br />user@domain.com</p>
              </div>
              <div className="p-4 border-4 border-brutal-black bg-brutal-orange">
                <div className="text-3xl mb-2">2️⃣</div>
                <p className="font-bold text-sm">Domain forward<br />ke Gmail</p>
              </div>
              <div className="p-4 border-4 border-brutal-black bg-brutal-gray">
                <div className="text-3xl mb-2">3️⃣</div>
                <p className="font-bold text-sm">Server fetch<br />via IMAP</p>
              </div>
              <div className="p-4 border-4 border-brutal-black bg-brutal-orange">
                <div className="text-3xl mb-2">4️⃣</div>
                <p className="font-bold text-sm">Email tampil<br />di inbox user</p>
              </div>
            </div>
          </div>

          {/* Step 1: Gmail App Password */}
          <div className="card-brutal">
            <h3 className="font-display text-2xl text-brutal-black mb-4">
              📧 STEP 1: BUAT GMAIL APP PASSWORD
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                <span className="font-bold text-brutal-orange">1.</span>
                <span>Buka <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-brutal-orange underline font-bold">Google Account → Security</a></span>
              </div>
              <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                <span className="font-bold text-brutal-orange">2.</span>
                <span>Aktifkan <strong>2-Step Verification</strong> (wajib!)</span>
              </div>
              <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                <span className="font-bold text-brutal-orange">3.</span>
                <span>Cari <strong>"App passwords"</strong> di search bar</span>
              </div>
              <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                <span className="font-bold text-brutal-orange">4.</span>
                <span>Buat app password baru → pilih <strong>"Mail"</strong></span>
              </div>
              <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                <span className="font-bold text-brutal-orange">5.</span>
                <span>Copy <strong>16 karakter password</strong> yang muncul</span>
              </div>
            </div>
            <div className="mt-4 p-4 border-4 border-dashed border-brutal-black bg-yellow-50">
              <p className="font-bold text-brutal-black">
                ⚠️ Simpan password ini! Akan digunakan di tab EMAIL ACCOUNTS.
              </p>
            </div>
          </div>

          {/* Step 2: Email Forwarding by Provider */}
          <div className="card-brutal">
            <h3 className="font-display text-2xl text-brutal-black mb-4">
              📨 STEP 2: SETUP EMAIL FORWARDING (CATCH-ALL)
            </h3>
            
            <p className="text-brutal-dark mb-4">
              Pilih provider domain kamu untuk melihat tutorial:
            </p>

            {/* Provider Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(setupProviders).map(([key, provider]) => (
                <button
                  key={key}
                  onClick={() => setSetupActiveTab(key)}
                  className={`px-4 py-2 border-4 border-brutal-black font-bold uppercase text-sm transition-all
                    ${setupActiveTab === key 
                      ? 'bg-brutal-orange text-brutal-black shadow-brutal' 
                      : 'bg-brutal-white text-brutal-black hover:bg-brutal-gray'}`}
                >
                  {provider.icon} {provider.name}
                </button>
              ))}
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {setupProviders[setupActiveTab].steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white"
                >
                  <span className="font-bold text-brutal-orange min-w-[24px]">{index + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 border-4 border-dashed border-brutal-black bg-green-50">
              <p className="font-bold text-brutal-black">
                ✅ Setelah setup, semua email ke *@domain.com akan di-forward ke Gmail!
              </p>
            </div>
          </div>

          {/* Step 3: Add to System */}
          <div className="card-brutal">
            <h3 className="font-display text-2xl text-brutal-black mb-4">
              ⚙️ STEP 3: TAMBAHKAN KE SISTEM
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border-4 border-brutal-black bg-brutal-gray">
                <p className="font-bold text-lg mb-3">3.1 Tambah Email Account:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Buka tab <strong>📧 EMAIL</strong></li>
                  <li>Klik <strong>+ ADD EMAIL</strong></li>
                  <li>Pilih provider (Gmail, Outlook, dll)</li>
                  <li>Masukkan email dan App Password</li>
                  <li>Klik <strong>SAVE</strong></li>
                </ul>
              </div>
              <div className="p-4 border-4 border-brutal-black bg-brutal-gray">
                <p className="font-bold text-lg mb-3">3.2 Tambah Domain:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Buka tab <strong>DOMAINS</strong></li>
                  <li>Ketik nama domain (e.g., mydomain.com)</li>
                  <li>Pilih Email Account yang menerima</li>
                  <li>Klik <strong>ADD DOMAIN</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 4: Test */}
          <div className="card-brutal bg-brutal-orange">
            <h3 className="font-display text-2xl text-brutal-black mb-4">
              🧪 STEP 4: TEST EMAIL
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                  <span className="font-bold text-brutal-orange">1.</span>
                  <span>Kembali ke Homepage</span>
                </div>
                <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                  <span className="font-bold text-brutal-orange">2.</span>
                  <span>Pilih domain yang baru ditambah</span>
                </div>
                <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                  <span className="font-bold text-brutal-orange">3.</span>
                  <span>Generate email random atau custom</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                  <span className="font-bold text-brutal-orange">4.</span>
                  <span>Kirim email dari HP/email lain</span>
                </div>
                <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
                  <span className="font-bold text-brutal-orange">5.</span>
                  <span>Email muncul dalam 2-5 detik! 🎉</span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ / Troubleshooting */}
          <div className="card-brutal border-red-500">
            <h3 className="font-display text-2xl text-red-600 mb-4">🔧 TROUBLESHOOTING</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border-4 border-brutal-black bg-brutal-white">
                <p className="font-bold text-brutal-orange mb-2">Email tidak masuk?</p>
                <ul className="text-sm space-y-1 text-brutal-dark">
                  <li>• Pastikan catch-all sudah di-setup</li>
                  <li>• Cek Gmail spam folder</li>
                  <li>• Tunggu 5-10 menit untuk propagasi</li>
                  <li>• Pastikan App Password benar</li>
                </ul>
              </div>
              <div className="p-4 border-4 border-brutal-black bg-brutal-white">
                <p className="font-bold text-brutal-orange mb-2">Apa itu catch-all?</p>
                <p className="text-sm text-brutal-dark">
                  Catch-all (*) artinya SEMUA email ke domain kamu (apapun@domain.com) 
                  akan di-forward ke 1 email Gmail.
                </p>
              </div>
              <div className="p-4 border-4 border-brutal-black bg-brutal-white">
                <p className="font-bold text-brutal-orange mb-2">Berapa lama inbox aktif?</p>
                <p className="text-sm text-brutal-dark">
                  Inbox otomatis expire dalam 20 menit. User bisa extend atau HOLD permanent.
                </p>
              </div>
              <div className="p-4 border-4 border-brutal-black bg-brutal-white">
                <p className="font-bold text-brutal-orange mb-2">Email Provider lain?</p>
                <p className="text-sm text-brutal-dark">
                  Sistem mendukung Gmail, Outlook, Yahoo, Zoho, iCloud, dan custom IMAP.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
