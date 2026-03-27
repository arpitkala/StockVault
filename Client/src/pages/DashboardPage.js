import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWS } from '../context/WSContext';
import { stockService, portfolioService, marketService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { connected } = useWS();
  const navigate = useNavigate();

  const [gainers,   setGainers]   = useState([]);
  const [losers,    setLosers]    = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [indices,   setIndices]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Search state
  const [search,        setSearch]       = useState('');
  const [searchResults, setSearchResults]= useState([]);
  const [searching,     setSearching]    = useState(false);
  const [showDropdown,  setShowDropdown] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [moversRes, portRes, idxRes] = await Promise.allSettled([
        stockService.getAll({ sort: 'changePercent', limit: 10 }),
        portfolioService.get(),
        marketService.getIndices(),
      ]);
      if (moversRes.status === 'fulfilled') {
        const stocks = moversRes.value.data.stocks || [];
        setGainers(stocks.filter(s => s.changePercent >= 0).slice(0, 5));
        setLosers([...stocks].filter(s => s.changePercent < 0).sort((a,b) => a.changePercent - b.changePercent).slice(0, 5));
      }
      if (portRes.status === 'fulfilled') setPortfolio(portRes.value.data);
      if (idxRes.status === 'fulfilled') setIndices(idxRes.value.data.indices || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live search with debounce
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await stockService.getAll({ search: search.trim(), limit: 8 });
        setSearchResults(data.stocks || []);
        setShowDropdown(true);
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSelect = (symbol) => {
    setSearch('');
    setShowDropdown(false);
    setSearchResults([]);
    navigate(`/stocks/${symbol}`);
  };

  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Trader';

  const totalValue    = portfolio?.summary?.currentValue ?? 0;
  const totalInvested = portfolio?.summary?.totalInvested ?? 0;
  const totalPL       = portfolio?.summary?.totalPnL ?? (totalValue - totalInvested);
  const totalPLPct    = portfolio?.summary?.totalPnLPercent ?? (totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0);

  return (
    <div className="fade-up">
      {/* Greeting + Search */}
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.greetTitle}>{greeting}, {firstName} 👋</h1>
          <p className={styles.greetSub}>
            {now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            {' · '}
            <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
              {connected
                ? <><span className="live-dot"/><span>NSE Live</span></>
                : <><span style={{ display:'inline-block',width:6,height:6,borderRadius:'50%',background:'var(--dn)' }}/><span style={{color:'var(--dn)'}}>Offline</span></>
              }
            </span>
          </p>
        </div>

        {/* Search bar */}
        <div className={styles.searchWrap}>
          <div className={`${styles.searchBox} ${showDropdown ? styles.searchOpen : ''}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search stocks — RELIANCE, TCS, INFY..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {searching && <div className={styles.searchSpinner}/>}
            {search && !searching && (
              <button className={styles.clearBtn} onClick={() => { setSearch(''); setShowDropdown(false); }}>✕</button>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && searchResults.length > 0 && (
            <div className={styles.searchDropdown}>
              {searchResults.map(s => {
                const isUp = s.changePercent >= 0;
                return (
                  <div key={s.symbol} className={styles.searchResult} onMouseDown={() => handleSelect(s.symbol)}>
                    <div className={styles.resIcon}>{s.symbol.slice(0,3)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className={styles.resSym}>{s.symbol}</div>
                      <div className={styles.resName}>{s.name?.split(' ').slice(0,3).join(' ')}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div className={styles.resPrice}>{formatCurrency(s.currentPrice)}</div>
                      <span className={isUp ? 'up-bg' : 'dn-bg'} style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:99, display:'inline-block' }}>
                        {isUp ? '▲' : '▼'} {Math.abs(s.changePercent||0).toFixed(2)}%
                      </span>
                    </div>
                    <div className={styles.resArrow}>→</div>
                  </div>
                );
              })}
              <div className={styles.searchFooter} onMouseDown={() => { navigate('/stocks'); setShowDropdown(false); }}>
                View all stocks →
              </div>
            </div>
          )}

          {showDropdown && searchResults.length === 0 && !searching && search && (
            <div className={styles.searchDropdown}>
              <div className={styles.noResults}>No stocks found for "{search}"</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.sumCard} ${styles.balanceCard}`}>
          <div className={styles.sumLabel}>Available Balance</div>
          <div className={styles.sumValue}>{formatCurrency(user?.balance)}</div>
          <div className={styles.sumSub}>Ready to invest</div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Portfolio Value</div>
          <div className={styles.sumValue}>{formatCurrency(totalValue)}</div>
          <div className={styles.sumSub}>{portfolio?.holdings?.length ?? 0} holdings</div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Total Invested</div>
          <div className={styles.sumValue}>{formatCurrency(totalInvested)}</div>
          <div className={styles.sumSub}>Deployed capital</div>
        </div>
        <div className={`${styles.sumCard} ${totalPL >= 0 ? styles.plUp : styles.plDn}`}>
          <div className={styles.sumLabel}>Total P&amp;L</div>
          <div className={`${styles.sumValue} ${totalPL >= 0 ? 'up' : 'dn'}`}>
            {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
          </div>
          <div className={`${styles.sumSub} ${totalPL >= 0 ? 'up' : 'dn'}`}>
            {totalPLPct >= 0 ? '+' : ''}{Number(totalPLPct).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Index strip */}
      {indices.length > 0 && (
        <div className={styles.indicesRow}>
          {indices.map(idx => {
            const isUp = idx.changePercent >= 0;
            return (
              <div key={idx.symbol} className={styles.idxChip} onClick={() => navigate('/market')}>
                <span className={styles.idxName}>{idx.symbol}</span>
                <span className={`${styles.idxVal} num`}>
                  {idx.currentValue?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
                <span className={`${styles.idxChg} ${isUp ? 'up' : 'dn'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(idx.changePercent || 0).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main grid */}
      <div className={styles.mainGrid}>
        <div className={styles.moversCard}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Today's Movers</span>
            <button className={styles.viewAll} onClick={() => navigate('/market')}>See all →</button>
          </div>
          <div className={styles.moversGrid}>
            <div>
              <div className={styles.moversLabel}>🚀 Top Gainers</div>
              <MoverList stocks={gainers} loading={loading} navigate={navigate} />
            </div>
            <div>
              <div className={styles.moversLabel}>📉 Top Losers</div>
              <MoverList stocks={losers} loading={loading} navigate={navigate} />
            </div>
          </div>
        </div>

        <div className={styles.quickCard}>
          <div className={styles.cardTitle} style={{ marginBottom:12 }}>Quick Access</div>
          <div className={styles.quickGrid}>
            {[
              { icon:'📊', label:'Stocks',       sub:'50+ NSE/BSE',    path:'/stocks'    },
              { icon:'🌐', label:'Markets',       sub:'Nifty·Sensex',   path:'/market'    },
              { icon:'💼', label:'Portfolio',     sub:'Holdings & P&L', path:'/portfolio' },
              { icon:'📋', label:'Orders',        sub:'Trade history',  path:'/orders'    },
              { icon:'🚀', label:'IPO',           sub:'Open & Upcoming',path:'/ipo'       },
              { icon:'💰', label:'Mutual Funds',  sub:'SIP Calculator', path:'/sip'       },
            ].map(({ icon, label, sub, path }) => (
              <div key={path} className={styles.quickItem} onClick={() => navigate(path)}>
                <span className={styles.quickIcon}>{icon}</span>
                <div>
                  <div className={styles.quickLabel}>{label}</div>
                  <div className={styles.quickSub}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings snapshot */}
      {portfolio?.holdings?.length > 0 && (
        <div className={styles.holdingsCard}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Portfolio Snapshot</span>
            <button className={styles.viewAll} onClick={() => navigate('/portfolio')}>Full portfolio →</button>
          </div>
          <div className={styles.holdingsList}>
            {portfolio.holdings.slice(0, 4).map(h => {
              const pl    = h.pnl ?? ((h.currentPrice - h.avgBuyPrice) * h.quantity);
              const plPct = h.pnlPercent ?? (((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100);
              const isUp  = pl >= 0;
              return (
                <div key={h.symbol} className={styles.holdingRow} onClick={() => navigate(`/stocks/${h.symbol}`)}>
                  <div className={styles.holdingL}>
                    <div className={styles.holdingIcon}>{h.symbol.slice(0,3)}</div>
                    <div>
                      <div className={styles.holdingSym}>{h.symbol}</div>
                      <div className={styles.holdingMeta}>{h.quantity} shares · Avg {formatCurrency(h.avgBuyPrice)}</div>
                    </div>
                  </div>
                  <div className={styles.holdingR}>
                    <div className={`${styles.holdingPL} ${isUp ? 'up' : 'dn'}`}>
                      {isUp ? '+' : ''}{formatCurrency(pl)}
                    </div>
                    <span className={isUp ? 'up-bg' : 'dn-bg'} style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>
                      {isUp ? '+' : ''}{Number(plPct).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MoverList({ stocks, loading, navigate }) {
  if (loading) return (
    <div>
      {Array.from({length:4}).map((_,i) => (
        <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--line)' }}>
          <div className="skel" style={{ width:32,height:32,borderRadius:9,flexShrink:0 }}/>
          <div style={{ flex:1 }}><div className="skel" style={{ height:11,width:'55%',marginBottom:5 }}/><div className="skel" style={{ height:9,width:'35%' }}/></div>
          <div className="skel" style={{ width:56,height:24,borderRadius:6 }}/>
        </div>
      ))}
    </div>
  );
  return (
    <div>
      {stocks.map(s => {
        const isUp = s.changePercent >= 0;
        return (
          <div key={s.symbol}
            style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--line)',cursor:'pointer',transition:'background .1s' }}
            onClick={() => navigate(`/stocks/${s.symbol}`)}
          >
            <div style={{ width:32,height:32,borderRadius:9,background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'var(--text-2)',flexShrink:0 }}>
              {s.symbol.slice(0,3)}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:700 }}>{s.symbol}</div>
              <div style={{ fontSize:10,color:'var(--text-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{s.sector}</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20" style={{ flexShrink:0 }}>
              <polyline points={isUp ? '0,16 12,12 24,9 36,6 48,3' : '0,3 12,7 24,11 36,14 48,17'}
                fill="none" stroke={isUp ? '#00b386' : '#f05454'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ textAlign:'right',flexShrink:0 }}>
              <div style={{ fontSize:12,fontWeight:700,fontFamily:'var(--mono)' }}>{formatCurrency(s.currentPrice)}</div>
              <span style={{ fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:99,background:isUp?'var(--up-bg)':'var(--dn-bg)',color:isUp?'var(--up)':'var(--dn)' }}>
                {isUp?'▲':'▼'} {Math.abs(s.changePercent||0).toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}