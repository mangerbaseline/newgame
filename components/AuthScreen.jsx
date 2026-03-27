'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const router = useRouter()

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password })
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Registration failed')
        setLoading(false)
        return
      }
    }

    const res = await signIn('credentials', {
      redirect: false,
      email: formData.email,
      password: formData.password
    })

    if (res.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    border: '1px solid rgba(0, 243, 255, 0.3)',
    borderRadius: '4px',
    fontFamily: "'Chakra Petch', sans-serif",
    letterSpacing: '2px',
    outline: 'none',
    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8)',
    marginBottom: '1rem',
    transition: 'border 0.3s ease, box-shadow 0.3s ease'
  }

  return (
    <div className="app-container state-idle" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="bg-grid"></div>
      <div className="vignette"></div>
      <header className="hud-header">
        <div className="logo-container">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">REACT<span>ION</span></div>
        </div>
      </header>
      <main className="game-screen" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="screen-content intro-screen glass-panel relative z-10" style={{ maxWidth: '400px', width: '90%', padding: '2.5rem', textAlign: 'center' }}>
          <h2 className="glitch-title" data-text={isLogin ? "LOGIN" : "REGISTER"} style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>
            {isLogin ? "LOGIN" : "REGISTER"}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            {error && <p style={{ color: '#ff073a', fontWeight: 'bold', fontSize: '0.9rem', backgroundColor: 'rgba(255, 7, 58, 0.1)', border: '1px solid #ff073a', padding: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>{error}</p>}
            
            {!isLogin && (
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="USERNAME" required style={inputStyle} />
            )}
            
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="USER@NETWORK.COM" required style={inputStyle} />
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="PASSWORD" required style={inputStyle} />
            
            {!isLogin && (
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="CONFIRM PASSWORD" required style={inputStyle} />
            )}
            
            <button type="submit" disabled={loading} className="game-btn start-btn pulse-glow" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'PROCESSING...' : (isLogin ? 'ENTER NETWORK' : 'INITIALIZE ACCOUNT')}
            </button>
          </form>

          <p style={{ marginTop: '2rem', color: '#8b949e', fontSize: '0.85rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }} onClick={() => { setIsLogin(!isLogin); setError(null); setFormData({ name: '', email: '', password: '', confirmPassword: '' }); }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}>
            {isLogin ? "NO ACCESS? REGISTER HERE" : "HAVE CLEARANCE? LOGIN HERE"}
          </p>
        </div>
      </main>
    </div>
  )
}
