import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';
import styles from './Stocks.module.css';

const SECTORS = ['All','IT','Banking','FMCG','Auto','Pharma','Energy','Finance','Infra','Consumer','Materials','Telecom','Healthcare','Fintech','Utilities','Chemicals'];
const SORTS   = [{ v:'marketCap', l:'Market Cap' }, { v:'changePercent', l:'% Change' }, { v:'volume', l:'Volume' }, { v:'currentPrice', l:'Price' }];

export default function StocksPage() {
  const [stocks,  setStocks]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [sector,  setSector]  = useState('All');
  const [sort,    setSort]    = useState('marketCap');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await stockService.getAll({
        search:   search || undefined,
        sector:   sector !== 'All' ? sector : undefined,
        sort,
        order:    'desc',
        limit:    50,
      });
      setStocks(data.stocks || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, sector, sort]);

  useEffect(() => {
    const t = setTimeout(fetchStocks, 300);
    return () => clearTimeout(t);
  }, [fetchStocks]);

  return (
    <div className="fade-up">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Stocks</h1>
          <p className={styles.sub}>50 NSE/BSE stocks with live prices &amp; candlestick data</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className={styles.searchInput}
            placeholder="Search symbol or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className={styles.sortSelect}>
          {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>

      {/* Sector chips */}
      <div className={styles.sectorRow}>
        {SECTORS.map(s => (
          <button key={s} className={`${styles.sChip} ${sector === s ? styles.sChipActive : ''}`} onClick={() => setSector(s)}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
          <span>Stock</span>
          <span>LTP</span>
          <span>Change</span>
          <span>Trend</span>
          <span className={styles.hideSM}>Volume</span>
          <span className={styles.hideMD}>Mkt Cap</span>
          <span className={styles.hideMD}>P/E</span>
          <span>Sector</span>
        </div>

        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.tableRow} style={{ cursor:'default', pointerEvents:'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="skel" style={{ width:36, height:36, borderRadius:9, flexShrink:0 }}/>
                  <div><div className="skel" style={{ height:12, width:80, marginBottom:5 }}/><div className="skel" style={{ height:10, width:120 }}/></div>
                </div>
                <div className="skel" style={{ height:14, width:70 }}/>
                <div className="skel" style={{ height:24, width:64, borderRadius:99 }}/>
                <div className="skel" style={{ height:18, width:60 }}/>
                <div className="skel" style={{ height:12, width:55 }}/>
                <div className="skel" style={{ height:12, width:60 }}/>
                <div className="skel" style={{ height:12, width:36 }}/>
                <div className="skel" style={{ height:22, width:70, borderRadius:99 }}/>
              </div>
            ))
          : stocks.length === 0
            ? <div className={styles.empty}><span>🔍</span><p>No stocks found for "{search || sector}"</p></div>
            : stocks.map(s => {
                const isUp = s.changePercent >= 0;
                const pts  = isUp
                  ? '0,16 12,12 24,9 36,6 48,4 60,2'
                  : '0,2 12,5 24,9 36,12 48,15 60,17';
                return (
                  <div key={s.symbol} className={styles.tableRow} onClick={() => navigate(`/stocks/${s.symbol}`)}>
                    {/* Stock info */}
                    <div className={styles.stockCell}>
                      <div className={styles.stockIcon}>{s.symbol.slice(0,3)}</div>
                      <div>
                        <div className={styles.stockSym}>{s.symbol}</div>
                        <div className={styles.stockName}>{s.name?.split(' ').slice(0,3).join(' ')}</div>
                      </div>
                    </div>
                    {/* Price */}
                    <div className={`${styles.price} num`}>{formatCurrency(s.currentPrice)}</div>
                    {/* Change */}
                    <div>
                      <span className={`${styles.changeBadge} ${isUp ? 'up-bg' : 'dn-bg'}`}>
                        {isUp ? '▲' : '▼'} {Math.abs(s.changePercent || 0).toFixed(2)}%
                      </span>
                    </div>
                    {/* Sparkline */}
                    <svg width="60" height="20" viewBox="0 0 60 20" style={{ flexShrink:0 }}>
                      <polyline points={pts} fill="none" stroke={isUp ? '#00b386' : '#f05454'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {/* Volume */}
                    <div className={`${styles.vol} ${styles.hideSM}`}>
                      {s.volume ? (s.volume / 1e6).toFixed(2) + 'M' : '—'}
                    </div>
                    {/* Market cap */}
                    <div className={`${styles.mcap} ${styles.hideMD}`}>
                      {s.marketCap ? '₹' + (s.marketCap / 1e11).toFixed(1) + 'T' : '—'}
                    </div>
                    {/* PE */}
                    <div className={`${styles.pe} ${styles.hideMD}`}>
                      {s.pe ? s.pe.toFixed(1) : '—'}
                    </div>
                    {/* Sector */}
                    <div>
                      <span className={styles.sectorBadge}>{s.sector}</span>
                    </div>
                  </div>
                );
              })
        }
      </div>
    </div>
  );
}
