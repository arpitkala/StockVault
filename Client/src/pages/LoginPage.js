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
          <h1 className={styles.headline}>Trade smarter.<br/>Grow faster.</h1>
          <p className={styles.subheadline}>Practice stock trading with ₹1,00,000 virtual money. Real NSE/BSE prices, zero risk.</p>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>50+</strong><span>NSE Stocks</span></div>
            <div className={styles.stat}><strong>Live</strong><span>Prices</span></div>
            <div className={styles.stat}><strong>₹1L</strong><span>Free Balance</span></div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Welcome back</h2>
          <p className={styles.formSubtitle}>Sign in to your account</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Email</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>✉️</span>
                <input
                  type="email" placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required autoFocus
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading && <span className={styles.spinner}/>}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className={styles.demo}>
            <p>Demo Account</p>
            <button onClick={() => setForm({ email: 'demo@stockvault.in', password: 'demo123' })}>
              Use demo credentials →
            </button>
          </div>

          <p className={styles.switchAuth}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}