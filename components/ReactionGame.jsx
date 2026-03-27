'use client'
import { useState, useRef, useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Leaderboard from './Leaderboard';

export default function ReactionGame() {
  const { data: session } = useSession();
  const [gameState, setGameState] = useState('idle'); 
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempts, setAttempts] = useState(3);
  const [targets, setTargets] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' for visual flashing
  const [loading, setLoading] = useState(true);

  const loopRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch initial attempts/stats from server
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.attemptsLeft !== undefined) {
          setAttempts(data.attemptsLeft);
        }
      } catch (e) {
        console.error("Failed to fetch session stats", e);
      }
      setLoading(false);
    }
    if (session) fetchStats();
  }, [session]);

  const updateServerStats = async (newScore, decAttempt = false) => {
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: newScore, updateAttempt: decAttempt })
      });
      const data = await res.json();
      if (data.attemptsLeft !== undefined) {
        setAttempts(data.attemptsLeft);
      }
    } catch (e) {
      console.error("Failed to update server stats", e);
    }
  };

  const getDifficulty = (time) => {
    if (time > 40) return { spawnRate: 900, life: 2000, distractorChance: 0.1, speedAnim: '4s' };
    if (time > 20) return { spawnRate: 650, life: 1500, distractorChance: 0.25, speedAnim: '2.5s' };
    return { spawnRate: 400, life: 900, distractorChance: 0.4, speedAnim: '1.2s' };
  };

  const spawnTarget = useCallback(() => {
    if (gameState !== 'playing') return;
    
    setTargets(prev => {
      if (prev.length > 8) return prev;
      
      const difficulty = getDifficulty(timeLeft);
      const isDistractor = Math.random() < difficulty.distractorChance;
      
      const newTarget = {
        id: Math.random().toString(36).substr(2, 9),
        isDistractor,
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 65) + 15,
        animClass: `float-${Math.floor(Math.random() * 4) + 1}`,
        speedAnim: difficulty.speedAnim
      };

      setTimeout(() => {
        setTargets(current => current.filter(t => t.id !== newTarget.id));
      }, difficulty.life);

      return [...prev, newTarget];
    });
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const difficulty = getDifficulty(timeLeft);
      loopRef.current = setTimeout(spawnTarget, difficulty.spawnRate);
    } else if (timeLeft <= 0 && gameState === 'playing') {
      endGame();
    }
    return () => clearTimeout(loopRef.current);
  }, [gameState, timeLeft, spawnTarget]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const startGame = async () => {
    if (attempts <= 0) return;
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setTargets([]);
    // Immediately deduct attempt on server
    await updateServerStats(undefined, true);
  };

  const endGame = async () => {
    setGameState('result');
    setTargets([]);
    clearTimeout(loopRef.current);
    clearInterval(timerRef.current);
    // Submit final score
    await updateServerStats(score);
  };

  const handleTargetClick = (e, target) => {
    e.stopPropagation();
    if (target.isDistractor) {
      setScore(s => Math.max(0, s - 15));
      setFeedback('wrong');
    } else {
      setScore(s => s + 10);
      setFeedback('correct');
    }
    setTimeout(() => setFeedback(null), 150);
    setTargets(prev => prev.filter(t => t.id !== target.id));
  };

  const handleMissClick = () => {
    if (gameState === 'playing') {
      setScore(s => Math.max(0, s - 5));
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 150);
    }
  };

  if (loading) {
    return (
      <div className="app-container state-idle flex items-center justify-center">
        <p className="glitch-title loading-text pulse-fast" data-text="LOADING DATA...">LOADING DATA...</p>
      </div>
    );
  }

  return (
    <div className={`app-container state-${gameState} overflow-y-auto`} onPointerDown={handleMissClick} style={{ height: '100vh' }}>
      <div className={`bg-grid ${feedback === 'wrong' ? 'bg-red-overlay' : feedback === 'correct' ? 'bg-green-overlay' : ''}`}></div>
      <div className="vignette"></div>

      <header className="hud-header">
        <div className="logo-container">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">REACT<span>ION</span></div>
        </div>
        <div className="hud-stats flex items-center gap-8">
          {gameState === 'playing' && (
            <div className="flex gap-4">
              <div className="text-xl font-bold text-accent">TIME: {timeLeft}s</div>
              <div className="text-xl font-bold text-green">SCORE: {score}</div>
            </div>
          )}
          <div className="flex flex-col items-end">
            <div className="hud-label">ENERGY (PLAYS TODAY)</div>
            <div className="energy-bars">
              {[1, 2, 3].map(i => (
                <div key={i} className={`energy-bar ${i <= attempts ? 'active' : 'depleted'}`}></div>
              ))}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); signOut(); }} 
              className="text-xs text-muted mt-2 hover:text-red transition-colors font-bold uppercase tracking-widest"
              style={{ padding: '0.2rem 0.5rem', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <main className="game-screen py-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {gameState === 'idle' && (
          <div className="screen-content intro-screen" style={{ zIndex: 30 }}>
            <h1 className="glitch-title" data-text={attempts > 0 ? "SYSTEM READY" : "OUT OF ENERGY"} style={{ fontSize: '3.5rem' }}>
              {attempts > 0 ? "SYSTEM READY" : "OUT OF ENERGY"}
            </h1>
            <p className="instruction-text px-4">
              {attempts > 0 
                ? "Tap the ORBS as fast as possible. Avoid RED DISTRACTORS." 
                : "You have used all 3 plays for today. Come back tomorrow!"}
            </p>
            {attempts > 0 ? (
               <button className="game-btn start-btn pulse-glow mt-4" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ padding: '1.5rem 3rem' }}>
               INITIATE SEQUENCE [60s]
             </button>
            ) : (
              <div className="game-btn secondary-btn cursor-not-allowed text-muted mt-4">ENERGY DEPLETED</div>
            )}
            
            <Leaderboard />
          </div>
        )}

        {gameState === 'playing' && (
          <div className="target-container w-full h-full absolute inset-0 overflow-hidden" style={{ zIndex: 40 }}>
            {targets.map((t) => (
              <button 
                key={t.id}
                className={`moving-target ${t.isDistractor ? 'target-distractor' : 'target-green pulse-glow'} ${t.animClass}`}
                style={{ 
                  left: `${t.x}%`, 
                  top: `${t.y}%`, 
                  '--anim-dur': t.speedAnim,
                  position: 'absolute'
                }}
                onPointerDown={(e) => handleTargetClick(e, t)}
              ></button>
            ))}
          </div>
        )}

        {gameState === 'result' && (
          <div className="screen-content result-screen z-20 px-4 py-8 overflow-y-auto">
            <h2 style={{ color: '#00f3ff', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '1rem' }}>FINAL SCORE</h2>
            <div className="score-display">
              <span className="score-value">{score}</span>
              <span className="score-unit">PTS</span>
            </div>
            
            <div className="glass-panel mt-8 mx-auto" style={{ maxWidth: '400px' }}>
              <h3 className="panel-title">SESSION STATUS</h3>
              <div className="lb-row highlight flex justify-between p-4 bg-accent-overlay">
                <span className="name text-accent font-bold">PLAYS LEFT TODAY:</span>
                <span className="time text-accent font-bold" style={{ fontSize: '1.2rem' }}>{attempts} / 3</span>
              </div>
            </div>

            <div className="actions-row mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {attempts > 0 ? (
                <button className="game-btn start-btn pulse-glow" onClick={(e) => { e.stopPropagation(); startGame(); }} style={{ minWidth: '200px' }}>
                  PLAY AGAIN
                </button>
              ) : (
                <div className="game-btn secondary-btn cursor-not-allowed">OUT OF ENERGY</div>
              )}
              <button className="game-btn secondary-btn" onClick={(e) => { e.stopPropagation(); setGameState('idle'); }} style={{ minWidth: '200px' }}>
                BACK TO HUB
              </button>
            </div>

            <div className="mt-12 w-full max-w-lg mx-auto">
              <Leaderboard />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
