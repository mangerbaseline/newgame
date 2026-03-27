'use client'
import { useState, useEffect } from 'react'

export default function Leaderboard() {
  const [period, setPeriod] = useState('daily')
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScores() {
      setLoading(true)
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`)
        const data = await res.json()
        setScores(data)
      } catch (e) {
        console.error("Failed to fetch leaderboard", e)
      }
      setLoading(false)
    }
    fetchScores()
  }, [period])

  return (
    <div className="glass-panel w-full max-w-lg mx-auto mt-8 mb-8 p-6" style={{ minHeight: '400px' }}>
      <h3 className="panel-title text-accent mb-6" style={{ textAlign: 'center', fontSize: '1.2rem' }}>GLOBAL RANKINGS</h3>
      
      <div className="flex gap-2 mb-6 justify-center">
        {['daily', 'weekly', 'monthly'].map((p) => (
          <button 
            key={p} 
            onClick={() => setPeriod(p)}
            className={`game-btn ${period === p ? 'start-btn' : 'secondary-btn'}`}
            style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', flex: 1 }}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="leaderboard-list">
        {loading ? (
          <p className="text-center text-muted animate-pulse py-8">SYNCHRONIZING...</p>
        ) : scores.length === 0 ? (
          <p className="text-center text-muted py-8">NO DATA TRANSMITTED YET</p>
        ) : (
          scores.map((s, index) => (
            <div key={s._id} className={`lb-row ${index === 0 ? 'highlight' : ''}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 0.5rem' }}>
              <span className="rank text-accent" style={{ minWidth: '30px' }}>#{index + 1}</span>
              <span className="name text-white font-bold" style={{ flex: 1, textAlign: 'left', paddingLeft: '1rem' }}>{s.userName.toUpperCase()}</span>
              <span className="score text-green font-bold">{s.maxScore} <span className="text-xs text-muted">PTS</span></span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
