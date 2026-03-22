import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ALERT_KEY = 'sv_price_alerts';

export function getAlerts() {
  return JSON.parse(localStorage.getItem(ALERT_KEY) || '[]');
}

export function saveAlert(alert) {
  const alerts = getAlerts();
  const exists = alerts.findIndex(a => a.id === alert.id);
  if (exists >= 0) alerts[exists] = alert;
  else alerts.unshift(alert);
  localStorage.setItem(ALERT_KEY, JSON.stringify(alerts.slice(0, 50)));
}

export function deleteAlert(id) {
  const alerts = getAlerts().filter(a => a.id !== id);
  localStorage.setItem(ALERT_KEY, JSON.stringify(alerts));
}

export function checkAlerts(prices) {
  const alerts  = getAlerts().filter(a => a.active);
  const triggered = [];
  alerts.forEach(a => {
    const price = prices[a.symbol]?.currentPrice;
    if (!price) return;
    if (a.condition === 'above' && price >= a.targetPrice) triggered.push(a);
    if (a.condition === 'below' && price <= a.targetPrice) triggered.push(a);
  });
  return triggered;
}

export default function PriceAlertModal({ symbol, currentPrice, onClose }) {
  const [targetPrice, setTargetPrice] = useState(currentPrice?.toFixed(2) || '');
  const [condition,   setCondition]   = useState('above');
  const [note,        setNote]        = useState('');
  const [myAlerts,    setMyAlerts]    = useState([]);

  useEffect(() => {
    setMyAlerts(getAlerts().filter(a => a.symbol === symbol));
  }, [symbol]);

  const handleSave = () => {
    const tp = parseFloat(targetPrice);
    if (!tp || tp <= 0) { toast.error('Enter a valid price'); return; }

    const alert = {
      id:          `${symbol}_${Date.now()}`,
      symbol,
      targetPrice: tp,
      condition,
      note:        note.trim(),
      createdAt:   new Date().toISOString(),
      active:      true,
    };

    saveAlert(alert);
    setMyAlerts(getAlerts().filter(a => a.symbol === symbol));
    toast.success(`Alert set! Notify when ${symbol} goes ${condition} ₹${tp.toLocaleString('en-IN')}`);

    // Add to notifications
    const stored = JSON.parse(localStorage.getItem('sv_notifs') || '[]');
    stored.unshift({
      id:    `alert_${alert.id}`,
      type:  'info',
      icon:  '🔔',
      title: `Price Alert Set — ${symbol}`,
      desc:  `Alert when ${symbol} goes ${condition} ₹${tp.toLocaleString('en-IN')}`,
      time:  new Date().toISOString(),
      read:  false,
    });
    localStorage.setItem('sv_notifs', JSON.stringify(stored.slice(0, 50)));

    setTargetPrice('');
    setNote('');
  };

  const handleDelete = (id) => {
    deleteAlert(id);
    setMyAlerts(getAlerts().filter(a => a.symbol === symbol));
    toast.success('Alert removed');
  };

  const diff = targetPrice && currentPrice
    ? (((parseFloat(targetPrice) - currentPrice) / currentPrice) * 100).toFixed(2)
    : null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={onClose}>
      <div style={{ background:'var(--surface-0)', border:'1px solid var(--line)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:420, overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>🔔 Price Alert — {symbol}</div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>
              Current: <strong style={{ color:'var(--text-1)', fontFamily:'var(--mono)' }}>₹{currentPrice?.toLocaleString('en-IN', { maximumFractionDigits:2 })}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--surface-2)', border:'none', cursor:'pointer', fontSize:14, color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Condition */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>Alert Condition</div>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { key:'above', label:'📈 Price goes Above', color:'var(--up)' },
                { key:'below', label:'📉 Price goes Below', color:'var(--dn)' },
              ].map(c => (
                <button key={c.key} onClick={() => setCondition(c.key)} style={{
                  flex:1, padding:'10px 8px', borderRadius:'var(--radius-sm)',
                  cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:700,
                  border: condition===c.key ? `2px solid ${c.color}` : '1.5px solid var(--line)',
                  background: condition===c.key ? (c.key==='above' ? 'var(--up-bg)' : 'var(--dn-bg)') : 'var(--surface-1)',
                  color: condition===c.key ? c.color : 'var(--text-2)',
                  transition:'all .15s',
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* Target price */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>Target Price</div>
            <div style={{ display:'flex', alignItems:'center', border:'1.5px solid var(--line)', borderRadius:'var(--radius-sm)', overflow:'hidden', background:'var(--surface-1)', transition:'border-color .15s' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--brand)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--line)'}>
              <span style={{ padding:'0 14px', fontSize:18, fontWeight:800, color:'var(--text-2)', background:'var(--surface-2)', borderRight:'1px solid var(--line)', alignSelf:'stretch', display:'flex', alignItems:'center' }}>₹</span>
              <input
                type="number" step="0.05" min="0.01"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder="Enter target price"
                style={{ flex:1, padding:'12px 14px', background:'transparent', border:'none', fontSize:16, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font)' }}
              />
            </div>
            {diff !== null && (
              <div style={{ fontSize:12, marginTop:5, color: parseFloat(diff) >= 0 ? 'var(--up)' : 'var(--dn)', fontWeight:600 }}>
                {parseFloat(diff) >= 0 ? '▲' : '▼'} {Math.abs(diff)}% from current price
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>Note (optional)</div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Buy on breakout"
              style={{ width:'100%', padding:'10px 14px', background:'var(--surface-1)', border:'1.5px solid var(--line)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--text-1)', fontFamily:'var(--font)' }}
            />
          </div>

          {/* Save button */}
          <button onClick={handleSave} style={{
            width:'100%', padding:'13px',
            background:'var(--brand)', color:'#fff',
            border:'none', borderRadius:'var(--radius-sm)',
            fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'var(--font)',
          }}>
            Set Price Alert
          </button>

          {/* Existing alerts */}
          {myAlerts.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>
                Active Alerts for {symbol}
              </div>
              {myAlerts.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--surface-1)', borderRadius:'var(--radius-sm)', marginBottom:8, border:'1px solid var(--line)' }}>
                  <span style={{ fontSize:14 }}>{a.condition === 'above' ? '📈' : '📉'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>
                      {a.condition === 'above' ? 'Above' : 'Below'} ₹{a.targetPrice?.toLocaleString('en-IN')}
                    </div>
                    {a.note && <div style={{ fontSize:11, color:'var(--text-3)' }}>{a.note}</div>}
                  </div>
                  <span style={{ fontSize:10, padding:'3px 8px', borderRadius:99, background:'var(--up-bg)', color:'var(--up)', fontWeight:700 }}>ACTIVE</span>
                  <button onClick={() => handleDelete(a.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dn)', fontSize:14, padding:'2px 4px' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}