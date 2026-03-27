import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
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
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <path d="M3 14l4-5 3 3.5 2.5-4L18 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>StockVault</span>
          </div>
          <h1 className={styles.headline}>Start your<br/>journey today.</h1>
          <p className={styles.subheadline}>Get ₹1,00,000 virtual cash and start trading 50+ real Indian stocks immediately.</p>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>Free</strong><span>Forever</span></div>
            <div className={styles.stat}><strong>IPO</strong><span>Tracker</span></div>
            <div className={styles.stat}><strong>SIP</strong><span>Calculator</span></div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Create account</h2>
          <p className={styles.formSubtitle}>Join thousands of virtual traders</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Full Name</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>👤</span>
                <input type="text" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} required autoFocus/>
              </div>
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>✉️</span>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required/>
              </div>
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password} onChange={set('password')} required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Confirm Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔒</span>
                <input type={showPw ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirm} onChange={set('confirm')} required/>
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading && <span className={styles.spinner}/>}
              {loading ? 'Creating account…' : 'Create Account — Get ₹1,00,000 Free 🎉'}
            </button>
          </form>

          <p className={styles.switchAuth}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}