import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { fnoService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';

const FNO_STOCKS = [
  'NIFTY','BANKNIFTY','RELIANCE','TCS','HDFCBANK',
  'ICICIBANK','INFY','SBIN','BAJFINANCE','WIPRO',
  'AXISBANK','KOTAKBANK','MARUTI','TATAMOTORS','SUNPHARMA',
];

// ── ORDER MODAL ───────────────────────────────────────────────────────────────
function OrderModal({ option, symbol, spot, expiry, lotSize, onClose, onSuccess }) {
  const { user, updateBalance } = useAuth();
  const [lots,        setLots]        = useState(1);
  const [segment,     setSegment]     = useState('NRML');
  const [loading,     setLoading]     = useState(false);

  const qty       = lots * lotSize;
  const totalCost = +(option.premium * qty).toFixed(2);
  const canAfford = (user?.balance || 0) >= totalCost;

  const handlePlace = async () => {
    if (!canAfford) { toast.error('Insufficient balance'); return; }
    setLoading(true);
    try {
      const { data } = await fnoService.placeOrder({
        symbol,
        optionType:  option.type,
        strikePrice: option.strike,
        expiry,
        action:      'BUY',
        lots,
        premium:     option.premium,
        segment,
      });
      toast.success(data.message);
      updateBalance(data.newBalance);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally { setLoading(false); }
  };

  const isCall = option.type === 'CE';
  const color  = isCall ? 'var(--up)' : 'var(--dn)';
  const bgColor = isCall ? 'rgba(0,179,134,.08)' : 'rgba(231,76,60,.08)';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={onClose}>
      <div style={{ background:'var(--surface-0)', border:'1px solid var(--line)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:440, overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center', background: bgColor }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
              {symbol} {option.strike} {option.type}
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, fontWeight:700, background: isCall ? 'var(--up-bg)' : 'var(--dn-bg)', color }}>
                {isCall ? 'CALL' : 'PUT'}
              </span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>
              Expiry: {expiry} · Spot: {formatCurrency(spot)}
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--surface-2)', border:'none', cursor:'pointer', fontSize:14, color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Segment */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>Product Type</div>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { key:'NRML', label:'NRML', sub:'Positional' },
                { key:'MIS',  label:'MIS',  sub:'Intraday' },
              ].map(p => (
                <button key={p.key} onClick={() => setSegment(p.key)} style={{
                  flex:1, padding:'10px', borderRadius:'var(--radius-sm)', cursor:'pointer',
                  fontFamily:'var(--font)', border:'none', textAlign:'center',
                  background: segment===p.key ? 'var(--brand)' : 'var(--surface-2)',
                  color: segment===p.key ? '#fff' : 'var(--text-2)',
                }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{p.label}</div>
                  <div style={{ fontSize:10, opacity:.7, marginTop:2 }}>{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Lots */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>Number of Lots</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => setLots(l => Math.max(1, l-1))} style={{ width:40, height:40, borderRadius:'var(--radius-sm)', background:'var(--surface-2)', border:'1px solid var(--line)', fontSize:20, cursor:'pointer', color:'var(--text-1)', fontWeight:700 }}>−</button>
              <div style={{ flex:1, textAlign:'center', fontSize:22, fontWeight:800, fontFamily:'var(--mono)' }}>{lots}</div>
              <button onClick={() => setLots(l => l+1)} style={{ width:40, height:40, borderRadius:'var(--radius-sm)', background:'var(--surface-2)', border:'1px solid var(--line)', fontSize:20, cursor:'pointer', color:'var(--text-1)', fontWeight:700 }}>+</button>
            </div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:5, textAlign:'center' }}>
              {lots} lot{lots > 1 ? 's' : ''} × {lotSize} qty = {qty} shares
            </div>
          </div>

          {/* Summary */}
          <div style={{ background:'var(--surface-1)', borderRadius:'var(--radius-sm)', padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Premium',     val: `₹${option.premium}` },
              { label:'IV',          val: `${option.iv}%` },
              { label:'Quantity',    val: `${qty} shares` },
              { label:'Total Cost',  val: formatCurrency(totalCost), color: canAfford ? 'var(--up)' : 'var(--dn)', bold: true },
              { label:'Bal. After',  val: formatCurrency((user?.balance||0) - totalCost), color: canAfford ? 'var(--text-1)' : 'var(--dn)' },
            ].map(({ label, val, color: c, bold }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:'var(--text-3)' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight: bold ? 800 : 600, fontFamily:'var(--mono)', color: c || 'var(--text-1)' }}>{val}</span>
              </div>
            ))}
          </div>

          {!canAfford && (
            <div style={{ background:'var(--dn-bg)', border:'1px solid var(--dn)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:12, color:'var(--dn)', fontWeight:600 }}>
              ⚠️ Insufficient balance. Need {formatCurrency(totalCost - (user?.balance||0))} more.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 22px', borderTop:'1px solid var(--line)' }}>
          <button onClick={handlePlace} disabled={loading || !canAfford} style={{
            width:'100%', padding:'14px',
            background: isCall ? 'var(--up)' : 'var(--dn)',
            color:'#fff', border:'none', borderRadius:'var(--radius-sm)',
            fontSize:15, fontWeight:800, cursor: loading || !canAfford ? 'not-allowed' : 'pointer',
            fontFamily:'var(--font)', opacity: loading || !canAfford ? .6 : 1,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            {loading && <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/>}
            {loading ? 'Placing Order...' : `BUY ${option.type} @ ₹${option.premium}`}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN F&O PAGE ─────────────────────────────────────────────────────────────
export default function FnOPage() {
  const { user } = useAuth();

  const [symbol,    setSymbol]    = useState('NIFTY');
  const [chainData, setChainData] = useState(null);
  const [expiry,    setExpiry]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [filter,    setFilter]    = useState('All');
  const [orderModal,setOrderModal]= useState(null);

  const fetchChain = useCallback(async (sym, exp) => {
    setLoading(true);
    try {
      const { data } = await fnoService.getChain(sym || symbol, exp || expiry || undefined);
      setChainData(data);
      if (!expiry && data.expiries?.[0]) setExpiry(data.expiries[0]);
    } catch {
      toast.error('Failed to load options chain');
    } finally { setLoading(false); }
  }, [symbol, expiry]);

  useEffect(() => { fetchChain(symbol, ''); }, [symbol]);

  const filteredChain = React.useMemo(() => {
    if (!chainData?.chain) return [];
    const spot = chainData.spot;
    if (filter === 'ATM')     return chainData.chain.filter(r => r.isATM);
    if (filter === 'ITM')     return chainData.chain.filter(r => r.strike < spot);
    if (filter === 'OTM')     return chainData.chain.filter(r => r.strike > spot);
    return chainData.chain;
  }, [chainData, filter]);

  const s = {
    card:      { background:'var(--surface-0)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', overflow:'hidden', marginBottom:16 },
    th:        (color) => ({ padding:'10px 14px', fontSize:11, fontWeight:700, color: color || 'var(--text-3)', textTransform:'uppercase', letterSpacing:'.4px', textAlign:'center', borderBottom:'1px solid var(--line)', background: color === 'var(--up)' ? 'rgba(0,179,134,.06)' : color === 'var(--dn)' ? 'rgba(231,76,60,.06)' : 'var(--surface-2)' }),
    tdC:       (itm) => ({ padding:'10px 12px', fontSize:13, fontFamily:'var(--mono)', textAlign:'center', borderRight:'1px solid var(--line)', borderBottom:'1px solid var(--line)', background: itm ? 'rgba(0,179,134,.04)' : 'transparent' }),
    tdS:       (atm) => ({ padding:'10px 14px', fontSize:14, fontFamily:'var(--mono)', fontWeight:800, textAlign:'center', borderRight:'1px solid var(--line)', borderBottom:'1px solid var(--line)', minWidth:100, background: atm ? 'rgba(255,200,0,.1)' : 'var(--surface-1)', color: atm ? '#f39c12' : 'var(--text-1)' }),
    tdP:       (itm) => ({ padding:'10px 12px', fontSize:13, fontFamily:'var(--mono)', textAlign:'center', borderBottom:'1px solid var(--line)', background: itm ? 'rgba(231,76,60,.04)' : 'transparent' }),
  };

  return (
    <div className="fade-up" style={{ fontFamily:'var(--font)' }}>

      {orderModal && (
        <OrderModal
          option={orderModal}
          symbol={symbol}
          spot={chainData?.spot}
          expiry={expiry}
          lotSize={chainData?.lotSize || 50}
          onClose={() => setOrderModal(null)}
          onSuccess={() => fetchChain(symbol, expiry)}
        />
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>F&O · Options Chain</h1>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>Weekly & Monthly Expiry · Intraday (MIS) & Positional (NRML)</p>
        </div>
        <div style={{ background:'var(--dn-bg)', border:'1px solid rgba(231,76,60,.3)', borderRadius:'var(--radius-sm)', padding:'8px 14px', fontSize:12, color:'var(--dn)', fontWeight:700 }}>
          ⚠️ High Risk — Options can expire worthless
        </div>
      </div>

      {/* Balance + spot info */}
      <div style={{ ...s.card, padding:'16px 20px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3 }}>Available Balance</div>
          <div style={{ fontSize:20, fontWeight:800, fontFamily:'var(--mono)', color:'var(--brand)' }}>{formatCurrency(user?.balance)}</div>
        </div>
        {chainData && <>
          <div>
            <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3 }}>Spot Price</div>
            <div style={{ fontSize:20, fontWeight:800, fontFamily:'var(--mono)' }}>{formatCurrency(chainData.spot)}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3 }}>Lot Size</div>
            <div style={{ fontSize:20, fontWeight:800, fontFamily:'var(--mono)' }}>{chainData.lotSize}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3 }}>Underlying</div>
            <div style={{ fontSize:16, fontWeight:800 }}>{chainData.name}</div>
          </div>
        </>}
      </div>

      {/* Controls */}
      <div style={{ ...s.card, padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end' }}>

          {/* Symbol */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6 }}>Underlying</div>
            <select value={symbol} onChange={e => { setSymbol(e.target.value); setExpiry(''); }}
              style={{ padding:'10px 16px', background:'var(--surface-1)', border:'1.5px solid var(--line)', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font)', cursor:'pointer', minWidth:170 }}>
              {FNO_STOCKS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Expiry */}
          {chainData?.expiries && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6 }}>Expiry</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {chainData.expiries.map(exp => (
                  <button key={exp} onClick={() => { setExpiry(exp); fetchChain(symbol, exp); }} style={{
                    padding:'8px 14px', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:700,
                    cursor:'pointer', fontFamily:'var(--font)', border:'none',
                    background: expiry===exp ? 'var(--brand)' : 'var(--surface-2)',
                    color: expiry===exp ? '#fff' : 'var(--text-2)',
                    transition:'all .15s',
                  }}>{exp}</button>
                ))}
              </div>
            </div>
          )}

          {/* Filter */}
          <div style={{ marginLeft:'auto' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6 }}>Show</div>
            <div style={{ display:'flex', gap:4 }}>
              {['All','ATM','ITM','OTM'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding:'8px 14px', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:700,
                  cursor:'pointer', fontFamily:'var(--font)', border:'none', transition:'all .15s',
                  background: filter===f ? 'var(--surface-3)' : 'var(--surface-2)',
                  color: filter===f ? 'var(--text-1)' : 'var(--text-3)',
                }}>{f}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Options Chain Table */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:60, gap:12 }}>
          <div style={{ width:32, height:32, border:'3px solid var(--line)', borderTop:'3px solid var(--brand)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
          <span style={{ color:'var(--text-3)', fontSize:13 }}>Loading options chain...</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : chainData ? (
        <>
          {/* Legend */}
          <div style={{ display:'flex', gap:16, marginBottom:10, flexWrap:'wrap', fontSize:12, color:'var(--text-3)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:12, height:12, background:'rgba(0,179,134,.15)', borderRadius:3, display:'inline-block' }}/> ITM Call</span>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:12, height:12, background:'rgba(255,200,0,.2)', borderRadius:3, display:'inline-block' }}/> ATM Strike</span>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:12, height:12, background:'rgba(231,76,60,.15)', borderRadius:3, display:'inline-block' }}/> ITM Put</span>
            <span style={{ marginLeft:'auto' }}>Click premium to place order</span>
          </div>

          <div style={{ ...s.card, overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:650 }}>
              <thead>
                <tr>
                  <th style={s.th('var(--up)')}>CE Premium</th>
                  <th style={s.th('var(--up)')}>IV %</th>
                  <th style={s.th('var(--up)')}>Change</th>
                  <th style={s.th(null)}>STRIKE</th>
                  <th style={s.th('var(--dn)')}>Change</th>
                  <th style={s.th('var(--dn)')}>IV %</th>
                  <th style={s.th('var(--dn)')}>PE Premium</th>
                </tr>
              </thead>
              <tbody>
                {filteredChain.map(row => {
                  const spot   = chainData.spot;
                  const itmCall = row.strike < spot;
                  const itmPut  = row.strike > spot;

                  return (
                    <tr key={row.strike} style={{ transition:'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* CE side */}
                      <td style={{ ...s.tdC(itmCall), color:'var(--up)', fontWeight:700, cursor:'pointer' }}
                        onClick={() => setOrderModal({ type:'CE', strike:row.strike, premium:row.call.premium, iv:row.call.iv })}>
                        <div>₹{row.call.premium}</div>
                        <div style={{ fontSize:10, color:'var(--text-3)', marginTop:1 }}>Buy CE</div>
                      </td>
                      <td style={s.tdC(itmCall)}>{row.call.iv}%</td>
                      <td style={{ ...s.tdC(itmCall), color: row.call.change >= 0 ? 'var(--up)' : 'var(--dn)' }}>
                        {row.call.change >= 0 ? '+' : ''}{row.call.change}
                      </td>

                      {/* Strike */}
                      <td style={s.tdS(row.isATM)}>
                        {row.strike}
                        {row.isATM && <div style={{ fontSize:8, fontWeight:900, letterSpacing:1, marginTop:2 }}>ATM</div>}
                      </td>

                      {/* PE side */}
                      <td style={{ ...s.tdP(itmPut), color: row.put.change >= 0 ? 'var(--up)' : 'var(--dn)' }}>
                        {row.put.change >= 0 ? '+' : ''}{row.put.change}
                      </td>
                      <td style={s.tdP(itmPut)}>{row.put.iv}%</td>
                      <td style={{ ...s.tdP(itmPut), color:'var(--dn)', fontWeight:700, cursor:'pointer' }}
                        onClick={() => setOrderModal({ type:'PE', strike:row.strike, premium:row.put.premium, iv:row.put.iv })}>
                        <div>₹{row.put.premium}</div>
                        <div style={{ fontSize:10, color:'var(--text-3)', marginTop:1 }}>Buy PE</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* Info box */}
      <div style={{ ...s.card, padding:'20px 24px' }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>📚 Understanding Options</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
          {[
            { title:'CE (Call Option)',  desc:'Right to BUY the stock at strike price. Profitable when price rises.' },
            { title:'PE (Put Option)',   desc:'Right to SELL the stock at strike price. Profitable when price falls.' },
            { title:'ATM (At The Money)',desc:'Strike price closest to current spot price of the stock.' },
            { title:'ITM (In The Money)',desc:'Call: strike < spot. Put: strike > spot. Has intrinsic value.' },
            { title:'IV (Implied Vol.)', desc:'Market expectation of future volatility. Higher IV = costlier option.' },
            { title:'MIS (Intraday)',    desc:'Position auto-squares off at 3:20 PM. Lower margin required.' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ background:'var(--surface-1)', borderRadius:'var(--radius-sm)', padding:'12px 14px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--brand)', marginBottom:5 }}>{title}</div>
              <div style={{ fontSize:11, color:'var(--text-3)', lineHeight:1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}