import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';
import styles from './Portfolio.module.css';

const DONUT_COLORS = ['#00d09c','#3498db','#f39c12','#9b59b6','#e74c3c','#1abc9c','#e67e22','#2ecc71'];

export default function PortfolioPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    portfolioService.get()
      .then(r => setData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const holdings = data?.holdings || [];
  const total    = data?.summary?.currentValue    ?? 0;
  const invested = data?.summary?.totalInvested   ?? 0;
  const pnl      = data?.summary?.totalPnL        ?? (total - invested);
  const pnlPct   = data?.summary?.totalPnLPercent ?? (invested > 0 ? (pnl / invested) * 100 : 0);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <div style={{ width:36,height:36,border:'3px solid var(--line)',borderTop:'3px solid var(--brand)',borderRadius:'50%',animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="fade-up">
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Portfolio</h1>
        <p className={styles.sub}>Your holdings, P&amp;L and allocation</p>
      </div>

      {/* Summary row */}
      <div className={styles.summaryRow}>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Current Value</div>
          <div className={styles.sumVal}>{formatCurrency(total)}</div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Total Invested</div>
          <div className={styles.sumVal}>{formatCurrency(invested)}</div>
        </div>
        <div className={`${styles.sumCard} ${pnl >= 0 ? styles.sumUp : styles.sumDn}`}>
          <div className={styles.sumLabel}>Overall P&amp;L</div>
          <div className={`${styles.sumVal} ${pnl >= 0 ? 'up' : 'dn'}`}>
            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
          </div>
          <div className={`${styles.sumSub} ${pnl >= 0 ? 'up' : 'dn'}`}>
            {pnlPct >= 0 ? '+' : ''}{Number(pnlPct).toFixed(2)}%
          </div>
        </div>
        <div className={styles.sumCard}>
          <div className={styles.sumLabel}>Holdings</div>
          <div className={styles.sumVal}>{holdings.length}</div>
          <div className={styles.sumSub}>Active positions</div>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className={styles.empty}>
          <span>💼</span>
          <h3>No holdings yet</h3>
          <p>Start trading to see your portfolio here</p>
          <button className={styles.emptyBtn} onClick={() => navigate('/stocks')}>Browse Stocks</button>
        </div>
      ) : (
        <div className={styles.mainGrid}>
          {/* Holdings table */}
          <div className={styles.holdingsCard}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Holdings</span>
              <span className={styles.holdingCount}>{holdings.length} stocks</span>
            </div>
            <div className={styles.tableHead}>
              <span>Stock</span>
              <span>Qty</span>
              <span>Avg Cost</span>
              <span>LTP</span>
              <span>Current Value</span>
              <span>P&amp;L</span>
              <span>Day</span>
            </div>
            <div className="stagger">
              {holdings.map((h, i) => {
                const pl     = h.pnl         ?? ((h.currentPrice - h.avgBuyPrice) * h.quantity);
                const plPct  = h.pnlPercent  ?? (((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100);
                const curVal = h.currentValue ?? (h.currentPrice * h.quantity);
                const dayPct = h.dayChangePercent ?? h.changePercent ?? 0;
                const isUp   = pl >= 0;
                const dayUp  = dayPct >= 0;
                const name   = h.stockName || h.name || h.symbol;

                return (
                  <div key={h.symbol} className={styles.holdingRow} onClick={() => navigate(`/stocks/${h.symbol}`)}>
                    <div className={styles.stockCell}>
                      <div className={styles.stockIcon} style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] + '22', color: DONUT_COLORS[i % DONUT_COLORS.length] }}>
                        {h.symbol.slice(0,3)}
                      </div>
                      <div>
                        <div className={styles.stockSym}>{h.symbol}</div>
                        <div className={styles.stockName}>{name?.split(' ').slice(0,2).join(' ')}</div>
                      </div>
                    </div>
                    <div className={`${styles.cell} num`}>{h.quantity}</div>
                    <div className={`${styles.cell} num`}>{formatCurrency(h.avgBuyPrice)}</div>
                    <div className={`${styles.cell} num`} style={{ fontWeight:700 }}>{formatCurrency(h.currentPrice)}</div>
                    <div className={`${styles.cell} num`}>{formatCurrency(curVal)}</div>
                    <div className={styles.cell}>
                      <div className={`num ${isUp ? 'up' : 'dn'}`} style={{ fontWeight:700, fontSize:13 }}>
                        {isUp ? '+' : ''}{formatCurrency(pl)}
                      </div>
                      <div className={isUp ? 'up-bg' : 'dn-bg'} style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:4, display:'inline-block', marginTop:3 }}>
                        {isUp ? '+' : ''}{Number(plPct).toFixed(2)}%
                      </div>
                    </div>
                    <div className={styles.cell}>
                      <span className={dayUp ? 'up-bg' : 'dn-bg'} style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, display:'inline-block' }}>
                        {dayUp ? '▲' : '▼'} {Math.abs(dayPct).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut allocation */}
          <div className={styles.allocCard}>
            <div className={styles.cardTitle} style={{ marginBottom:16 }}>Allocation</div>
            <DonutChart holdings={holdings} total={total} />
            <div className={styles.legend}>
              {holdings.map((h, i) => {
                const val = h.currentValue ?? (h.currentPrice * h.quantity);
                const pct = total > 0 ? (val / total * 100) : 0;
                return (
                  <div key={h.symbol} className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}/>
                    <span className={styles.legendSym}>{h.symbol}</span>
                    <span className={styles.legendPct}>{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DonutChart({ holdings, total }) {
  const size = 160, cx = size/2, cy = size/2, r = 60, stroke = 22;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = holdings.map((h, i) => {
    const val  = h.currentValue ?? (h.currentPrice * h.quantity);
    const pct  = total > 0 ? val / total : 0;
    const dash = pct * circumference;
    const seg  = { offset, dash, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ position:'relative', width:size, height:size, margin:'0 auto 14px' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)', width:size, height:size }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke}/>
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
        <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:2 }}>Total</div>
        <div style={{ fontSize:13, fontWeight:800, fontFamily:'var(--mono)' }}>
          ₹{(total/1000).toFixed(1)}K
        </div>
      </div>
    </div>
  );
}