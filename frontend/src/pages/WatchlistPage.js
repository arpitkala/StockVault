import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { watchlistService, stockService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';
import { useWS } from '../context/WSContext';
import PriceAlertModal from '../components/ui/PriceAlertModal';
import styles from './Watchlist.module.css';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [search,    setSearch]    = useState('');
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [alertStock,setAlertStock]= useState(null);
  const { prices } = useWS();
  const navigate = useNavigate();

  const fetchWL = async () => {
    setLoading(true);
    try {
      const { data } = await watchlistService.get();
      setWatchlist(data.watchlist || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchWL(); }, []);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await stockService.getAll({ search: search.trim(), limit: 6 });
        setResults(data.stocks || []);
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const addStock = async (symbol) => {
    setAdding(true);
    try {
      await watchlistService.add(symbol);
      toast.success(`${symbol} added ⭐`);
      setSearch(''); setResults([]);
      fetchWL();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Already in watchlist');
    } finally { setAdding(false); }
  };

  const removeStock = async (symbol, e) => {
    e.stopPropagation();
    try {
      await watchlistService.remove(symbol);
      setWatchlist(wl => wl.filter(s => s.symbol !== symbol));
      toast.success(`${symbol} removed`);
    } catch (e) { toast.error('Could not remove'); }
  };

  return (
   <div className="fade-up">
      {alertStock && (
        <PriceAlertModal
          symbol={alertStock.symbol}
          currentPrice={alertStock.price}
          onClose={() => setAlertStock(null)}
        />
      )}
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Watchlist</h1>
        <p className={styles.sub}>{watchlist.length}/20 stocks tracked</p>
      </div>

      {/* Add stock search */}
      <div className={styles.addCard}>
        <div className={styles.searchLabel}>Add to Watchlist</div>
        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className={styles.searchInput}
            placeholder="Search NSE / BSE symbol..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {results.length > 0 && (
          <div className={styles.searchDropdown}>
            {results.map(s => (
              <div key={s.symbol} className={styles.searchResult} onClick={() => addStock(s.symbol)}>
                <div className={styles.resIcon}>{s.symbol.slice(0,3)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{s.symbol}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>{s.name}</div>
                </div>
                <span className={`${s.changePercent >= 0 ? 'up' : 'dn'}`} style={{ fontSize:12, fontWeight:700 }}>
                  {formatCurrency(s.currentPrice)}
                </span>
                <button className={styles.addBtn} disabled={adding}>+ Add</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist grid */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.stockCard}>
              <div className="skel" style={{ height:16, width:'60%', marginBottom:8 }}/>
              <div className="skel" style={{ height:24, width:'45%', marginBottom:8 }}/>
              <div className="skel" style={{ height:36, marginBottom:8 }}/>
              <div className="skel" style={{ height:12, width:'80%' }}/>
            </div>
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className={styles.empty}>
          <span>⭐</span>
          <h3>Watchlist is empty</h3>
          <p>Search above to add stocks you want to track</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {watchlist.map(s => {
            const live  = prices[s.symbol];
            const price = live?.currentPrice   ?? s.currentPrice   ?? 0;
            const chgPct= live?.changePercent  ?? s.changePercent  ?? 0;
            const chg   = live?.change         ?? s.change         ?? 0;
            const isUp  = chgPct >= 0;
            return (
              <div key={s.symbol} className={styles.stockCard} onClick={() => navigate(`/stocks/${s.symbol}`)}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <div className={styles.cardIcon}>{s.symbol.slice(0,3)}</div>
                    <div>
                      <div className={styles.sym}>{s.symbol}</div>
                      <div className={styles.sect}>{s.sector}</div>
                    </div>
                  </div>
                 <div style={{ display:'flex', gap:4 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setAlertStock({ symbol: s.symbol, price }); }}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, padding:'2px 4px', color:'var(--text-3)' }}
                      title="Set price alert"
                    >🔔</button>
                    <button
                      className={styles.removeBtn}
                      onClick={e => removeStock(s.symbol, e)}
                      title="Remove from watchlist"
                    >✕</button>
                  </div>
                </div>

                <div className={styles.priceRow}>
                  <div className={`${styles.price} num`}>{formatCurrency(price)}</div>
                  <span className={`${styles.chgBadge} ${isUp ? 'up-bg' : 'dn-bg'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(chgPct).toFixed(2)}%
                  </span>
                </div>

                {/* Mini sparkline */}
                <svg width="100%" height="36" viewBox="0 0 200 36" preserveAspectRatio="none" style={{ display:'block', margin:'6px 0' }}>
                  <defs>
                    <linearGradient id={`gf-${s.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isUp ? '#00b386' : '#f05454'} stopOpacity=".18"/>
                      <stop offset="100%" stopColor={isUp ? '#00b386' : '#f05454'} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {isUp
                    ? <>
                        <polygon points="0,32 40,26 80,20 120,14 160,9 200,4 200,36 0,36" fill={`url(#gf-${s.symbol})`}/>
                        <polyline points="0,32 40,26 80,20 120,14 160,9 200,4" fill="none" stroke="#00b386" strokeWidth="1.5" strokeLinecap="round"/>
                      </>
                    : <>
                        <polygon points="0,4 40,9 80,14 120,20 160,26 200,32 200,36 0,36" fill={`url(#gf-${s.symbol})`}/>
                        <polyline points="0,4 40,9 80,14 120,20 160,26 200,32" fill="none" stroke="#f05454" strokeWidth="1.5" strokeLinecap="round"/>
                      </>
                  }
                </svg>

                <div className={styles.cardFoot}>
                  <span style={{ fontSize:11, color:'var(--text-3)' }}>H: {formatCurrency(s.high)} · L: {formatCurrency(s.low)}</span>
                  <span className={`${isUp ? 'up' : 'dn'}`} style={{ fontSize:11, fontWeight:600 }}>
                    {isUp ? '+' : ''}{formatCurrency(chg)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
