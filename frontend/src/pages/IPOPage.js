import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipoService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';
import styles from './IPO.module.css';

const STATUS_TABS = ['All', 'Open', 'Upcoming', 'Listed'];

// ── IPO DETAIL MODAL ─────────────────────────────────────────────────────────
function IPODetailModal({ ipo, onClose, onApply }) {
  if (!ipo) return null;
  const isOpen     = ipo.status === 'Open';
  const isListed   = ipo.status === 'Listed';
  const listingGain = isListed && ipo.issuePrice && ipo.currentPrice
    ? ((ipo.currentPrice - ipo.issuePrice) / ipo.issuePrice * 100) : null;

  const renderStars = (n) => (
    <span style={{ color:'var(--warn)', fontSize:16, letterSpacing:1 }}>
      {'★'.repeat(n)}<span style={{ color:'var(--surface-3)' }}>{'★'.repeat(5-n)}</span>
    </span>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={onClose}>
      <div style={{ background:'var(--surface-0)', border:'1px solid var(--line)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'var(--brand)' }}>
              {ipo.symbol?.slice(0,2)}
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:3 }}>{ipo.company}</div>
              <div style={{ fontSize:12, color:'var(--text-3)' }}>{ipo.sector} · {ipo.exchange}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:700, background: ipo.status==='Open' ? 'var(--up-bg)' : ipo.status==='Upcoming' ? 'rgba(243,156,18,.15)' : 'var(--surface-2)', color: ipo.status==='Open' ? 'var(--up)' : ipo.status==='Upcoming' ? '#f39c12' : 'var(--text-2)' }}>
              {ipo.status}
            </span>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--surface-2)', border:'none', cursor:'pointer', fontSize:14, color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Rating */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {renderStars(ipo.rating || 3)}
            <span style={{ fontSize:12, color:'var(--text-3)' }}>({ipo.rating || 3}/5 rating)</span>
          </div>

          {/* Key stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Issue Price',   val: ipo.issuePrice ? `₹${ipo.issuePrice}` : 'TBA' },
              { label:'Issue Size',    val: `₹${ipo.issueSize?.toLocaleString('en-IN')}Cr` },
              { label:'Lot Size',      val: ipo.lotSize ? `${ipo.lotSize} shares` : '—' },
              { label:'GMP',           val: ipo.gmp > 0 ? `+₹${ipo.gmp}` : '—', color: ipo.gmp > 0 ? 'var(--up)' : undefined },
              { label:'Min Investment',val: ipo.issuePrice && ipo.lotSize ? formatCurrency(ipo.issuePrice * ipo.lotSize) : '—' },
              { label:'Exchange',      val: ipo.exchange || 'NSE' },
              ...(ipo.subscribed ? [{ label:'Subscribed', val:`${ipo.subscribed}x`, color:'var(--brand)' }] : []),
              ...(listingGain !== null ? [{ label:'Listing Gain', val:`${listingGain >= 0 ? '+' : ''}${listingGain.toFixed(1)}%`, color: listingGain >= 0 ? 'var(--up)' : 'var(--dn)' }] : []),
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background:'var(--surface-1)', borderRadius:'var(--radius-sm)', padding:'12px 14px' }}>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:5 }}>{label}</div>
                <div style={{ fontSize:15, fontWeight:700, color: color || 'var(--text-1)' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div style={{ background:'var(--surface-1)', borderRadius:'var(--radius-sm)', padding:'14px 16px', display:'flex', gap:24, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:4 }}>Open Date</div>
              <div style={{ fontSize:14, fontWeight:700 }}>{new Date(ipo.openDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:4 }}>Close Date</div>
              <div style={{ fontSize:14, fontWeight:700 }}>{new Date(ipo.closeDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</div>
            </div>
          </div>

          {/* About */}
          {ipo.about && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>About</div>
              <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6 }}>{ipo.about}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid var(--line)', display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', background:'var(--surface-1)', border:'1.5px solid var(--line)', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', color:'var(--text-2)' }}>
            Close
          </button>
          {isOpen && (
            <button onClick={() => { onClose(); onApply(ipo); }} style={{ flex:2, padding:'12px', background:'var(--brand)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'var(--font)' }}>
              Apply Now →
            </button>
          )}
          {ipo.status === 'Upcoming' && (
            <button onClick={onClose} style={{ flex:2, padding:'12px', background:'rgba(243,156,18,.15)', color:'#f39c12', border:'1px solid rgba(243,156,18,.3)', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'var(--font)' }}>
              🔔 Set Reminder
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── APPLY MODAL ───────────────────────────────────────────────────────────────
function ApplyModal({ ipo, onClose }) {
  const [lots,       setLots]       = useState(1);
  const [bidPrice,   setBidPrice]   = useState(ipo?.issuePrice || '');
  const [upiId,      setUpiId]      = useState('');
  const [investorType, setInvestorType] = useState('Retail');
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);

  const totalShares  = lots * (ipo?.lotSize || 1);
  const totalAmount  = totalShares * (Number(bidPrice) || 0);
  const INVESTOR_TYPES = ['Retail', 'HNI', 'Employee', 'Shareholder'];

  const handleApply = async () => {
    if (!upiId) { alert('Please enter your UPI ID'); return; }
    if (!bidPrice) { alert('Please enter bid price'); return; }
    setLoading(true);
    try {
      await ipoService.applyIPO(ipo._id);
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to apply IPO');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
      <div style={{ background:'var(--surface-0)', border:'1px solid var(--line)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:420, padding:'40px 24px', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
        <div style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Application Submitted!</div>
        <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:6 }}>Your IPO application for <strong>{ipo.company}</strong> has been submitted.</div>
        <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:24 }}>Allotment results will be available on T+6 day.</div>
        <div style={{ background:'var(--surface-1)', borderRadius:'var(--radius-sm)', padding:'14px', marginBottom:20, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, color:'var(--text-3)' }}>Total Amount Blocked</span>
          <strong style={{ fontSize:14, color:'var(--brand)' }}>{formatCurrency(totalAmount)}</strong>
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:'13px', background:'var(--brand)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'var(--font)' }}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={onClose}>
      <div style={{ background:'var(--surface-0)', border:'1px solid var(--line)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>{ipo.company}</div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
              ₹{ipo.issuePrice} {ipo.priceHigh ? `— ₹${ipo.priceHigh}` : ''} &nbsp;·&nbsp;
              <span style={{ color:'#9b59b6', fontWeight:700, fontSize:11, background:'rgba(155,89,182,.1)', padding:'2px 8px', borderRadius:99 }}>MAINBOARD</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--surface-2)', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:18 }}>

          {/* Investor type */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>Investor Type</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {INVESTOR_TYPES.map(t => (
                <button key={t} onClick={() => setInvestorType(t)} style={{
                  padding:'8px 16px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600,
                  cursor:'pointer', fontFamily:'var(--font)', transition:'all .15s',
                  background: investorType===t ? 'transparent' : 'transparent',
                  color: investorType===t ? 'var(--brand)' : 'var(--text-2)',
                  border: investorType===t ? '2px solid var(--brand)' : '1.5px solid var(--line)',
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Lots & Bid Price */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>Number Of Lots</div>
              <input
                type="number" min="1" value={lots}
                onChange={e => setLots(Math.max(1, parseInt(e.target.value)||1))}
                style={{ width:'100%', padding:'11px 14px', background:'var(--surface-1)', border:'1.5px solid var(--line)', borderRadius:'var(--radius-sm)', fontSize:15, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font)' }}
              />
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>{lots} lot: {totalShares} shares</div>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>Bid Price</div>
              <input
                type="number" value={bidPrice}
                onChange={e => setBidPrice(e.target.value)}
                style={{ width:'100%', padding:'11px 14px', background:'var(--surface-1)', border:'1.5px solid var(--line)', borderRadius:'var(--radius-sm)', fontSize:15, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font)' }}
              />
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, display:'flex', justifyContent:'space-between' }}>
              <span>UPI ID</span>
              <button style={{ fontSize:12, color:'var(--brand)', background:'none', border:'none', cursor:'pointer', fontWeight:700, fontFamily:'var(--font)' }}>EDIT</button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--surface-1)', border:'1.5px solid var(--line)', borderRadius:'var(--radius-sm)', padding:'11px 14px' }}>
              <span style={{ fontSize:12, color:'var(--text-3)', background:'var(--surface-2)', padding:'3px 8px', borderRadius:6, fontWeight:700 }}>UPI</span>
              <input
                type="text" placeholder="yourname@okaxis"
                value={upiId} onChange={e => setUpiId(e.target.value)}
                style={{ flex:1, background:'transparent', border:'none', fontSize:14, fontWeight:600, color:'var(--text-1)', fontFamily:'var(--font)' }}
              />
            </div>
          </div>

          {/* Total */}
          <div style={{ background:'var(--surface-1)', borderRadius:'var(--radius-sm)', padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text-2)', display:'flex', alignItems:'center', gap:6 }}>
                Total Payable Amount <span style={{ fontSize:12 }}>▲</span>
              </span>
              <strong style={{ fontSize:16, fontFamily:'var(--mono)' }}>{formatCurrency(totalAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 22px', borderTop:'1px solid var(--line)' }}>
          <button
            onClick={handleApply}
            disabled={loading}
            style={{ width:'100%', padding:'14px', background:'#3b4fd4', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'var(--font)', opacity: loading ? .7 : 1 }}
          >
            {loading ? 'Processing...' : 'APPLY FOR IPO'}
          </button>
          <div style={{ textAlign:'center', marginTop:10, fontSize:11, color:'var(--text-3)' }}>
            By applying, you accept the <span style={{ color:'var(--brand)', cursor:'pointer' }}>Terms and Conditions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN IPO PAGE ─────────────────────────────────────────────────────────────
export default function IPOPage() {
  const [ipos,        setIpos]       = useState([]);
  const [tab,         setTab]        = useState('All');
  const [loading,     setLoading]    = useState(true);
  const [detailIPO,   setDetailIPO]  = useState(null);
  const [applyIPO,    setApplyIPO]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIPOs = async () => {
      try {
        const { data } = await ipoService.getAll(tab !== 'All' ? { status: tab } : {});
        setIpos(data.ipos || []);
      } catch {} finally { setLoading(false); }
    };
    fetchIPOs();
  }, [tab]);

  const renderStars = (n) => (
    <span style={{ color:'var(--warn)', fontSize:13, letterSpacing:-1 }}>
      {'★'.repeat(n)}<span style={{ color:'var(--surface-3)' }}>{'★'.repeat(5-n)}</span>
    </span>
  );

  return (
    <div className="fade-up">

      {/* Modals */}
      {detailIPO && (
        <IPODetailModal
          ipo={detailIPO}
          onClose={() => setDetailIPO(null)}
          onApply={(ipo) => setApplyIPO(ipo)}
        />
      )}
      {applyIPO && (
        <ApplyModal
          ipo={applyIPO}
          onClose={() => setApplyIPO(null)}
        />
      )}

      {/* Header */}
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>IPO</h1>
          <p className={styles.sub}>Upcoming, Open &amp; Recently Listed IPOs</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {STATUS_TABS.map(t => (
          <button key={t} className={`${styles.tab} ${tab===t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.ipoCard}>
              <div className="skel" style={{ height:20, width:'60%', marginBottom:8 }}/>
              <div className="skel" style={{ height:14, width:'40%', marginBottom:16 }}/>
              <div className="skel" style={{ height:40 }}/>
            </div>
          ))}
        </div>
      ) : ipos.length === 0 ? (
        <div className={styles.empty}>
          <span style={{ fontSize:40 }}>📋</span>
          <p>No IPOs found for this filter</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {ipos.map(ipo => {
            const isOpen   = ipo.status === 'Open';
            const isListed = ipo.status === 'Listed';
            const listingGain = isListed && ipo.issuePrice && ipo.currentPrice
              ? ((ipo.currentPrice - ipo.issuePrice) / ipo.issuePrice * 100) : null;

            return (
              <div key={ipo._id || ipo.symbol} className={styles.ipoCard}
                style={{ cursor:'pointer' }}
                onClick={() => setDetailIPO(ipo)}
              >
                {/* Status badge */}
                <div className={styles.cardTop}>
                  <span className={`${styles.statusBadge} ${
                    isOpen ? styles.badgeOpen :
                    ipo.status==='Upcoming' ? styles.badgeUpcoming : styles.badgeListed
                  }`}>{ipo.status}</span>
                  <div>{renderStars(ipo.rating || 3)}</div>
                </div>

                {/* Company */}
                <div className={styles.companyRow}>
                  <div className={styles.companyIcon}>{ipo.symbol?.slice(0,2)}</div>
                  <div>
                    <div className={styles.companyName}>{ipo.company}</div>
                    <div className={styles.sector}>{ipo.sector} · {ipo.exchange}</div>
                  </div>
                </div>

                {/* Key data */}
                <div className={styles.dataGrid}>
                  <div className={styles.dataItem}>
                    <span className={styles.dataLabel}>Issue Price</span>
                    <span className={styles.dataVal} style={!ipo.issuePrice ? { color:'var(--text-3)' } : {}}>
                      {ipo.issuePrice ? `₹${ipo.issuePrice}` : 'TBA'}
                    </span>
                  </div>
                  {ipo.gmp > 0 && (
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>GMP</span>
                      <span className={styles.dataVal} style={{ color:'var(--up)' }}>+₹{ipo.gmp}</span>
                    </div>
                  )}
                  <div className={styles.dataItem}>
                    <span className={styles.dataLabel}>Issue Size</span>
                    <span className={styles.dataVal}>₹{ipo.issueSize?.toLocaleString('en-IN')}Cr</span>
                  </div>
                  {ipo.subscribed && (
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Subscribed</span>
                      <span className={styles.dataVal} style={{ color:'var(--brand)' }}>{ipo.subscribed}x</span>
                    </div>
                  )}
                  {ipo.lotSize && (
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Lot Size</span>
                      <span className={styles.dataVal}>{ipo.lotSize} shares</span>
                    </div>
                  )}
                  {listingGain !== null && (
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Listing Gain</span>
                      <span className={styles.dataVal} style={{ color: listingGain >= 0 ? 'var(--up)' : 'var(--dn)' }}>
                        {listingGain >= 0 ? '+' : ''}{listingGain.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className={styles.datesRow}>
                  <span>Open: {new Date(ipo.openDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</span>
                  <span>—</span>
                  <span>Close: {new Date(ipo.closeDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</span>
                </div>

                {/* CTA buttons — stop propagation so card click doesn't fire */}
                <div onClick={e => e.stopPropagation()}>
                  {isOpen ? (
                    <button className={styles.applyBtn} onClick={() => setApplyIPO(ipo)}>
                      Apply Now
                    </button>
                  ) : ipo.status === 'Upcoming' ? (
                    <button className={styles.notifyBtn} onClick={() => setDetailIPO(ipo)}>
                      🔔 Notify Me
                    </button>
                 ) : isListed ? (
                    <button className={styles.viewBtn} onClick={() => setDetailIPO(ipo)}>
                      View Stock
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info section */}
      <div className={styles.infoBox}>
        <h3>How to apply for an IPO?</h3>
        <div className={styles.stepsRow}>
          {[
            { n:1, t:'Choose IPO',    d:'Browse open IPOs and check subscription status, GMP and ratings' },
            { n:2, t:'Select Lot Size', d:'Choose how many lots you want to apply for based on budget' },
            { n:3, t:'UPI Mandate',   d:'Enter UPI ID and approve the mandate from your bank app' },
            { n:4, t:'Allotment',     d:'Check allotment on T+6 day. Shares credited if allotted' },
          ].map(s => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepNum}>{s.n}</div>
              <div className={styles.stepTitle}>{s.t}</div>
              <div className={styles.stepDesc}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}