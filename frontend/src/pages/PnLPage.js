import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService, orderService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';

const DONUT_COLORS = ['#00d09c','#3498db','#f39c12','#9b59b6','#e74c3c','#1abc9c','#e67e22','#2ecc71'];

export default function PnLPage() {
  const navigate  = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview'); // overview | holdings | trades

  useEffect(() => {
    Promise.allSettled([
      portfolioService.get(),
      orderService.getHistory({ limit: 100 }),
    ]).then(([portRes, ordRes]) => {
      if (portRes.status === 'fulfilled') setPortfolio(portRes.value.data);
      if (ordRes.status  === 'fulfilled') setOrders(ordRes.value.data.orders || []);
    }).finally(() => setLoading(false));
  }, []);

  const holdings    = portfolio?.holdings || [];
  const invested    = portfolio?.summary?.totalInvested   ?? 0;
  const curVal      = portfolio?.summary?.currentValue    ?? 0;
  const totalPnL    = portfolio?.summary?.totalPnL        ?? 0;
  const totalPnLPct = portfolio?.summary?.totalPnLPercent ?? 0;
  const cashBal     = portfolio?.summary?.cashBalance     ?? 0;
  const totalPort   = portfolio?.summary?.totalPortfolioValue ?? 0;

  const buyOrders   = orders.filter(o => o.type === 'BUY');
  const sellOrders  = orders.filter(o => o.type === 'SELL');
  const totalBought = buyOrders.reduce((s, o)  => s + o.totalAmount, 0);
  const totalSold   = sellOrders.reduce((s, o) => s + o.totalAmount, 0);
  const realizedPnL = totalSold - buyOrders
    .filter(o => sellOrders.some(s => s.symbol === o.symbol))
    .reduce((s, o) => s + o.totalAmount, 0);

  const bestHolding  = [...holdings].sort((a, b) => (b.pnlPercent ?? 0) - (a.pnlPercent ?? 0))[0];
  const worstHolding = [...holdings].sort((a, b) => (a.pnlPercent ?? 0) - (b.pnlPercent ?? 0))[0];

  const s = {
    card:    { background:'var(--surface-0)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', overflow:'hidden', marginBottom:16 },
    cardPad: { background:'var(--surface-0)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'18px 20px', marginBottom:16 },
    label:   { fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 },
    val:     { fontSize:22, fontWeight:800, fontFamily:'var(--mono)', letterSpacing:'-.5px', marginBottom:3 },
    sub:     { fontSize:12, color:'var(--text-3)' },
    tabBtn:  (active) => ({
      padding:'8px 18px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:700,
      cursor:'pointer', fontFamily:'var(--font)', border:'none', transition:'all .15s',
      background: active ? 'var(--brand)' : 'var(--surface-2)',
      color: active ? '#fff' : 'var(--text-2)',
    }),
    th: { padding:'10px 16px', fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.4px', background:'var(--surface-1)', borderBottom:'1px solid var(--line)' },
    td: { padding:'13px 16px', fontSize:13, borderBottom:'1px solid var(--line)', color:'var(--text-1)' },
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:80, gap:12 }}>
      <div style={{ width:32, height:32, border:'3px solid var(--line)', borderTop:'3px solid var(--brand)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="fade-up" style={{ fontFamily:'var(--font)' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-.3px', marginBottom:4 }}>P&L Report</h1>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>Profit & Loss · Holdings Analysis · Trade History</p>
        </div>
        <button onClick={() => navigate('/portfolio')} style={{
          padding:'9px 18px', background:'var(--surface-2)', border:'1px solid var(--line)',
          borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:700, cursor:'pointer',
          fontFamily:'var(--font)', color:'var(--text-2)',
        }}>← Portfolio</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[
          { key:'overview',  label:'📊 Overview'  },
          { key:'holdings',  label:'💼 Holdings'  },
          { key:'trades',    label:'📋 Trades'    },
        ].map(t => (
          <button key={t.key} style={s.tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <>
          {/* Main stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            {[
              { label:'Portfolio Value',  val: formatCurrency(totalPort),  sub:'Cash + Holdings',    border:'var(--brand)' },
              { label:'Invested',         val: formatCurrency(invested),   sub:'Deployed capital',   border:'var(--info)'  },
              { label:'Unrealized P&L',   val: `${totalPnL >= 0 ? '+' : ''}${formatCurrency(totalPnL)}`, sub:`${totalPnLPct >= 0 ? '+' : ''}${Number(totalPnLPct).toFixed(2)}%`, border: totalPnL >= 0 ? 'var(--up)' : 'var(--dn)', color: totalPnL >= 0 ? 'var(--up)' : 'var(--dn)' },
              { label:'Cash Balance',     val: formatCurrency(cashBal),    sub:'Available to invest', border:'var(--warn)'  },
            ].map(({ label, val, sub, border, color }) => (
              <div key={label} style={{ ...s.cardPad, borderLeft:`3px solid ${border}`, marginBottom:0 }}>
                <div style={s.label}>{label}</div>
                <div style={{ ...s.val, color: color || 'var(--text-1)' }}>{val}</div>
                <div style={{ ...s.sub, color: color || 'var(--text-3)' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Trade stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            {[
              { label:'Total Trades',   val: orders.length,                     sub:`${buyOrders.length} buys · ${sellOrders.length} sells` },
              { label:'Total Bought',   val: formatCurrency(totalBought),        sub:'Capital deployed'  },
              { label:'Total Sold',     val: formatCurrency(totalSold),          sub:'Capital recovered'  },
              { label:'Active Holdings',val: holdings.length,                    sub:'Open positions'    },
            ].map(({ label, val, sub }) => (
              <div key={label} style={{ ...s.cardPad, marginBottom:0 }}>
                <div style={s.label}>{label}</div>
                <div style={s.val}>{val}</div>
                <div style={s.sub}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Best / Worst */}
          {holdings.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[
                { label:'🏆 Best Performer', holding: bestHolding,  color:'var(--up)', bg:'var(--up-bg)'  },
                { label:'📉 Worst Performer', holding: worstHolding, color:'var(--dn)', bg:'var(--dn-bg)'  },
              ].map(({ label, holding, color, bg }) => holding ? (
                <div key={label} style={{ ...s.cardPad, marginBottom:0, cursor:'pointer' }} onClick={() => navigate(`/stocks/${holding.symbol}`)}>
                  <div style={s.label}>{label}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color, flexShrink:0 }}>
                      {holding.symbol?.slice(0,3)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:800, marginBottom:2 }}>{holding.symbol}</div>
                      <div style={{ fontSize:12, color:'var(--text-3)' }}>{holding.quantity} shares</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:15, fontWeight:800, color, fontFamily:'var(--mono)' }}>
                        {(holding.pnlPercent ?? 0) >= 0 ? '+' : ''}{Number(holding.pnlPercent ?? 0).toFixed(2)}%
                      </div>
                      <div style={{ fontSize:12, color, fontFamily:'var(--mono)' }}>
                        {(holding.pnl ?? 0) >= 0 ? '+' : ''}{formatCurrency(holding.pnl ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null)}
            </div>
          )}

          {/* Donut chart */}
          {holdings.length > 0 && (
            <div style={s.cardPad}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Portfolio Allocation</div>
              <div style={{ display:'flex', gap:32, alignItems:'center', flexWrap:'wrap' }}>
                <DonutChart holdings={holdings} total={curVal} />
                <div style={{ flex:1, minWidth:200 }}>
                  {holdings.map((h, i) => {
                    const val = h.currentValue ?? 0;
                    const pct = curVal > 0 ? (val / curVal * 100) : 0;
                    const pl  = h.pnl ?? 0;
                    return (
                      <div key={h.symbol} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--line)' }}>
                        <div style={{ width:10, height:10, borderRadius:3, background:DONUT_COLORS[i % DONUT_COLORS.length], flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:13, fontWeight:700 }}>{h.symbol}</span>
                          <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:8 }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:13, fontFamily:'var(--mono)', fontWeight:600 }}>{formatCurrency(val)}</div>
                          <div style={{ fontSize:11, color: pl >= 0 ? 'var(--up)' : 'var(--dn)', fontWeight:600 }}>
                            {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HOLDINGS TAB ── */}
      {tab === 'holdings' && (
        <div style={s.card}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr>
                  {['Stock','Qty','Avg Cost','LTP','Invested','Current Value','P&L','P&L %','Day %'].map(h => (
                    <th key={h} style={{ ...s.th, textAlign: h === 'Stock' ? 'left' : 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...s.td, textAlign:'center', padding:40, color:'var(--text-3)' }}>No holdings yet</td></tr>
                ) : holdings.map((h, i) => {
                  const pl     = h.pnl         ?? 0;
                  const plPct  = h.pnlPercent  ?? 0;
                  const curVal = h.currentValue ?? 0;
                  const dayPct = h.dayChangePercent ?? 0;
                  const isUp   = pl >= 0;
                  const dayUp  = dayPct >= 0;
                  return (
                    <tr key={h.symbol} style={{ cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(`/stocks/${h.symbol}`)}>
                      <td style={s.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, background:DONUT_COLORS[i%DONUT_COLORS.length]+'22', color:DONUT_COLORS[i%DONUT_COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0 }}>
                            {h.symbol?.slice(0,3)}
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700 }}>{h.symbol}</div>
                            <div style={{ fontSize:11, color:'var(--text-3)' }}>{h.stockName?.split(' ').slice(0,2).join(' ')}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)' }}>{h.quantity}</td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)' }}>{formatCurrency(h.avgBuyPrice)}</td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)', fontWeight:700 }}>{formatCurrency(h.currentPrice)}</td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)' }}>{formatCurrency(h.totalInvested)}</td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)', fontWeight:700 }}>{formatCurrency(curVal)}</td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)', fontWeight:700, color: isUp ? 'var(--up)' : 'var(--dn)' }}>
                        {isUp ? '+' : ''}{formatCurrency(pl)}
                      </td>
                      <td style={{ ...s.td, textAlign:'right' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, background: isUp ? 'var(--up-bg)' : 'var(--dn-bg)', color: isUp ? 'var(--up)' : 'var(--dn)' }}>
                          {isUp ? '+' : ''}{Number(plPct).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign:'right' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, background: dayUp ? 'var(--up-bg)' : 'var(--dn-bg)', color: dayUp ? 'var(--up)' : 'var(--dn)' }}>
                          {dayUp ? '▲' : '▼'} {Math.abs(dayPct).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {holdings.length > 0 && (
                <tfoot>
                  <tr style={{ background:'var(--surface-1)' }}>
                    <td style={{ ...s.td, fontWeight:800 }} colSpan={4}>TOTAL</td>
                    <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)', fontWeight:800 }}>{formatCurrency(invested)}</td>
                    <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)', fontWeight:800 }}>{formatCurrency(curVal)}</td>
                    <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)', fontWeight:800, color: totalPnL >= 0 ? 'var(--up)' : 'var(--dn)' }}>
                      {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                    </td>
                    <td style={{ ...s.td, textAlign:'right' }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, background: totalPnL >= 0 ? 'var(--up-bg)' : 'var(--dn-bg)', color: totalPnL >= 0 ? 'var(--up)' : 'var(--dn)' }}>
                        {totalPnLPct >= 0 ? '+' : ''}{Number(totalPnLPct).toFixed(2)}%
                      </span>
                    </td>
                    <td style={s.td}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── TRADES TAB ── */}
      {tab === 'trades' && (
        <div style={s.card}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
              <thead>
                <tr>
                  {['Stock','Type','Qty','Price','Total','Balance After','Date'].map(h => (
                    <th key={h} style={{ ...s.th, textAlign: h === 'Stock' || h === 'Type' ? 'left' : 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...s.td, textAlign:'center', padding:40, color:'var(--text-3)' }}>No trades yet</td></tr>
                ) : orders.map(o => {
                  const isBuy = o.type === 'BUY';
                  return (
                    <tr key={o._id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={s.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:8, background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'var(--text-2)', flexShrink:0 }}>
                            {o.symbol?.slice(0,3)}
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700 }}>{o.symbol}</div>
                            <div style={{ fontSize:10, color:'var(--text-3)' }}>{o.orderType}</div>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:99, background: isBuy ? 'var(--up-bg)' : 'var(--dn-bg)', color: isBuy ? 'var(--up)' : 'var(--dn)' }}>
                          {o.type}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)' }}>{o.quantity}</td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)' }}>{formatCurrency(o.price)}</td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)', fontWeight:700, color: isBuy ? 'var(--dn)' : 'var(--up)' }}>
                        {isBuy ? '−' : '+'}{formatCurrency(o.totalAmount)}
                      </td>
                      <td style={{ ...s.td, textAlign:'right', fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>
                        {formatCurrency(o.balanceAfter)}
                      </td>
                      <td style={{ ...s.td, textAlign:'right', fontSize:12, color:'var(--text-3)' }}>
                        <div>{new Date(o.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })}</div>
                        <div style={{ fontSize:10, color:'var(--text-4)' }}>{new Date(o.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width:900px) {
          .pnl-grid-4 { grid-template-columns:repeat(2,1fr) !important; }
          .pnl-grid-2 { grid-template-columns:1fr !important; }
        }
        @media (max-width:480px) {
          .pnl-grid-4 { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function DonutChart({ holdings, total }) {
  const size = 160, cx = size/2, cy = size/2, r = 60, stroke = 22;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = holdings.map((h, i) => {
    const val  = h.currentValue ?? 0;
    const pct  = total > 0 ? val / total : 0;
    const dash = pct * circumference;
    const seg  = { offset, dash, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    offset += dash;
    return seg;
  });
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)', width:size, height:size }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke}/>
        {segments.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset} strokeLinecap="butt"/>
        ))}
      </svg>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
        <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:2 }}>Equity</div>
        <div style={{ fontSize:13, fontWeight:800, fontFamily:'var(--mono)' }}>₹{(total/1000).toFixed(1)}K</div>
      </div>
    </div>
  );
}