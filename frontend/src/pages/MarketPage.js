import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketService } from '../services/stockService';
import { formatCurrency, formatPercent, isGain } from '../utils/helpers';
import CandlestickChart from '../components/charts/CandlestickChart';
import styles from './Market.module.css';

const INDICES_CONFIG = [
  { symbol:'NIFTY50',   label:'Nifty 50',      color:'#00b386' },
  { symbol:'SENSEX',    label:'BSE Sensex',     color:'#3498db' },
  { symbol:'BANKNIFTY', label:'Bank Nifty',     color:'#9b59b6' },
  { symbol:'NIFTYMID',  label:'Nifty Midcap',   color:'#f39c12' },
];

export default function MarketPage() {
  const [indices, setIndices]       = useState([]);
  const [movers, setMovers]         = useState({ gainers:[], losers:[], mostActive:[] });
  const [activeIdx, setActiveIdx]   = useState('NIFTY50');
  const [chartData, setChartData]   = useState([]);
  const [tab, setTab]               = useState('gainers');
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();

  const fetchAll = useCallback(async () => {
    try {
      const [idxRes, moversRes] = await Promise.all([
        marketService.getIndices(),
        marketService.getMovers(),
      ]);
      setIndices(idxRes.data.indices || []);
      setMovers(moversRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchChart = useCallback(async (sym) => {
    try {
      const { data } = await marketService.getIndexChart(sym, { period:'1M' });
      setChartData(data.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchChart(activeIdx); }, [activeIdx, fetchChart]);

  const activeIndex = indices.find(i => i.symbol === activeIdx);
  const up = activeIndex ? activeIndex.changePercent >= 0 : true;

  const tabData = { gainers: movers.gainers, losers: movers.losers, active: movers.mostActive };

  return (
    <div className="fade-up">
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Markets</h1>
        <p className={styles.sub}>Indian stock market overview — NSE &amp; BSE</p>
      </div>

      {/* Index cards */}
      <div className={styles.indexGrid}>
        {loading
          ? Array.from({length:4}).map((_,i)=>(
              <div key={i} className={styles.indexCard}>
                <div className="skel" style={{height:14,width:'50%',marginBottom:8}}/>
                <div className="skel" style={{height:24,width:'70%',marginBottom:6}}/>
                <div className="skel" style={{height:12,width:'40%'}}/>
              </div>
            ))
          : INDICES_CONFIG.map(cfg => {
              const idx = indices.find(i => i.symbol === cfg.symbol);
              if (!idx) return null;
              const isUp = idx.changePercent >= 0;
              const active = activeIdx === cfg.symbol;
              return (
                <div
                  key={cfg.symbol}
                  className={`${styles.indexCard} ${active ? styles.indexActive : ''}`}
                  onClick={() => setActiveIdx(cfg.symbol)}
                  style={active ? { borderColor: cfg.color, background: `${cfg.color}08` } : {}}
                >
                  <div className={styles.indexName}>{cfg.label}</div>
                  <div className={styles.indexValue} style={{color: active ? cfg.color : 'var(--text-1)'}}>
                    {idx.currentValue?.toLocaleString('en-IN', {maximumFractionDigits:2})}
                  </div>
                  <div className={`${styles.indexChange} ${isUp ? 'up' : 'dn'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(idx.change || 0).toFixed(2)} ({Math.abs(idx.changePercent || 0).toFixed(2)}%)
                  </div>
                  <IndexSparkline data={idx} color={cfg.color} isUp={isUp} />
                </div>
              );
            })
        }
      </div>

      {/* Main chart */}
      {activeIndex && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h2 className={styles.chartTitle}>{activeIndex.name || activeIdx}</h2>
              <div className={styles.chartPrice}>
                <span className={styles.chartVal}>
                  {activeIndex.currentValue?.toLocaleString('en-IN', {maximumFractionDigits:2})}
                </span>
                <span className={`${styles.chartChange} ${up ? 'up' : 'dn'}`}>
                  {up ? '+' : ''}{activeIndex.change?.toFixed(2)} ({up ? '+' : ''}{activeIndex.changePercent?.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className={styles.chartMeta}>
              <div className={styles.metaItem}><span>52W H</span><strong className="up">{activeIndex.high52?.toLocaleString('en-IN')}</strong></div>
              <div className={styles.metaItem}><span>52W L</span><strong className="dn">{activeIndex.low52?.toLocaleString('en-IN')}</strong></div>
            </div>
          </div>
          <CandlestickChart data={chartData} positive={up} height={300} showVolume={false} />
        </div>
      )}

      {/* Gainers / Losers / Most Active */}
      <div className={styles.moversCard}>
        <div className={styles.moversTabs}>
          {[['gainers','🚀 Top Gainers'],['losers','📉 Top Losers'],['active','⚡ Most Active']].map(([k,l]) => (
            <button key={k} className={`${styles.mTab} ${tab===k ? styles.mTabActive : ''}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        <div className={styles.moversTable}>
          <div className={styles.tableHead}>
            <span>Company</span>
            <span>Price</span>
            <span>Change</span>
            <span className={styles.hideXS}>Volume</span>
            <span className={styles.hideSM}>Market Cap</span>
          </div>
          {loading
            ? Array.from({length:8}).map((_,i) => (
                <div key={i} className={styles.moverRow}>
                  <div className="skel" style={{height:36,flex:1}}/>
                </div>
              ))
            : (tabData[tab] || []).map(stock => {
                const isUp = stock.changePercent >= 0;
                return (
                  <div key={stock.symbol} className={styles.moverRow} onClick={() => navigate(`/stocks/${stock.symbol}`)}>
                    <div className={styles.moverStock}>
                      <div className={styles.moverIcon}>{stock.symbol.slice(0,3)}</div>
                      <div>
                        <div className={styles.moverSym}>{stock.symbol}</div>
                        <div className={styles.moverName}>{stock.name}</div>
                      </div>
                    </div>
                    <div className={`${styles.moverPrice} num`}>{formatCurrency(stock.currentPrice)}</div>
                    <div className={`${styles.moverChg} ${isUp ? 'up' : 'dn'}`}>
                      <span className={styles.chgBadge + ' ' + (isUp ? 'up-bg' : 'dn-bg')}>
                        {isUp ? '▲' : '▼'} {Math.abs(stock.changePercent || 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className={`${styles.moverVol} ${styles.hideXS}`}>
                      {(stock.volume / 1e6).toFixed(2)}M
                    </div>
                    <div className={`${styles.moverMcap} ${styles.hideSM}`}>
                      {stock.marketCap ? '₹' + (stock.marketCap / 1e11).toFixed(1) + 'T' : '—'}
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

// Tiny sparkline for index cards
function IndexSparkline({ data, color, isUp }) {
  const pts = React.useMemo(() => {
    if (!data) return [];
    let h = 0;
    for (let i = 0; i < (data.symbol || '').length; i++) h = (h << 5) - h + (data.symbol || '').charCodeAt(i);
    const rng = () => { h = (h * 1664525 + 1013904223) & 0xffffffff; return ((h >>> 0) / 0xffffffff); };
    return Array.from({length:20}, (_, i) => {
      const base = 50 + (isUp ? i*1.2 : -i*1.0);
      return Math.max(10, Math.min(90, base + (rng()-0.5)*15));
    });
  }, [data, isUp]);

  const W=100, H=28;
  const mn=Math.min(...pts), mx=Math.max(...pts), rng=mx-mn||1;
  const svgPts = pts.map((p,i) => `${(i/(pts.length-1))*W},${H-2-((p-mn)/rng)*(H-4)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,marginTop:8,display:'block'}}>
      <polyline points={svgPts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
