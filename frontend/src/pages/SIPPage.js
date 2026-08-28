import React, { useEffect, useState, useCallback } from 'react';
import { sipService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './SIP.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CATEGORIES = ['All','Large Cap','Mid Cap','Small Cap','Flexi Cap','Index Fund','Hybrid','Sectoral'];
const RISK_COLOR = { 'Low':'Low', 'Moderate':'Moderate', 'High':'High', 'Very High':'Very_High' };

export default function SIPPage() {
  const { user, updateBalance } = useAuth();
  const [tab, setTab] = useState('EXPLORE'); // 'EXPLORE' or 'MY_INVESTMENTS'

  // Fund listing states
  const [funds, setFunds] = useState([]);
  const [cat, setCat]     = useState('All');
  const [sort, setSort]   = useState('returns1y');
  const [loading, setLoading] = useState(true);

  // My Investments states
  const [myInvestments, setMyInvestments] = useState([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);

  // Investment Modal states
  const [selectedFund, setSelectedFund] = useState(null);
  const [investType, setInvestType] = useState('SIP'); // 'SIP' or 'LUMPSUM'
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);

  // SIP Calculator state
  const [monthly, setMonthly]   = useState(5000);
  const [years, setYears]       = useState(10);
  const [rate, setRate]         = useState(12);
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalc]  = useState(false);

  // Fetch explore funds
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

  // Fetch investments list
  const fetchInvestments = useCallback(async () => {
    setLoadingInvestments(true);
    try {
      const { data } = await sipService.getInvestments();
      setMyInvestments(data.investments || []);
    } catch {
      toast.error('Failed to load investments');
    } finally {
      setLoadingInvestments(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // Handle placing a new mutual fund investment
  const handleInvest = async () => {
    const amt = Number(investAmount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (investType === 'SIP' && selectedFund.minSip && amt < selectedFund.minSip) {
      toast.error(`Minimum SIP amount is ₹${selectedFund.minSip}`);
      return;
    }
    if (user.balance < amt) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setInvesting(true);
    try {
      const { data } = await sipService.invest({
        fundId: selectedFund._id,
        type: investType,
        amount: amt,
      });
      toast.success(data.message || 'Investment placed successfully! 🎉');
      updateBalance(data.newBalance);
      setSelectedFund(null);
      fetchInvestments();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  // Handle Cancel SIP or Redeem mutual fund units
  const handleAction = async (investmentId, action) => {
    const actionLabel = action === 'CANCEL' ? 'Stopping SIP...' : 'Redeeming funds...';
    const toastId = toast.loading(actionLabel);
    try {
      const { data } = await sipService.cancelOrRedeem(investmentId, action);
      toast.success(data.message || 'Action completed successfully! 🎉', { id: toastId });
      if (data.newBalance !== undefined) {
        updateBalance(data.newBalance);
      }
      fetchInvestments();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Action failed', { id: toastId });
    }
  };

  // Open invest modal helper
  const openInvestModal = (fund, type) => {
    setSelectedFund(fund);
    setInvestType(type);
    setInvestAmount(type === 'SIP' ? fund.minSip || 500 : 5000);
  };

  const calculate = useCallback(async () => {
    setCalc(true);
    try {
      const { data } = await sipService.calculate({ monthly, years, expectedReturn: rate });
      setCalcResult(data.result);
    } catch {
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

  // Calculate overall portfolio metrics
  const activeHoldings = myInvestments.filter(inv => inv.status !== 'REDEEMED');
  const totalInvestedVal = activeHoldings.reduce((sum, inv) => sum + inv.totalInvested, 0);
  const totalCurrentVal = activeHoldings.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGainsVal = totalCurrentVal - totalInvestedVal;
  const totalGainsPercent = totalInvestedVal > 0 ? (totalGainsVal / totalInvestedVal) * 100 : 0;

  return (
    <div className="fade-up">
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Mutual Funds</h1>
        <p className={styles.sub}>SIP, Lumpsum &amp; more — Start investing in mutual funds</p>
      </div>

      {/* Tabs Menu */}
      <div className={styles.tabRow}>
        <button className={`${styles.tab} ${tab === 'EXPLORE' ? styles.tabActive : ''}`} onClick={() => setTab('EXPLORE')}>
          🧭 Explore Funds
        </button>
        <button className={`${styles.tab} ${tab === 'MY_INVESTMENTS' ? styles.tabActive : ''}`} onClick={() => setTab('MY_INVESTMENTS')}>
          💼 My Investments ({activeHoldings.length})
        </button>
      </div>

      {tab === 'EXPLORE' && (
        <>
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
                          <span className={`${styles.riskTag} ${styles['risk_' + RISK_COLOR[f.riskLevel || 'Moderate']]}`}>{f.riskLevel}</span>
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
                      <button className={styles.sipBtn} onClick={() => openInvestModal(f, 'SIP')}>Start SIP</button>
                      <button className={styles.lsBtn} onClick={() => openInvestModal(f, 'LUMPSUM')}>Lumpsum</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'MY_INVESTMENTS' && (
        <div className="fade-up">
          {/* Summary Dashboard */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Invested</span>
              <strong className={styles.summaryVal}>₹{totalInvestedVal.toLocaleString('en-IN')}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Current Value</span>
              <strong className={styles.summaryVal}>₹{totalCurrentVal.toLocaleString('en-IN')}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Profit / Loss</span>
              <strong className={`${styles.summaryVal} ${totalGainsVal >= 0 ? 'up' : 'dn'}`}>
                {totalGainsVal >= 0 ? '+' : ''}₹{totalGainsVal.toLocaleString('en-IN')} ({totalGainsPercent.toFixed(2)}%)
              </strong>
            </div>
          </div>

          {/* Holdings Section */}
          <div className={styles.fundSection}>
            <div className={styles.holdingsHeader}>
              <h2 className={styles.holdingsTitle}>Your Active Mutual Fund Holdings</h2>
            </div>

            {loadingInvestments ? (
              <div className={styles.fundList}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.fundCard}>
                    <div className="skel" style={{ height:16, width:'40%', marginBottom:8 }} />
                    <div className="skel" style={{ height:12, width:'20%' }} />
                  </div>
                ))}
              </div>
            ) : myInvestments.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-3)' }}>
                <span style={{ fontSize:32 }}>📁</span>
                <p style={{ marginTop:12, fontSize:14 }}>No investments found. Go to Explore tab to start investing!</p>
              </div>
            ) : (
              <div className={styles.fundList}>
                {myInvestments.map(inv => {
                  const isUp = inv.returns >= 0;
                  return (
                    <div key={inv._id} className={styles.holdingCard}>
                      <div className={styles.holdingLeft}>
                        <div className={styles.fundIcon}>{inv.fundName?.slice(0,2).toUpperCase()}</div>
                        <div>
                          <div className={styles.holdingName}>{inv.fundName}</div>
                          <div className={styles.holdingMeta}>
                            <span className={styles.catTag}>{inv.type}</span>
                            <span>Units: {inv.units?.toFixed(4)}</span>
                            <span>Invested: ₹{inv.totalInvested?.toLocaleString('en-IN')}</span>
                            {inv.status === 'CANCELLED' && (
                              <span style={{ color:'var(--warn)', fontWeight:700 }}>SIP CANCELLED</span>
                            )}
                            {inv.status === 'REDEEMED' && (
                              <span style={{ color:'var(--text-4)', fontWeight:700 }}>REDEEMED</span>
                            )}
                            {inv.nextInstallmentDate && (
                              <span>Next Installment: {new Date(inv.nextInstallmentDate).toLocaleDateString('en-IN')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {inv.status !== 'REDEEMED' && (
                        <div className={styles.holdingValue}>
                          <div className={styles.holdVal}>₹{inv.currentValue?.toLocaleString('en-IN')}</div>
                          <div className={`${styles.holdRet} ${isUp ? 'up' : 'dn'}`}>
                            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}₹{Math.abs(inv.returns || 0).toFixed(0)} ({inv.returnsPercent?.toFixed(2)}%)
                          </div>
                        </div>
                      )}

                      <div className={styles.holdingActions}>
                        {inv.status === 'ACTIVE' && inv.type === 'SIP' && (
                          <button className={styles.stopSipBtn} onClick={() => handleAction(inv._id, 'CANCEL')}>
                            Stop SIP
                          </button>
                        )}
                        {inv.status !== 'REDEEMED' && inv.units > 0 && (
                          <button className={styles.redeemBtn} onClick={() => handleAction(inv._id, 'REDEEM')}>
                            Redeem Units
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invest Modal Overlay */}
      {selectedFund && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFund(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h2 className={styles.modalTitle}>
                Invest in {selectedFund.name}
              </h2>
              <button className={styles.modalClose} onClick={() => setSelectedFund(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.mField}>
                <label className={styles.mLabel}>Investment Type</label>
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    className={`${styles.lsBtn} ${investType === 'SIP' ? styles.catActive : ''}`}
                    onClick={() => { setInvestType('SIP'); setInvestAmount(selectedFund.minSip || 500); }}
                    style={{ flex:1 }}
                  >
                    Monthly SIP
                  </button>
                  <button
                    className={`${styles.lsBtn} ${investType === 'LUMPSUM' ? styles.catActive : ''}`}
                    onClick={() => { setInvestType('LUMPSUM'); setInvestAmount(5000); }}
                    style={{ flex:1 }}
                  >
                    Lumpsum
                  </button>
                </div>
              </div>

              <div className={styles.mField}>
                <label className={styles.mLabel}>Amount (INR)</label>
                <div className={styles.mInputWrap}>
                  <span className={styles.mInputPrefix}>₹</span>
                  <input
                    type="number"
                    className={styles.mInput}
                    value={investAmount}
                    onChange={e => setInvestAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={investType === 'SIP' ? selectedFund.minSip || 500 : 100}
                  />
                </div>
                <div className={styles.balRow}>
                  <span className={styles.balLabel}>Available cash:</span>
                  <strong className={styles.balVal}>₹{user?.balance?.toLocaleString('en-IN')}</strong>
                </div>
                {investType === 'SIP' && selectedFund.minSip && (
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                    * Minimum SIP amount: ₹{selectedFund.minSip.toLocaleString('en-IN')}
                  </div>
                )}
              </div>

              <div className={styles.mField}>
                <span className={styles.mLabel}>Expected NAV</span>
                <span style={{ fontSize:15, fontWeight:800, fontFamily:'var(--mono)' }}>
                  ₹{selectedFund.nav?.toFixed(2)}
                </span>
              </div>

              <button
                className={styles.mBtn}
                onClick={handleInvest}
                disabled={investing || !investAmount || Number(investAmount) <= 0}
              >
                {investing ? 'Processing...' : `Invest ₹${Number(investAmount).toLocaleString('en-IN')} via ${investType}`}
              </button>
            </div>
          </div>
        </div>
      )}
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
