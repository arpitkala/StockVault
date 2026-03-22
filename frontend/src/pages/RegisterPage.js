import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function RegisterPage() {
  const [form, setForm]       = useState({ name:'', email:'', password:'', confirm:'', referralCode:'' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.referralCode || undefined);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <div className={styles.page}>
      {/* LEFT PANEL */}
      <div className={styles.leftPanel}>
        <div className={styles.bgGrid}/>
        <div className={styles.bgGlow}/>
        <div className={styles.ring} style={{ width:280, height:280 }}/>
        <div className={styles.ring} style={{ width:420, height:420, animationDelay:'.8s' }}/>
        <div className={styles.ring} style={{ width:560, height:560, animationDelay:'1.6s' }}/>

        <div className={styles.floatCard} style={{ top:'14%', left:'60%', animationDelay:'0s', animationDuration:'4s' }}>
          <span className={styles.fcSym}>FREE</span>
          <span className={styles.fcVal}>₹1,00,000</span>
          <span className={styles.fcUp}>Virtual Cash</span>
        </div>
        <div className={styles.floatCard} style={{ top:'68%', left:'56%', animationDelay:'1.5s', animationDuration:'5s' }}>
          <span className={styles.fcSym}>IPO</span>
          <span className={styles.fcVal}>OPEN</span>
          <span className={styles.fcUp}>Apply Now</span>
        </div>
        <div className={styles.floatCard} style={{ top:'44%', left:'63%', animationDelay:'.8s', animationDuration:'4.5s' }}>
          <span className={styles.fcSym}>F&O</span>
          <span className={styles.fcVal}>Options</span>
          <span className={styles.fcUp}>Chain Live</span>
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
            JOIN 1000+ VIRTUAL TRADERS
          </div>

          <h1 className={styles.headline}>
            Start your<br/><span>trading</span><br/>journey today.
          </h1>
          <p className={styles.subheadline}>
            Get ₹1,00,000 virtual cash instantly. Trade 50+ real Indian stocks, apply for IPOs, invest in mutual funds — all for free.
          </p>

          <div className={styles.featureList}>
            {[
              '✓ ₹1,00,000 virtual balance on signup',
              '✓ Real NSE/BSE prices via WebSocket',
              '✓ F&O Options Chain trading',
              '✓ IPO applications & SIP calculator',
              '✓ Refer friends & earn ₹599 each',
            ].map((f, i) => (
              <div key={i} className={styles.featItem}>{f}</div>
            ))}
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
          <h2 className={styles.formTitle}>Create account 🎉</h2>
          <p className={styles.formSubtitle}>Get ₹1,00,000 free virtual balance</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Full Name</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input type="text" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} required autoFocus/>
              </div>
            </div>

            <div className={styles.field}>
              <label>Email Address</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                </span>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required/>
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
                <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.password} onChange={set('password')} required/>
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label>Confirm Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <input type={showPw ? 'text' : 'password'} placeholder="Re-enter password"
                  value={form.confirm} onChange={set('confirm')} required/>
              </div>
            </div>

            <div className={styles.field}>
              <label>Referral Code <span style={{ color:'rgba(255,255,255,.3)', fontWeight:400, textTransform:'none', fontSize:11 }}>(optional)</span></label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                </span>
                <input type="text" placeholder="Enter referral code (e.g. SVCA0BE6)"
                  value={form.referralCode} onChange={set('referralCode')}/>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading && <span className={styles.spinner}/>}
              {loading ? 'Creating account…' : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  Create Account — Get ₹1,00,000 Free
                </>
              )}
            </button>
          </form>

          <p className={styles.switchAuth}>
            Already have an account? <Link to="/login">Sign in</Link>
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