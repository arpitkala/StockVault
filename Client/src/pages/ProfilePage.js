import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/stockService';
import api from '../services/stockService';
import { formatCurrency, getInitials } from '../utils/helpers';
import styles from './Profile.module.css';

// ── ADD FUNDS MODAL ──────────────────────────────────────────────────────────
function AddFundsModal({ balance, onClose, onSuccess }) {
  const [amount,       setAmount]      = useState('');
  const [method,       setMethod]      = useState('UPI_QR');
  const [upiId,        setUpiId]       = useState('');
  const [loading,      setLoading]     = useState(false);
  const [qrGenerated,  setQrGenerated] = useState(false);
  const [showAddBank,  setShowAddBank] = useState(false);
  const [bankName,     setBankName]    = useState('AXIS BANK');
  const [accNo,        setAccNo]       = useState('');
  const [ifsc,         setIfsc]        = useState('');
  const [bankSaved,    setBankSaved]   = useState(false);
  const QUICK = [500, 1000, 5000, 10000];
  const BANKS = ['HDFC Bank','ICICI Bank','SBI','Axis Bank','Kotak Bank','PNB','BOB','Canara Bank','IndusInd Bank','Yes Bank'];

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handleRazorpay = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error('Minimum deposit is ₹100'); return; }
    const rzpKey = process.env.REACT_APP_RAZORPAY_KEY;
    if (!rzpKey) { toast.error('Razorpay key not configured in .env'); return; }
    toast.loading('Opening Razorpay...', { id: 'rzp' });
    const loaded = await loadRazorpay();
    toast.dismiss('rzp');
    if (!loaded) { toast.error('Could not load Razorpay. Check internet connection.'); return; }
    try {
      const options = {
        key: rzpKey, amount: amt * 100, currency: 'INR',
        name: 'StockVault', description: 'Add Trading Funds', image: '',
        handler: async (response) => {
          setLoading(true);
          try {
            const { data } = await api.post('/wallet/deposit', {
              amount: amt, method: 'UPI',
              upiId: response.razorpay_payment_id,
              note: `Razorpay: ${response.razorpay_payment_id}`,
            });
            toast.success(`₹${amt.toLocaleString('en-IN')} added successfully! 🎉`);
            onSuccess(data.newBalance); onClose();
          } catch { toast.error('Payment done but failed to credit. Contact support.'); }
          finally { setLoading(false); }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#00d09c' },
        modal: { ondismiss: () => toast('Payment cancelled', { icon: 'ℹ️' }), escape: true, backdropclose: false },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => toast.error(`Payment failed: ${response.error.description}`));
      rzp.open();
    } catch (err) { toast.error('Failed to open Razorpay: ' + err.message); }
  };

  const handleManualDeposit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error('Minimum deposit is ₹100'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/deposit', {
        amount: amt, method: method === 'NET_BANKING' ? 'BANK' : 'UPI', upiId: upiId || undefined,
      });
      toast.success(data.message || `₹${amt.toLocaleString('en-IN')} added!`);
      onSuccess(data.newBalance); onClose();
    } catch (e) { toast.error(e.response?.data?.error || 'Deposit failed'); }
    finally { setLoading(false); }
  };

  const qrMatrix = React.useMemo(() => {
    const size = 21;
    const mat = Array(size).fill(null).map(() => Array(size).fill(0));
    [[0,0],[0,14],[14,0]].forEach(([r,c]) => {
      for (let i=0;i<7;i++) for (let j=0;j<7;j++) {
        if (i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4)) mat[r+i][c+j]=1;
      }
    });
    for (let i=8;i<13;i++) { mat[6][i]=(i%2===0?1:0); mat[i][6]=(i%2===0?1:0); }
    let seed = amount ? parseInt(amount)*7+13 : 42;
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) {
      if (mat[r][c]===0) { seed=(seed*1664525+1013904223)&0xffffffff; mat[r][c]=(seed>>>31); }
    }
    return mat;
  }, [amount]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>Add Funds</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.mField}>
            <label className={styles.mLabel}>Amount <span style={{color:'var(--text-3)',fontWeight:400,fontSize:11}}>(Min ₹100)</span></label>
            <div className={styles.mAmtWrap}>
              <span className={styles.mRupee}>₹</span>
              <input type="number" min="100" className={styles.mAmtInput}
                placeholder="Enter amount to add" value={amount}
                onChange={e => { setAmount(e.target.value); setQrGenerated(false); }} autoFocus/>
            </div>
            <div className={styles.quickRow}>
              {QUICK.map(q => (
                <button key={q} className={`${styles.quickBtn} ${Number(amount)===q?styles.quickActive:''}`}
                  onClick={() => { setAmount(String(q)); setQrGenerated(false); }}>
                  + ₹{q.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.mField}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <label className={styles.mLabel}>Registered Bank Account</label>
              <button className={styles.manageBankBtn} onClick={() => setShowAddBank(!showAddBank)}>
                {showAddBank ? '✕ Cancel' : '+ Add Bank'}
              </button>
            </div>
            {!showAddBank ? (
              <div className={styles.bankRow}>
                <span className={styles.bankIcon}>🏦</span>
                <span className={styles.bankName}>
                  {bankSaved ? `${bankName.toUpperCase()} - XXXX ${accNo.slice(-4)}` : 'AXIS BANK - XXXX 0144'}
                </span>
                <button className={styles.changeBankBtn} onClick={() => setShowAddBank(true)}>Change</button>
              </div>
            ) : (
              <div className={styles.addBankForm}>
                <div className={styles.mField}>
                  <label className={styles.mLabel}>Select Bank</label>
                  <select className={styles.bankSelect} value={bankName} onChange={e => setBankName(e.target.value)}>
                    {BANKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className={styles.mField}>
                  <label className={styles.mLabel}>Account Number</label>
                  <input type="text" placeholder="Enter account number" className={styles.mTextInput}
                    value={accNo} onChange={e => setAccNo(e.target.value)}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div className={styles.mField}>
                    <label className={styles.mLabel}>IFSC Code</label>
                    <input type="text" placeholder="e.g. HDFC0001234" className={styles.mTextInput}
                      value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())}/>
                  </div>
                  <div className={styles.mField}>
                    <label className={styles.mLabel}>&nbsp;</label>
                    <button className={styles.saveBankBtn} onClick={() => {
                      if (!accNo||!ifsc) { toast.error('Fill all bank details'); return; }
                      setBankSaved(true); setShowAddBank(false); toast.success('Bank account saved!');
                    }}>Save Bank</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.mField}>
            <label className={styles.mLabel}>Payment Method</label>
            <div className={styles.methodTabs}>
              {[
                {key:'UPI_QR',      label:'📱 UPI QR'},
                {key:'UPI_ID',      label:'💳 UPI ID'},
                {key:'NET_BANKING', label:'🏦 Net Banking'},
                {key:'RAZORPAY',    label:'⚡ Razorpay'},
              ].map(m => (
                <button key={m.key} className={`${styles.methodTab} ${method===m.key?styles.methodTabActive:''}`}
                  onClick={() => setMethod(m.key)}>{m.label}</button>
              ))}
            </div>
          </div>

          {method==='UPI_QR' && (
            <div className={styles.qrPanel}>
              <div className={styles.qrLeft}>
                <div className={styles.qrTitle}>UPI QR Code</div>
                <p className={styles.qrDesc}>Scan with PhonePe, GPay, Paytm, BHIM. Payment credited instantly.</p>
                <div className={styles.qrPowered}>Powered by <strong>BHIM UPI</strong> 🇮🇳</div>
                {qrGenerated && amount && (
                  <div style={{marginTop:8,fontSize:12,color:'var(--brand)',fontWeight:600}}>
                    ✓ QR generated for {formatCurrency(Number(amount))}
                  </div>
                )}
              </div>
              <div className={styles.qrRight}>
                <div className={styles.qrBox}>
                  {qrGenerated && amount ? (
                    <svg width="84" height="84" viewBox="0 0 21 21" shapeRendering="crispEdges">
                      {qrMatrix.map((row,r) => row.map((cell,c) => cell ? (
                        <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#1a1d2e"/>
                      ) : null))}
                    </svg>
                  ) : (
                    <div style={{textAlign:'center',padding:8}}>
                      <div style={{fontSize:22,marginBottom:4}}>📱</div>
                      <div style={{fontSize:10,color:'var(--text-3)'}}>Enter amount<br/>& generate</div>
                    </div>
                  )}
                </div>
                <button className={styles.genQrBtn} onClick={() => {
                  if (!amount||Number(amount)<100) { toast.error('Enter amount first (min ₹100)'); return; }
                  setQrGenerated(true); toast.success('QR Code generated!');
                }}>{qrGenerated ? '🔄 Regenerate' : 'Generate QR Code'}</button>
              </div>
            </div>
          )}
          {method==='UPI_ID' && (
            <div className={styles.mField}>
              <label className={styles.mLabel}>UPI ID</label>
              <input type="text" placeholder="yourname@okaxis / yourname@ybl"
                className={styles.mTextInput} value={upiId} onChange={e => setUpiId(e.target.value)}/>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                Accepted: @okaxis, @ybl, @paytm, @oksbi, @okicici
              </div>
            </div>
          )}
          {method==='NET_BANKING' && (
            <div className={styles.netBankingPanel}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {['HDFC','ICICI','SBI','Axis','Kotak','PNB'].map(b => (
                  <div key={b} className={styles.bankChip}
                    onClick={() => toast.success(`Redirecting to ${b} Net Banking...`)}>
                    🏦 {b}
                  </div>
                ))}
              </div>
              <p style={{fontSize:11,color:'var(--text-3)',marginTop:10}}>
                You will be redirected to your bank's secure net banking portal.
              </p>
            </div>
          )}
          {method==='RAZORPAY' && (
            <div className={styles.razorpayPanel}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{fontSize:32}}>⚡</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>Pay with Razorpay</div>
                  <div style={{fontSize:12,color:'var(--text-3)'}}>Credit/Debit cards, UPI, Netbanking, Wallets</div>
                </div>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
                {['💳 Cards','📱 UPI','🏦 Netbanking','👜 Wallets'].map(p => (
                  <span key={p} style={{fontSize:11,padding:'3px 10px',borderRadius:99,background:'var(--surface-2)',color:'var(--text-2)'}}>
                    {p}
                  </span>
                ))}
              </div>
              <p style={{fontSize:11,color:'var(--text-3)'}}>
                Secured by Razorpay • 256-bit SSL • PCI DSS compliant
              </p>
            </div>
          )}
        </div>
        <div className={styles.modalFoot}>
          {amount && Number(amount) > 0 && (
            <div className={styles.modalSummary}>
              New balance: <strong className="up">{formatCurrency((balance||0)+Number(amount))}</strong>
            </div>
          )}
          <div style={{display:'flex',gap:10}}>
            <button className={styles.cancelModalBtn} onClick={onClose}>Cancel</button>
            <button className={styles.confirmBtn}
              onClick={method==='RAZORPAY' ? handleRazorpay : handleManualDeposit}
              disabled={loading||!amount||Number(amount)<100}>
              {loading ? <span className={styles.btnSpin}/> : null}
              {loading ? 'Processing…' :
                method==='RAZORPAY'
                  ? `Pay ${amount ? formatCurrency(Number(amount)) : ''} via Razorpay`
                  : `Add ${amount ? formatCurrency(Number(amount)) : 'Funds'}`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── WITHDRAW MODAL ───────────────────────────────────────────────────────────
function WithdrawModal({ balance, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState('');
  const [loading, setLoading] = useState(false);
  const QUICK = [500, 1000, 5000, 10000];
  const creditDate = new Date();
  creditDate.setDate(creditDate.getDate() + 1);
  const creditStr = creditDate.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error('Minimum withdrawal is ₹100'); return; }
    if (amt > balance)     { toast.error('Insufficient balance'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/withdraw', { amount: amt, method: 'BANK' });
      toast.success(data.message || `₹${amt.toLocaleString('en-IN')} withdrawn!`);
      onSuccess(data.newBalance); onClose();
    } catch (e) { toast.error(e.response?.data?.error || 'Withdrawal failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>Withdraw Funds</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.wdBalBar}>
            <span>Withdrawable Balance:</span>
            <strong className={balance>0?'up':''}>{formatCurrency(balance)}</strong>
            <button className={styles.knowMore}>KNOW MORE</button>
          </div>
          <div className={styles.mField}>
            <label className={styles.mLabel}>Amount</label>
            <div className={styles.mAmtWrap}>
              <span className={styles.mRupee}>₹</span>
              <input type="number" min="100" className={styles.mAmtInput}
                placeholder="Please enter the amount to be withdrawn"
                value={amount} onChange={e => setAmount(e.target.value)} autoFocus/>
            </div>
            <div className={styles.quickRow}>
              {QUICK.map(q => (
                <button key={q} className={`${styles.quickBtn} ${Number(amount)===q?styles.quickActive:''}`}
                  onClick={() => setAmount(String(q))}>
                  + ₹{q.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.mField}>
            <label className={styles.mLabel}>Bank</label>
            <div className={styles.bankRow}>
              <span className={styles.bankIcon}>🏦</span>
              <span className={styles.bankName}>AXIS BANK - XXXX 0144</span>
            </div>
          </div>
          <div className={styles.creditBox}>
            <span>⏰</span>
            <span>Estimated Credit time will be on <strong>11:30 AM on {creditStr}</strong></span>
          </div>
        </div>
        <div className={styles.modalFoot}>
          {amount && Number(amount) > 0 && (
            <div className={styles.modalSummary}>
              Remaining balance: <strong className={Number(amount)>balance?'dn':''}>{formatCurrency(Math.max(0,balance-Number(amount)))}</strong>
            </div>
          )}
          {Number(amount) > balance && (
            <div className={styles.errMsg}>⚠️ Amount exceeds withdrawable balance of {formatCurrency(balance)}</div>
          )}
          <div style={{display:'flex',gap:10}}>
            <button className={styles.cancelModalBtn} onClick={onClose}>Cancel</button>
            <button className={`${styles.confirmBtn} ${styles.withdrawConfirm}`} onClick={handleWithdraw}
              disabled={loading||!amount||Number(amount)<100||Number(amount)>balance}>
              {loading ? <span className={styles.btnSpin}/> : null}
              {loading ? 'Processing…' : `WITHDRAW ₹ ${amount ? Number(amount).toLocaleString('en-IN') : '0'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
////REFERRAL CODE//////
function ReferralSection({ user }) {
  const navigate = useNavigate();
  const code = user?.referralCode ?? '------';

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Referral code copied!');
  };

  return (
    <div style={{
      background: 'var(--surface-0)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 24,
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#003d2b 0%,#001a12 100%)',
        padding: '20px 22px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🎁 Refer & Earn ₹599</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Invite friends · They complete KYC · You earn <strong style={{ color: 'var(--brand)' }}>₹599</strong> per referral
          </div>
        </div>
        <button onClick={() => navigate('/referral')} style={{
          padding: '10px 20px', background: 'var(--brand)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
        }}>
          View Details →
        </button>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 22px', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
            Your Referral Code
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--mono)', letterSpacing: 3, color: 'var(--brand)' }}>
            {code}
          </div>
        </div>
        <button onClick={copyCode} style={{
          padding: '10px 18px', background: 'var(--surface-2)',
          border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', color: 'var(--text-2)',
        }}>
          📋 Copy Code
        </button>
      </div>
    </div>
  );
}

// ── MAIN PROFILE PAGE ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout, updateBalance } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [editing,      setEditing]      = useState(false);
  const [name,         setName]         = useState(user?.name || '');
  const [saving,       setSaving]       = useState(false);
  const [showAdd,      setShowAdd]      = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [txns,         setTxns]         = useState([]);
  const [loadingTxns,  setLoadingTxns]  = useState(true);

  const fetchTxns = useCallback(async () => {
    try {
      const { data } = await api.get('/wallet');
      setTxns(data.transactions || []);
    } catch {} finally { setLoadingTxns(false); }
  }, []);

  useEffect(() => { fetchTxns(); }, [fetchTxns]);

  useEffect(() => {
    if (location?.state?.openAddFunds) setShowAdd(true);
  }, [location?.state?.openAddFunds]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({ name });
      toast.success('Profile updated');
      setEditing(false);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month:'long', year:'numeric' })
    : 'Recently';

  const totalDeposited = txns.filter(t => t.type==='DEPOSIT').reduce((s,t) => s+t.amount, 0);
  const totalWithdrawn = txns.filter(t => t.type==='WITHDRAW').reduce((s,t) => s+t.amount, 0);

  return (
    <div className="fade-up">
      {showAdd      && <AddFundsModal  balance={user?.balance||0} onClose={()=>setShowAdd(false)}      onSuccess={b=>{updateBalance(b);fetchTxns();}}/>}
      {showWithdraw && <WithdrawModal  balance={user?.balance||0} onClose={()=>setShowWithdraw(false)} onSuccess={b=>{updateBalance(b);fetchTxns();}}/>}

      <div className={styles.pageHead}>
        <h1 className={styles.title}>My Account</h1>
        <button className={styles.logoutTopBtn} onClick={()=>{logout();navigate('/login');}}>⏻ LOGOUT</button>
      </div>

      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.heroAvatar}>{getInitials(user?.name)}</div>
          <div>
            {editing ? (
              <div className={styles.editRow}>
                <input className={styles.nameInput} value={name} onChange={e=>setName(e.target.value)} autoFocus/>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save'}</button>
                <button className={styles.cancelBtn} onClick={()=>{setEditing(false);setName(user?.name||'');}}>Cancel</button>
              </div>
            ) : <h2 className={styles.heroName}>{user?.name}</h2>}
            {!editing && <button className={styles.viewProfileBtn} onClick={()=>setEditing(true)}>✏️ EDIT PROFILE</button>}
          </div>
        </div>
        <div className={styles.heroRight}><span>Member since {memberSince}</span></div>
      </div>

      <div className={styles.balanceCard}>
        <div className={styles.balTop}>
          <div>
            <div className={styles.balLabel}>Trading Balance</div>
            <div className={styles.balAmount}>{formatCurrency(user?.balance)}</div>
          </div>
          <div className={styles.balBtns}>
            <button className={styles.withdrawBtn} onClick={()=>setShowWithdraw(true)}>💸 WITHDRAW FUNDS</button>
            <button className={styles.addBtn}      onClick={()=>setShowAdd(true)}>➕ ADD FUNDS</button>
          </div>
        </div>
        <div className={styles.balLinks}>
          <button className={styles.balLink} onClick={()=>navigate('/portfolio')}>VIEW TRADING BALANCE SUMMARY ›</button>
          <button className={styles.balLink} onClick={()=>navigate('/orders')}>VIEW TRANSACTION SUMMARY ›</button>
        </div>
      </div>

      {/* ── REFERRAL ── */}
      <div className={styles.sectionTitle}>Refer & Earn</div>
      <ReferralSection user={user} />

      <div className={styles.sectionTitle}>Reports</div>
      <div className={styles.reportsGrid}>
        {[
          {icon:'📄', label:'Trades & Charges', path:'/orders'   },
          {icon:'📊', label:'Statements',        path:'/orders'   },
          {icon:'💹', label:'Profit & Loss',     path:'/portfolio'},
          {icon:'📈', label:'Trading Insights',  path:'/market', badge:'NEW'},
        ].map(r => (
          <div key={r.label} className={styles.reportCard} onClick={()=>navigate(r.path)}>
            <span className={styles.reportIcon}>{r.icon}</span>
            <span className={styles.reportLabel}>{r.label}</span>
            {r.badge && <span className={styles.reportBadge}>{r.badge}</span>}
          </div>
        ))}
      </div>

      <div className={styles.sectionTitle}>Recent Transactions</div>
      <div className={styles.txCard}>
        {loadingTxns ? (
          Array.from({length:3}).map((_,i) => (
            <div key={i} className={styles.txRow}>
              <div className="skel" style={{width:36,height:36,borderRadius:9,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div className="skel" style={{height:12,width:'50%',marginBottom:5}}/>
                <div className="skel" style={{height:10,width:'35%'}}/>
              </div>
              <div className="skel" style={{width:80,height:14,borderRadius:4}}/>
            </div>
          ))
        ) : txns.length===0 ? (
          <div className={styles.txEmpty}>
            <span>💸</span>
            <p>No transactions yet. Add funds to get started!</p>
            <button className={styles.addFundsEmptyBtn} onClick={()=>setShowAdd(true)}>Add Funds</button>
          </div>
        ) : (
          txns.slice(0,8).map(tx => {
            const isD = tx.type==='DEPOSIT';
            return (
              <div key={tx._id} className={styles.txRow}>
                <div className={`${styles.txIcon} ${isD?styles.txDep:styles.txWit}`}>{isD?'↓':'↑'}</div>
                <div style={{flex:1}}>
                  <div className={styles.txType}>{isD?'Funds Added':'Withdrawal'}</div>
                  <div className={styles.txMeta}>{tx.method} · {new Date(tx.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}{tx.upiId&&` · ${tx.upiId}`}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className={`${styles.txAmt} ${isD?'up':'dn'}`}>{isD?'+':'-'}{formatCurrency(tx.amount)}</div>
                  <div className={styles.txBal}>Bal: {formatCurrency(tx.balanceAfter)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}><div className={styles.statIcon}>💰</div><div><div className={styles.statLabel}>Total Deposited</div><div className={`${styles.statVal} up`}>+{formatCurrency(totalDeposited)}</div></div></div>
        <div className={styles.statBox}><div className={styles.statIcon}>↑</div><div><div className={styles.statLabel}>Total Withdrawn</div><div className={`${styles.statVal} dn`}>-{formatCurrency(totalWithdrawn)}</div></div></div>
        <div className={styles.statBox}><div className={styles.statIcon}>📅</div><div><div className={styles.statLabel}>Member Since</div><div className={styles.statVal}>{memberSince}</div></div></div>
        <div className={styles.statBox}><div className={styles.statIcon}>📋</div><div><div className={styles.statLabel}>Transactions</div><div className={styles.statVal}>{txns.length}</div></div></div>
      </div>

      <div className={styles.sectionTitle}>Navigate</div>
      <div className={styles.linksGrid}>
        {[
          {icon:'💼', label:'Portfolio',     sub:'Holdings & P&L', path:'/portfolio'},
          {icon:'📋', label:'Order History', sub:'All trades',     path:'/orders'  },
          {icon:'⭐', label:'Watchlist',      sub:'Tracked stocks', path:'/watchlist'},
          {icon:'🚀', label:'IPO Centre',    sub:'Open & Upcoming',path:'/ipo'     },
          {icon:'💰', label:'Mutual Funds',  sub:'SIP Calculator', path:'/sip'     },
          {icon:'🌐', label:'Markets',        sub:'Nifty · Sensex', path:'/market'  },
        ].map(({icon,label,sub,path}) => (
          <div key={path} className={styles.linkItem} onClick={()=>navigate(path)}>
            <span className={styles.linkIcon}>{icon}</span>
            <div><div className={styles.linkLabel}>{label}</div><div className={styles.linkSub}>{sub}</div></div>
            <span className={styles.linkArrow}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}