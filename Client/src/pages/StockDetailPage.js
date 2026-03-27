import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { stockService, orderService, watchlistService } from '../services/stockService';
import { useAuth } from '../context/AuthContext';
import { useWS } from '../context/WSContext';
import { formatCurrency, formatNumber } from '../utils/helpers';
import CandlestickChart from '../components/charts/CandlestickChart';
import styles from './StockDetail.module.css';

export default function StockDetailPage() {
  const { symbol }              = useParams();
  const navigate                = useNavigate();
  const { user, updateBalance } = useAuth();
  const { prices }              = useWS();

  const [stock,   setStock]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWL,    setInWL]    = useState(false);

  const [tradeType,  setTrade]   = useState('BUY');
  const [qty,        setQty]     = useState(1);
  const [orderType,  setOType]   = useState('MARKET');
  const [limitPrice, setLimit]   = useState('');
  const [placing,    setPlacing] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await stockService.getBySymbol(symbol);
      setStock(data.stock);
      setLimit(data.stock.currentPrice?.toFixed(2));
    } catch { toast.error('Stock not found'); navigate('/stocks'); }
    finally { setLoading(false); }
  }, [symbol, navigate]);

  useEffect(() => {
    fetchStock();
    watchlistService.get()
      .then(({ data }) => setInWL(data.watchlist?.some(s => s.symbol === symbol.toUpperCase())))
      .catch(() => {});
  }, [fetchStock, symbol]);

  const live      = prices[symbol?.toUpperCase()];
  const price     = live?.currentPrice  ?? stock?.currentPrice  ?? 0;
  const changePct = live?.changePercent ?? stock?.changePercent ?? 0;
  const change    = live?.change        ?? stock?.change        ?? 0;
  const isUp      = changePct >= 0;

  const execPrice = orderType === 'LIMIT' && limitPrice ? +limitPrice : price;
  const totalCost = execPrice * qty;
  const canAfford = (user?.balance ?? 0) >= totalCost;
  const shortage  = totalCost - (user?.balance ?? 0);

  const handleTrade = async () => {
    if (qty < 1) return toast.error('Quantity must be at least 1');
    if (tradeType === 'BUY' && !canAfford) return toast.error('Insufficient balance!');
    setPlacing(true);
    try {
      const { data } = await orderService.place({
        symbol: symbol.toUpperCase(), type: tradeType,
        quantity: qty, orderType,
        limitPrice: orderType === 'LIMIT' ? +limitPrice : undefined,
      });
      toast.success(data.message);
      updateBalance(data.newBalance);
      setQty(1);
      fetchStock();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally { setPlacing(false); }
  };

  const toggleWL = async () => {
    try {
      if (inWL) { await watchlistService.remove(symbol); toast.success(`${symbol} removed`); }
      else       { await watchlistService.add(symbol);    toast.success(`Added to watchlist ⭐`); }
      setInWL(!inWL);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <div style={{ width:36,height:36,border:'3px solid var(--line)',borderTop:'3px solid var(--brand)',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="fade-up">
      <div className={styles.breadcrumb} onClick={() => navigate('/stocks')}>← Back to Stocks</div>

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.symbolBadge}>{symbol?.slice(0,3)}</div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <h1 className={styles.sym}>{symbol}</h1>
              <span className={styles.exchange}>{stock?.exchange}</span>
              <span className={styles.sector}>{stock?.sector}</span>
            </div>
            <div className={styles.compName}>{stock?.name}</div>
          </div>
        </div>
        <button className={`${styles.wlBtn} ${inWL ? styles.wlActive : ''}`} onClick={toggleWL}>
          {inWL ? '★ Watchlisted' : '☆ Add to Watchlist'}
        </button>
      </div>

      <div className={styles.priceRow}>
        <span className={styles.price}>{formatCurrency(price)}</span>
        <div className={`${styles.changeChip} ${isUp ? 'up-bg' : 'dn-bg'}`}>
          {isUp ? '▲' : '▼'} {formatCurrency(Math.abs(change))} ({Math.abs(changePct).toFixed(2)}%)
        </div>
        <div className={styles.liveDot}>
          <span className="live-dot"/> <span style={{ fontSize:11, color:'var(--text-3)' }}>Live</span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <div className={styles.chartCard}>
            <CandlestickChart data={stock?.candlestickData || []} positive={isUp} height={320} showVolume={true}/>
          </div>

          <div className={styles.statsCard}>
            <h3 className={styles.statsTitle}>Key Statistics</h3>
            <div className={styles.statsGrid}>
              {[
                ['Open',       formatCurrency(stock?.open)],
                ['Prev Close', formatCurrency(stock?.previousClose)],
                ['Day High',   formatCurrency(stock?.high)],
                ['Day Low',    formatCurrency(stock?.low)],
                ['52W High',   formatCurrency(stock?.high52)],
                ['52W Low',    formatCurrency(stock?.low52)],
                ['Volume',     formatNumber(stock?.volume)],
                ['Avg Volume', formatNumber(stock?.avgVolume)],
                ['Market Cap', stock?.marketCap ? '₹' + formatNumber(stock.marketCap) : '—'],
                ['P/E Ratio',  stock?.pe?.toFixed(1) ?? '—'],
                ['EPS',        stock?.eps ? formatCurrency(stock.eps) : '—'],
                ['Lot Size',   stock?.lotSize ?? 1],
              ].map(([label, val]) => (
                <div key={label} className={styles.statRow}>
                  <span className={styles.statLabel}>{label}</span>
                  <span className={styles.statVal}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.rangeCard}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'var(--text-3)' }}>52 Week Range</span>
            </div>
            <div className={styles.rangeLine}>
              <span className={styles.rangeMin}>{formatCurrency(stock?.low52)}</span>
              <div className={styles.rangeBar}>
                <div className={styles.rangeFill} style={{ left:`${((price-(stock?.low52||0))/((stock?.high52||1)-(stock?.low52||0)))*100}%` }}/>
              </div>
              <span className={styles.rangeMax}>{formatCurrency(stock?.high52)}</span>
            </div>
          </div>
        </div>

        {/* Trade panel */}
        <div className={styles.rightCol}>
          <div className={styles.tradeCard}>
            <div className={styles.tradeToggle}>
              <button className={`${styles.tBtn} ${tradeType==='BUY'?styles.buyActive:''}`} onClick={()=>setTrade('BUY')}>BUY</button>
              <button className={`${styles.tBtn} ${tradeType==='SELL'?styles.sellActive:''}`} onClick={()=>setTrade('SELL')}>SELL</button>
            </div>

            <div className={styles.fieldGroup}>
              <label>Order Type</label>
              <div className={styles.segmented}>
                {['MARKET','LIMIT'].map(t => (
                  <button key={t} className={`${styles.seg} ${orderType===t?styles.segActive:''}`} onClick={()=>setOType(t)}>{t}</button>
                ))}
              </div>
            </div>

            {orderType === 'LIMIT' && (
              <div className={styles.fieldGroup}>
                <label>Limit Price</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inrSign}>₹</span>
                  <input type="number" step="0.05" min="0.01" value={limitPrice} onChange={e=>setLimit(e.target.value)} className={styles.numInput}/>
                </div>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label>Quantity (Shares)</label>
              <div className={styles.qtyRow}>
                <button className={styles.qBtn} onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                <input type="number" min="1" value={qty} onChange={e=>setQty(Math.max(1,+e.target.value||1))} className={styles.qInput}/>
                <button className={styles.qBtn} onClick={()=>setQty(q=>q+1)}>+</button>
              </div>
            </div>

            <div className={styles.summary}>
              <div className={styles.sumRow}>
                <span>{orderType==='LIMIT'?'Limit Price':'Market Price'}</span>
                <span className="num">{formatCurrency(execPrice)}</span>
              </div>
              <div className={styles.sumRow}>
                <span>Quantity</span>
                <span className="num">{qty} shares</span>
              </div>
              <div className={`${styles.sumRow} ${styles.sumTotal}`}>
                <span>Est. {tradeType==='BUY'?'Cost':'Credit'}</span>
                <span className={`num ${tradeType==='BUY'?'dn':'up'}`}>{formatCurrency(totalCost)}</span>
              </div>
              <div className={styles.sumRow} style={{ fontSize:11, color:'var(--text-3)' }}>
                <span>Bal. after</span>
                <span className="num" style={{ color: canAfford||tradeType==='SELL'?'var(--text-2)':'var(--dn)' }}>
                  {tradeType==='BUY' ? formatCurrency((user?.balance||0)-totalCost) : formatCurrency((user?.balance||0)+totalCost)}
                </span>
              </div>
            </div>

            <button
              className={`${styles.tradeExec} ${tradeType==='SELL'?styles.execSell:''}`}
              onClick={handleTrade}
              disabled={placing||(tradeType==='BUY'&&!canAfford)}
            >
              {placing?<span className={styles.btnSpinner}/>:null}
              {placing?'Processing…':`${tradeType} ${qty} Share${qty>1?'s':''}`}
            </button>

            {/* ── INSUFFICIENT BALANCE BLOCK ── */}
            {tradeType === 'BUY' && !canAfford && (
              <div className={styles.insufficientBox}>
                <div className={styles.insufficientTop}>
                  <span className={styles.insufficientIcon}>⚠️</span>
                  <div>
                    <div className={styles.insufficientTitle}>Insufficient Balance</div>
                    <div className={styles.insufficientSub}>
                      You need <span className="dn">{formatCurrency(shortage)}</span> more to place this order
                    </div>
                  </div>
                </div>
                <div className={styles.insufficientMeta}>
                  <div className={styles.balRow}>
                    <span>Available</span>
                    <span className="num">{formatCurrency(user?.balance)}</span>
                  </div>
                  <div className={styles.balRow}>
                    <span>Required</span>
                    <span className="num dn">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className={styles.balRow} style={{ borderTop:'1px solid var(--line)', paddingTop:6, marginTop:2 }}>
                    <span>Shortfall</span>
                    <span className="num dn">{formatCurrency(shortage)}</span>
                  </div>
                </div>
                <button
                  className={styles.addFundsBtn}
                  onClick={() => navigate('/profile', { state: { openAddFunds: true } })}
                >
                  ➕ Add Funds to Continue
                </button>
              </div>
            )}

            <div className={styles.availBal}>
              Available: <strong>{formatCurrency(user?.balance)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}