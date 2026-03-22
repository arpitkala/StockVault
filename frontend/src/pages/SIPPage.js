import React, { useEffect, useState, useCallback } from 'react';
import { sipService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './SIP.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CATEGORIES = ['All','Large Cap','Mid Cap','Small Cap','Flexi Cap','Index Fund','Hybrid','Sectoral'];
const RISK_COLOR = { 'Low':'up', 'Moderate':'info', 'High':'warn', 'Very High':'dn' };

export default function SIPPage() {
  const [funds, setFunds] = useState([]);
  const [cat, setCat]     = useState('All');
  const [sort, setSort]   = useState('returns1y');
  const [loading, setLoading] = useState(true);

  // SIP Calculator state
  const [monthly, setMonthly]   = useState(5000);
  const [years, setYears]       = useState(10);
  const [rate, setRate]         = useState(12);
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalc]  = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await sipService.getFunds({
          category: cat !== 'All' ? cat : undefined,
          sort,
        });
        setFunds(data.funds || []);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [cat, sort]);

  const calculate = useCallback(async () => {
    setCalc(true);
    try {
      const { data } = await sipService.calculate({ monthly, years, expectedReturn: rate });
      setCalcResult(data.result);
    } catch {
      // Fallback local calculation
      const r = rate / 100 / 12, n = years * 12, P = monthly;
      const fv = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const invested = P * n;
      const pts = [];
      let v = 0, inv = 0;
      for (let i = 1; i <= n; i++) {
        inv += P; v = (v + P) * (1 + r);
        if (i % 12 === 0) pts.push({ year: i / 12, invested: +inv.toFixed(0), value: +v.toFixed(0) });
      }
      setCalcResult({ futureValue: +fv.toFixed(0), totalInvested: +invested.toFixed(0), gains: +(fv - invested).toFixed(0), wealthRatio: +(fv / invested).toFixed(2), monthlyData: pts });
    } finally { setCalc(false); }
  }, [monthly, years, rate]);

  useEffect(() => { calculate(); }, [calculate]);

  const chartData = calcResult ? {
    labels: calcResult.monthlyData?.map(d => `Yr ${d.year}`) || [],
    datasets: [
      { label:'Invested', data: calcResult.monthlyData?.map(d => d.invested) || [], backgroundColor: 'rgba(52,152,219,0.7)', borderRadius: 4 },
      { label:'Returns',  data: calcResult.monthlyData?.map(d => d.value - d.invested) || [], backgroundColor: 'rgba(0,179,134,0.7)', borderRadius: 4, stack:'s' },
    ],
  } : null;

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend:{ labels:{ font:{family:'Plus Jakarta Sans',size:12}, color:'var(--text-2)' } }, tooltip:{ callbacks:{ label: ctx => `  ₹${ctx.parsed.y.toLocaleString('en-IN')}` } } },
    scales: {
      x: { stacked:true, grid:{display:false}, ticks:{color:'var(--text-3)',font:{size:11}} },
      y: { stacked:true, grid:{color:'rgba(0,0,0,0.05)'}, ticks:{ color:'var(--text-3)', callback: v => '₹'+v.toLocaleString('en-IN',{notation:'compact'}) } },
    },
  };

  return (
    <div className="fade-up">
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Mutual Funds</h1>
        <p className={styles.sub}>SIP, Lumpsum &amp; more — Start investing in mutual funds</p>
      </div>

      {/* SIP Calculator */}
      <div className={styles.calcSection}>
        <div className={styles.calcLeft}>
          <h2 className={styles.calcTitle}>SIP Calculator</h2>
          <p className={styles.calcSub}>Estimate your wealth with monthly SIP</p>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>Monthly SIP Amount</span>
              <span className={styles.sliderVal}>₹{monthly.toLocaleString('en-IN')}</span>
            </div>
            <input type="range" min={500} max={100000} step={500} value={monthly} onChange={e => setMonthly(+e.target.value)} className={styles.slider} />
            <div className={styles.sliderRange}><span>₹500</span><span>₹1L</span></div>
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>Time Period</span>
              <span className={styles.sliderVal}>{years} years</span>
            </div>
            <input type="range" min={1} max={30} step={1} value={years} onChange={e => setYears(+e.target.value)} className={styles.slider} />
            <div className={styles.sliderRange}><span>1 yr</span><span>30 yrs</span></div>
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>Expected Return (p.a.)</span>
              <span className={styles.sliderVal}>{rate}%</span>
            </div>
            <input type="range" min={6} max={30} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} className={styles.slider} />
            <div className={styles.sliderRange}><span>6%</span><span>30%</span></div>
          </div>

          {calcResult && (
            <div className={styles.calcResults}>
              <div className={styles.calcResultItem}>
                <span>Invested Amount</span>
                <strong>₹{calcResult.totalInvested?.toLocaleString('en-IN')}</strong>
              </div>
              <div className={styles.calcResultItem}>
                <span>Est. Returns</span>
                <strong className="up">₹{calcResult.gains?.toLocaleString('en-IN')}</strong>
              </div>
              <div className={`${styles.calcResultItem} ${styles.calcTotal}`}>
                <span>Total Value</span>
                <strong>₹{calcResult.futureValue?.toLocaleString('en-IN')}</strong>
              </div>
              <div className={styles.calcResultItem}>
                <span>Wealth Ratio</span>
                <strong className="up">{calcResult.wealthRatio}x</strong>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className={styles.calcRight}>
          <div className={styles.calcChartWrap}>
            {chartData ? <Bar data={chartData} options={chartOpts} /> : <div className="skel" style={{ height:'100%', borderRadius:12 }} />}
          </div>
          {calcResult && (
            <div className={styles.pieRow}>
              <div className={styles.pieLegend}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:12,height:12,borderRadius:3,background:'rgba(52,152,219,0.7)' }}/>
                  <span style={{ fontSize:12,color:'var(--text-2)' }}>Invested: ₹{calcResult.totalInvested?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:12,height:12,borderRadius:3,background:'rgba(0,179,134,0.7)' }}/>
                  <span style={{ fontSize:12,color:'var(--text-2)' }}>Returns: ₹{calcResult.gains?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fund Listing */}
      <div className={styles.fundSection}>
        <div className={styles.fundHeader}>
          <h2 className={styles.fundTitle}>Top Mutual Funds</h2>
          <select value={sort} onChange={e => setSort(e.target.value)} className={styles.sortSelect}>
            <option value="returns1y">1Y Returns ↓</option>
            <option value="returns3y">3Y Returns ↓</option>
            <option value="returns5y">5Y Returns ↓</option>
            <option value="aum">AUM ↓</option>
          </select>
        </div>

        {/* Category chips */}
        <div className={styles.catRow}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`${styles.catChip} ${cat === c ? styles.catActive : ''}`}
              onClick={() => setCat(c)}
            >{c}</button>
          ))}
        </div>

        {loading ? (
          <div className={styles.fundList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.fundCard}>
                <div className="skel" style={{ height:16, width:'50%', marginBottom:8 }} />
                <div className="skel" style={{ height:12, width:'30%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.fundList}>
            {funds.map(f => (
              <div key={f._id || f.name} className={styles.fundCard}>
                <div className={styles.fundLeft}>
                  <div className={styles.fundIcon}>{f.amc?.slice(0,2).toUpperCase()}</div>
                  <div>
                    <div className={styles.fundName}>{f.name}</div>
                    <div className={styles.fundMeta}>
                      <span className={styles.catTag}>{f.category}</span>
                      <span style={{ color:'var(--text-3)', fontSize:11 }}>AUM ₹{f.aum?.toLocaleString('en-IN')}Cr</span>
                      <span className={`${styles.riskTag} ${styles['risk_' + (f.riskLevel || '').replace(' ','_')]}`}>{f.riskLevel}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.fundReturns}>
                  <ReturnCell label="1Y" val={f.returns1y} />
                  <ReturnCell label="3Y" val={f.returns3y} />
                  <ReturnCell label="5Y" val={f.returns5y} />
                </div>
                <div className={styles.fundNav}>
                  <div className={styles.navVal}>₹{f.nav?.toFixed(2)}</div>
                  <div className={styles.navLabel}>NAV</div>
                </div>
                <div className={styles.fundRating}>
                  {'★'.repeat(f.rating || 3)}
                </div>
                <div className={styles.fundActions}>
                  <button className={styles.sipBtn}>Start SIP</button>
                  <button className={styles.lsBtn}>Lumpsum</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReturnCell({ label, val }) {
  const isPos = val >= 0;
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:10, color:'var(--text-3)', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:700, color: isPos ? 'var(--up)' : 'var(--dn)', fontFamily:'var(--mono)' }}>
        {isPos ? '+' : ''}{val?.toFixed(1)}%
      </div>
    </div>
  );
}
