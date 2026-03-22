import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function LoginPage() {
  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPassword, setShowPw] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      {/* LEFT PANEL */}
      <div className={styles.leftPanel}>
        <div className={styles.bgGrid}/>
        <div className={styles.bgGlow}/>
        <div className={styles.ring} style={{ width:280, height:280 }}/>
        <div className={styles.ring} style={{ width:420, height:420, animationDelay:'.8s' }}/>
        <div className={styles.ring} style={{ width:560, height:560, animationDelay:'1.6s' }}/>

        {/* Floating cards */}
        <div className={styles.floatCard} style={{ top:'14%', left:'60%', animationDelay:'0s', animationDuration:'4s' }}>
          <span className={styles.fcSym}>RELIANCE</span>
          <span className={styles.fcVal}>₹2,964</span>
          <span className={styles.fcUp}>+1.22%</span>
        </div>
        <div className={styles.floatCard} style={{ top:'70%', left:'56%', animationDelay:'1.5s', animationDuration:'5s' }}>
          <span className={styles.fcSym}>NIFTY 50</span>
          <span className={styles.fcVal}>22,531</span>
          <span className={styles.fcDn}>-0.25%</span>
        </div>
        <div className={styles.floatCard} style={{ top:'44%', left:'63%', animationDelay:'.8s', animationDuration:'4.5s' }}>
          <span className={styles.fcSym}>TCS</span>
          <span className={styles.fcVal}>₹4,159</span>
          <span className={styles.fcUp}>+1.03%</span>
        </div>

        <div className={styles.leftContent}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
                <path d="M3 14l4-5 3 3.5 2.5-4L18 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className={styles.logoText}>StockVault</span>
          </div>

          <div className={styles.liveBadge}>
            <div className={styles.pulseDot}/>
            NSE LIVE · REAL-TIME PRICES
          </div>

          <h1 className={styles.headline}>
            India's smartest<br/>virtual <span>trading</span><br/>platform.
          </h1>
          <p className={styles.subheadline}>
            Practice with ₹1,00,000 virtual balance. Real market prices, F&O options chain, IPO applications — zero risk, unlimited learning.
          </p>

          {/* Animated chart */}
          <div className={styles.chartWrap}>
            <svg width="340" height="72" viewBox="0 0 340 72" fill="none">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d09c" stopOpacity=".2"/>
                  <stop offset="100%" stopColor="#00d09c" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0 62 C15 57,30 50,50 44 C70 38,80 52,100 43 C120 34,130 20,150 18 C170 16,180 30,200 24 C220 18,232 7,252 5 C272 3,290 12,310 10 L340 8 L340 72 L0 72Z" fill="url(#lg)"/>
              <path d="M0 62 C15 57,30 50,50 44 C70 38,80 52,100 43 C120 34,130 20,150 18 C170 16,180 30,200 24 C220 18,232 7,252 5 C272 3,290 12,310 10 L340 8"
                stroke="#00d09c" strokeWidth="2.5" fill="none"
                strokeDasharray="500" strokeDashoffset="500">
                <animate attributeName="strokeDashoffset" from="500" to="0" dur="2s" fill="freeze"/>
              </path>
              <circle cx="340" cy="8" r="4" fill="#00d09c" opacity="0">
                <animate attributeName="opacity" values="0;1" begin="1.8s" dur=".3s" fill="freeze"/>
                <animate attributeName="r" values="4;6;4" begin="2.2s" dur="1.2s" repeatCount="indefinite"/>
              </circle>
              <rect x="288" y="0" width="52" height="18" rx="5" fill="#00d09c" opacity="0">
                <animate attributeName="opacity" values="0;1" begin="2s" dur=".4s" fill="freeze"/>
              </rect>
              <text x="314" y="12" textAnchor="middle" fontSize="10" fontWeight="700" fill="#07090f" fontFamily="monospace" opacity="0">
                +2.4%
                <animate attributeName="opacity" values="0;1" begin="2s" dur=".4s" fill="freeze"/>
              </text>
            </svg>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statItem} style={{ paddingRight:20 }}>
              <div className={styles.statVal}>50+</div>
              <div className={styles.statLbl}>NSE Stocks</div>
            </div>
            <div className={styles.statItem} style={{ padding:'0 20px' }}>
              <div className={styles.statVal} style={{ color:'#00d09c' }}>₹1L</div>
              <div className={styles.statLbl}>Free Balance</div>
            </div>
            <div className={styles.statItem} style={{ padding:'0 20px' }}>
              <div className={styles.statVal}>F&O</div>
              <div className={styles.statLbl}>Options</div>
            </div>
            <div className={styles.statItem} style={{ paddingLeft:20, borderRight:'none' }}>
              <div className={styles.statVal} style={{ color:'#00d09c' }}>Live</div>
              <div className={styles.statLbl}>WebSocket</div>
            </div>
          </div>

          {/* Scrolling ticker */}
          <div className={styles.tickerWrap}>
            <div className={styles.tickerInner}>
              {[...Array(2)].map((_, ri) => (
                <React.Fragment key={ri}>
                  {[
                    { sym:'RELIANCE', val:'₹2,964', chg:'+1.22%', up:true },
                    { sym:'TCS',      val:'₹4,159', chg:'+1.03%', up:true },
                    { sym:'NIFTY50',  val:'22,531', chg:'-0.25%', up:false },
                    { sym:'SENSEX',   val:'74,446', chg:'+0.32%', up:true },
                    { sym:'HDFCBANK', val:'₹1,785', chg:'-3.59%', up:false },
                    { sym:'INFY',     val:'₹1,927', chg:'+0.57%', up:true },
                    { sym:'SBIN',     val:'₹839',   chg:'+5.45%', up:true },
                    { sym:'ITC',      val:'₹454',   chg:'-2.76%', up:false },
                  ].map((t, i) => (
                    <div key={`${ri}-${i}`} className={styles.tickItem}>
                      <span className={styles.tickSym}>{t.sym}</span>
                      <span className={styles.tickVal}>{t.val}</span>
                      <span className={t.up ? styles.fcUp : styles.fcDn}>{t.chg}</span>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.rightPanel}>
        <div className={styles.rgtGlow1}/>
        <div className={styles.rgtGlow2}/>
        <div className={styles.rgtLines}/>
        <div className={styles.rgtAccent}/>
        <svg className={styles.rgtDeco} height="80" viewBox="0 0 440 80" preserveAspectRatio="none" fill="none">
          <path d="M0 70 C40 60,80 65,120 50 C160 35,180 55,220 40 C260 25,280 10,320 8 C360 6,400 18,440 15 L440 80 L0 80Z" fill="#00d09c"/>
        </svg>

        <div className={styles.formCard}>
          {/* Mini stats */}
          <div className={styles.miniStats}>
            {[
              { v:'₹1L', l:'Free balance', c:'#00d09c' },
              { v:'50+', l:'Stocks',       c:'#fff'    },
              { v:'Live',l:'Prices',       c:'#00d09c' },
            ].map(s => (
              <div key={s.l} className={styles.miniStat}>
                <div className={styles.miniStatV} style={{ color: s.c }}>{s.v}</div>
                <div className={styles.miniStatL}>{s.l}</div>
              </div>
            ))}
          </div>

          <h2 className={styles.formTitle}>Welcome back 👋</h2>
          <p className={styles.formSubtitle}>Sign in to your StockVault account</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Email Address</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                </span>
                <input type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  required autoFocus/>
              </div>
            </div>

            <div className={styles.field}>
              <label>Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  required/>
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPassword)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading && <span className={styles.spinner}/>}
              {loading ? 'Signing in…' : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M14 12H3"/>
                  </svg>
                  Sign In to StockVault
                </>
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <div className={styles.divLine}/><span className={styles.divText}>or</span><div className={styles.divLine}/>
          </div>

          <button className={styles.demoBtn} onClick={() => setForm({ email:'demo@stockvault.in', password:'demo123' })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Quick Demo — No signup needed
          </button>

          <p className={styles.switchAuth}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>

          {/* Developer badge */}
          <div className={styles.badgeRow}>
            <a href="https://www.linkedin.com/in/arpit-kala-8a9a66375" target="_blank" rel="noopener noreferrer" className={styles.devBadge}>
              <div className={styles.devAvatar}>AK</div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(0,208,156,.7)">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              <span>Built by Arpit Kala</span>
            </a>
          </div>

          {/* Security badges */}
          <div className={styles.secRow}>
            <div className={styles.secBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              256-bit SSL
            </div>
            <div className={styles.secDot}/>
            <div className={styles.secBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Real-time data
            </div>
            <div className={styles.secDot}/>
            <div className={styles.secBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Zero risk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}