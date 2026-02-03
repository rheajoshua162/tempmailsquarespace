import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function Home() {
  const navigate = useNavigate()
  const { domains, fetchDomains, createRandomInbox, createCustomInbox, reclaimInbox, loading, error, clearError } = useStore()
  
  const [selectedDomain, setSelectedDomain] = useState('')
  const [customUsername, setCustomUsername] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [pin, setPin] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)
  const [isReclaimMode, setIsReclaimMode] = useState(false)
  const [reclaimPin, setReclaimPin] = useState('')

  useEffect(() => {
    fetchDomains()
  }, [])

  useEffect(() => {
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0])
    }
  }, [domains])

  const handleGenerateRandom = async () => {
    // Pastikan domain terisi
    const domainToUse = selectedDomain || (domains.length > 0 ? domains[0] : null)
    if (!domainToUse) {
      return // No domain available
    }
    const result = await createRandomInbox(domainToUse)
    if (result) {
      navigate(`/inbox/${result.sessionId}`)
    }
  }

  const handleCreateCustom = async (e) => {
    e.preventDefault()
    if (!customUsername.trim()) return
    
    const result = await createCustomInbox(
      customUsername.trim().toLowerCase(), 
      selectedDomain,
      showPinInput && pin ? pin : null
    )
    if (result) {
      if (result.needsReclaim) {
        // Inbox exists with PIN, switch to reclaim mode
        setIsReclaimMode(true)
        return
      }
      navigate(`/inbox/${result.sessionId}`)
    }
  }

  const handleReclaim = async (e) => {
    e.preventDefault()
    if (!customUsername.trim() || !reclaimPin) return
    
    const result = await reclaimInbox(
      customUsername.trim().toLowerCase(),
      selectedDomain,
      reclaimPin
    )
    if (result) {
      navigate(`/inbox/${result.sessionId}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="font-display text-6xl md:text-8xl text-brutal-black mb-4 tracking-wider">
          DISPOSABLE<br />
          <span className="text-brutal-orange" style={{ WebkitTextStroke: '3px #1A1A1A' }}>
            EMAIL
          </span>
        </h2>
        <p className="text-xl font-brutal text-brutal-dark">
          Instant temporary email addresses • No signup required
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="card-brutal bg-red-100 border-red-500 mb-6 flex items-center justify-between">
          <span className="text-red-700 font-bold">{error}</span>
          <button onClick={clearError} className="text-red-700 font-bold hover:underline">
            DISMISS
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="card-brutal">
        {/* Domain Selector */}
        <div className="mb-6">
          <label className="block font-bold text-brutal-black mb-2 uppercase tracking-wider">
            Select Domain
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="input-brutal cursor-pointer"
          >
            {domains.map(domain => (
              <option key={domain} value={domain}>@{domain}</option>
            ))}
          </select>
        </div>

        {/* Toggle Mode */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsCustomMode(false)}
            className={`flex-1 py-3 border-4 border-brutal-black font-bold uppercase transition-all
              ${!isCustomMode 
                ? 'bg-brutal-orange text-brutal-black shadow-brutal' 
                : 'bg-brutal-white text-brutal-black hover:bg-brutal-gray'}`}
          >
            Random
          </button>
          <button
            onClick={() => setIsCustomMode(true)}
            className={`flex-1 py-3 border-4 border-brutal-black font-bold uppercase transition-all
              ${isCustomMode 
                ? 'bg-brutal-orange text-brutal-black shadow-brutal' 
                : 'bg-brutal-white text-brutal-black hover:bg-brutal-gray'}`}
          >
            Custom
          </button>
        </div>

        {/* Random or Custom Input */}
        {isCustomMode ? (
          <>
            {/* Reclaim Mode */}
            {isReclaimMode ? (
              <form onSubmit={handleReclaim}>
                <div className="mb-4 p-4 border-4 border-brutal-orange bg-orange-50">
                  <p className="font-bold text-brutal-black mb-2">🔐 RECLAIM YOUR INBOX</p>
                  <p className="text-sm text-brutal-dark">
                    This inbox is protected with a PIN. Enter your PIN to access it.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block font-bold text-brutal-black mb-2 uppercase tracking-wider">
                    Username
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value.replace(/[^a-z0-9._-]/gi, ''))}
                      placeholder="yourname"
                      className="input-brutal flex-1 border-r-0"
                      maxLength={30}
                    />
                    <span className="px-4 py-3 border-4 border-brutal-black bg-brutal-gray font-bold">
                      @{selectedDomain}
                    </span>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block font-bold text-brutal-black mb-2 uppercase tracking-wider">
                    Enter PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={reclaimPin}
                    onChange={(e) => setReclaimPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="••••"
                    className="input-brutal w-full text-center text-2xl tracking-widest"
                    maxLength={8}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsReclaimMode(false); setReclaimPin(''); clearError(); }}
                    className="flex-1 py-3 border-4 border-brutal-black bg-brutal-white font-bold uppercase hover:bg-brutal-gray"
                  >
                    ← BACK
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !reclaimPin}
                    className="flex-1 btn-brutal disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'VERIFYING...' : 'RECLAIM →'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateCustom}>
                <div className="mb-4">
                  <label className="block font-bold text-brutal-black mb-2 uppercase tracking-wider">
                    Custom Username
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value.replace(/[^a-z0-9._-]/gi, ''))}
                      placeholder="yourname"
                      className="input-brutal flex-1 border-r-0"
                      maxLength={30}
                    />
                    <span className="px-4 py-3 border-4 border-brutal-black bg-brutal-gray font-bold">
                      @{selectedDomain}
                    </span>
                  </div>
                  <p className="text-sm text-brutal-dark mt-2">
                    3-30 characters, letters, numbers, dots, hyphens, underscores
                  </p>
                </div>

                {/* PIN Protection Toggle */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setShowPinInput(!showPinInput)}
                    className="flex items-center gap-2 text-brutal-dark hover:text-brutal-black font-bold text-sm uppercase"
                  >
                    <span className={`w-5 h-5 border-3 border-brutal-black flex items-center justify-center ${showPinInput ? 'bg-brutal-orange' : 'bg-brutal-white'}`}>
                      {showPinInput && '✓'}
                    </span>
                    🔐 Set PIN for Recovery (optional)
                  </button>
                  
                  {showPinInput && (
                    <div className="mt-3 p-4 border-4 border-dashed border-brutal-black bg-brutal-gray">
                      <label className="block font-bold text-brutal-black mb-2 uppercase tracking-wider text-sm">
                        PIN (4-8 digits)
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="••••"
                        className="input-brutal w-full text-center text-xl tracking-widest"
                        minLength={4}
                        maxLength={8}
                      />
                      <p className="text-xs text-brutal-dark mt-2">
                        💡 PIN allows you to reclaim this inbox if you lose access
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !customUsername.trim() || (showPinInput && pin && pin.length < 4)}
                  className="btn-brutal w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'CREATING...' : 'CREATE INBOX →'}
                </button>

                {/* Already have PIN? Reclaim button */}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsReclaimMode(true)}
                    className="text-brutal-dark hover:text-brutal-orange font-bold text-sm uppercase underline"
                  >
                    🔐 Already have a PIN? Reclaim your inbox
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div>
            <div className="mb-6 p-4 border-4 border-dashed border-brutal-black bg-brutal-gray text-center">
              <p className="text-brutal-dark">
                Click the button below to generate a random email address
              </p>
            </div>
            <button
              onClick={handleGenerateRandom}
              disabled={loading}
              className="btn-brutal w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'GENERATING...' : 'GENERATE RANDOM EMAIL →'}
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4 mt-12">
        {[
          { icon: '⚡', title: 'INSTANT', desc: 'No signup, no waiting' },
          { icon: '🔒', title: 'PRIVATE', desc: 'Auto-delete in 20 min' },
          { icon: '📧', title: 'REAL-TIME', desc: 'Instant email delivery' }
        ].map((feature, i) => (
          <div key={i} className="card-brutal text-center hover:shadow-brutal-orange transition-shadow">
            <div className="text-4xl mb-2">{feature.icon}</div>
            <h3 className="font-display text-2xl text-brutal-black">{feature.title}</h3>
            <p className="text-brutal-dark text-sm mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Setup Guide Banner */}
      <div className="mt-12 card-brutal bg-brutal-black text-brutal-white text-center">
        <h3 className="font-display text-2xl mb-2">🛠️ WANT TO ADD YOUR OWN DOMAIN?</h3>
        <p className="text-brutal-gray mb-4">
          Panduan lengkap setup email forwarding untuk domain kamu
        </p>
        <Link to="/setup" className="btn-brutal inline-block bg-brutal-orange text-brutal-black">
          📖 BACA SETUP GUIDE →
        </Link>
      </div>
    </div>
  )
}
