import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';

export default function ReferralPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    // Scroll to top immediately on mount
    document.getElementById('main-content')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });

    authService.getReferralStats()
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Failed to load referral stats'))
      .finally(() => setLoading(false));
  }, []);

  const code         = stats?.referralCode || user?.referralCode || '';
  const referralLink = `${window.location.origin}/register?ref=${code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
`🚀 Open your FREE Demat & Trading Account on *StockVault*!

Trade smarter with India's best virtual trading platform 📈

You will get:
✅ Virtual ₹1,00,000 to start trading 💹
✅ Real-time stock prices & charts ⚡
✅ IPO, SIP & Mutual Funds access 💰
✅ Zero brokerage on all trades 🎯

👉 Register using my referral link & we *both earn ₹599*!
⬇️ Sign up here:
${referralLink}

Use referral code: *${code}*

_Link valid for limited time_
_T&C Apply_`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const s = {
    page:        { fontFamily: 'var(--font)' },
    back:        { fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 },
    card:        { background: 'var(--surface-0)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 },
    banner:      { background: 'linear-gradient(135deg,#003d2b 0%,#001a12 100%)', padding: '28px 24px' },
    bannerTitle: { fontSize: 24, fontWeight: 800, marginBottom: 6 },
    bannerSub:   { fontSize: 14, color: 'var(--text-3)', lineHeight: 1.5 },
    statsRow:    { display: 'flex', borderTop: '1px solid var(--line)' },
    statBox:     { flex: 1, padding: '20px 16px', textAlign: 'center', borderRight: '1px solid var(--line)' },
    statVal:     { fontSize: 26, fontWeight: 800, fontFamily: 'var(--mono)', marginBottom: 4 },
    statLabel:   { fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' },
    section:     { padding: '20px 24px' },
    sectionBorder: { padding: '20px 24px', borderTop: '1px solid var(--line)' },
    label:       { fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 },
    codeWrap:    { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    code:        { padding: '14px 24px', background: 'var(--surface-1)', border: '2px dashed var(--brand)', borderRadius: 'var(--radius-sm)', fontSize: 24, fontWeight: 800, fontFamily: 'var(--mono)', letterSpacing: 4, color: 'var(--brand)' },
    copyBtn:     { padding: '14px 20px', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .15s', whiteSpace: 'nowrap' },
    shareRow:    { display: 'flex', gap: 10, flexWrap: 'wrap' },
    waBtn:       { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', minWidth: 160 },
    linkBtn:     { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', background: 'var(--surface-2)', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', color: 'var(--text-2)', minWidth: 120 },
    howSteps:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 },
    howStep:     { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 },
    howIcon:     { width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
    howText:     { fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 },
    friendRow:   { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' },
    avatar:      { width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    badge:       (done) => ({ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap', background: done ? 'var(--up-bg)' : 'var(--warn-bg)', color: done ? 'var(--up)' : '#f39c12' }),
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTop: '3px solid var(--brand)', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="fade-up" style={s.page}>

      {/* Back */}
      <div style={s.back} onClick={() => navigate('/profile')}>
        ← Back to My Account
      </div>

      {/* Hero banner + stats */}
      <div style={s.card}>
        <div style={s.banner}>
          <div style={s.bannerTitle}>🎁 Refer & Earn ₹599</div>
          <div style={s.bannerSub}>
            Invite your friends to StockVault. When they register and complete KYC,<br/>
            you earn <strong style={{ color: 'var(--brand)' }}>₹599</strong> credited directly to your trading balance.
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={s.statBox}>
            <div style={s.statVal}>{stats?.referralCount ?? 0}</div>
            <div style={s.statLabel}>Friends Referred</div>
          </div>
          <div style={s.statBox}>
            <div style={{ ...s.statVal, color: 'var(--brand)' }}>
              {formatCurrency(stats?.referralEarnings ?? 0)}
            </div>
            <div style={s.statLabel}>Total Earned</div>
          </div>
          <div style={{ ...s.statBox, borderRight: 'none' }}>
            <div style={s.statVal}>
              {stats?.referredUsers?.filter(u => u.kycCompleted).length ?? 0}
            </div>
            <div style={s.statLabel}>KYC Completed</div>
          </div>
        </div>
      </div>

      {/* Referral code + share */}
      <div style={s.card}>
        <div style={s.section}>
          <div style={s.label}>Your Referral Code</div>
          <div style={s.codeWrap}>
            <div style={s.code}>{code || '------'}</div>
            <button
              style={{ ...s.copyBtn, background: copied ? 'var(--up)' : 'var(--brand)' }}
              onClick={copyCode}
            >
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>
          </div>
        </div>

        <div style={s.sectionBorder}>
          <div style={s.label}>Share With Friends</div>
          <div style={s.shareRow}>
            <button style={s.waBtn} onClick={shareWhatsApp}>💬 Share on WhatsApp</button>
            <button style={s.linkBtn} onClick={copyLink}>🔗 Copy Referral Link</button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={s.card}>
        <div style={s.section}>
          <div style={s.label}>How It Works</div>
          <div style={s.howSteps}>
            {[
              { icon: '📤', text: 'Share your referral code or link with friends' },
              { icon: '📝', text: 'Friend registers on StockVault using your code' },
              { icon: '✅', text: 'Friend completes KYC verification' },
              { icon: '💰', text: '₹599 gets credited to your trading balance!' },
            ].map((step, i) => (
              <div key={i} style={s.howStep}>
                <div style={s.howIcon}>{step.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>Step {i + 1}</div>
                <div style={s.howText}>{step.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Terms */}
      <div style={s.card}>
        <div style={s.section}>
          <div style={s.label}>Terms & Conditions</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.8 }}>
            • Referral bonus of ₹599 is credited only after the referred user completes KYC.<br/>
            • Each user can only be referred once — duplicate referrals are not counted.<br/>
            • Referral bonus is added directly to your trading balance.<br/>
            • StockVault reserves the right to modify or cancel the referral program at any time.<br/>
            • Self-referrals are not allowed and will be disqualified.<br/>
            • T&C Apply.
          </div>
        </div>
      </div>

      {/* Referred friends list */}
      {stats?.referredUsers?.length > 0 && (
        <div style={s.card}>
          <div style={s.section}>
            <div style={s.label}>Referred Friends ({stats.referredUsers.length})</div>
            {stats.referredUsers.map((u, i) => (
              <div key={i} style={{
                ...s.friendRow,
                ...(i === stats.referredUsers.length - 1 ? { borderBottom: 'none' } : {}),
              }}>
                <div style={s.avatar}>{u.name?.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={s.badge(u.kycCompleted)}>
                  {u.kycCompleted ? '✓ ₹599 Credited' : '⏳ KYC Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats?.referredUsers?.length === 0 && (
        <div style={s.card}>
          <div style={{ ...s.section, textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No referrals yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
              Share your referral code and start earning ₹599 per friend!
            </div>
            <button style={{ ...s.waBtn, display: 'inline-flex', minWidth: 'auto' }} onClick={shareWhatsApp}>
              💬 Share on WhatsApp
            </button>
          </div>
        </div>
      )}

    </div>
  );
}