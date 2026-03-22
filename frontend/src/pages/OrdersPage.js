import React, { useEffect, useState } from 'react';
import { orderService } from '../services/stockService';
import { formatCurrency } from '../utils/helpers';
import styles from './Orders.module.css';

const FILTERS = ['All','BUY','SELL'];

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [filter,  setFilter]  = useState('All');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const PER_PAGE = 15;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await orderService.getHistory({
          type:  filter !== 'All' ? filter : undefined,
          page,
          limit: PER_PAGE,
        });
        setOrders(data.orders || []);
        setTotal(data.total  || 0);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [filter, page]);

  const totalBuys   = orders.filter(o => o.type === 'BUY').length;
  const totalSells  = orders.filter(o => o.type === 'SELL').length;
  const totalPages  = Math.ceil(total / PER_PAGE);

  return (
    <div className="fade-up">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Order History</h1>
          <p className={styles.sub}>{total} total orders · {totalBuys} buys · {totalSells} sells</p>
        </div>
      </div>

      {/* Filter + type pills */}
      <div className={styles.filtersRow}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {f === 'BUY' ? '🟢 ' : f === 'SELL' ? '🔴 ' : ''}{f}
          </button>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
          <span>Stock</span>
          <span>Type</span>
          <span>Order</span>
          <span>Qty</span>
          <span>Exec Price</span>
          <span>Total</span>
          <span>Bal After</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.orderRow}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div className="skel" style={{ width:34, height:34, borderRadius:9 }}/>
                  <div><div className="skel" style={{ height:11, width:70, marginBottom:4 }}/><div className="skel" style={{ height:9, width:100 }}/></div>
                </div>
                {Array.from({length:7}).map((_,j) => <div key={j} className="skel" style={{ height:11, width:60, borderRadius:4 }}/>)}
              </div>
            ))
          : orders.length === 0
            ? <div className={styles.empty}><span>📋</span><p>No orders found</p></div>
            : orders.map(o => {
                const isBuy = o.type === 'BUY';
                const pnl   = isBuy ? -(o.executedPrice * o.quantity) : (o.executedPrice * o.quantity);
                return (
                  <div key={o._id} className={styles.orderRow}>
                    <div className={styles.stockCell}>
                      <div className={styles.stockIcon}>{o.symbol?.slice(0,3)}</div>
                      <div>
                        <div className={styles.stockSym}>{o.symbol}</div>
                        <div className={styles.stockSect}>{o.sector || 'NSE'}</div>
                      </div>
                    </div>
                    <div>
                      <span className={`${styles.typeBadge} ${isBuy ? 'up-bg' : 'dn-bg'}`}>{o.type}</span>
                    </div>
                    <div className={styles.cell}>{o.orderType}</div>
                    <div className={`${styles.cell} num`}>{o.quantity}</div>
                    <div className={`${styles.cell} num`}>{formatCurrency(o.executedPrice)}</div>
                    <div className={`${styles.cell} num ${isBuy ? 'dn' : 'up'}`} style={{ fontWeight:700 }}>
                      {isBuy ? '−' : '+'}{formatCurrency(Math.abs(pnl))}
                    </div>
                    <div className={`${styles.cell} num`} style={{ fontSize:11, color:'var(--text-3)' }}>
                      {formatCurrency(o.balanceAfter)}
                    </div>
                    <div>
                      <span className={`${styles.statusBadge} up-bg`}>EXECUTED</span>
                    </div>
                    <div className={styles.dateCell}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })}
                      <div style={{ fontSize:10, color:'var(--text-4)' }}>
                        {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pgBtn} disabled={page <= 1} onClick={() => setPage(p => p-1)}>← Prev</button>
          <span className={styles.pgInfo}>Page {page} of {totalPages}</span>
          <button className={styles.pgBtn} disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
