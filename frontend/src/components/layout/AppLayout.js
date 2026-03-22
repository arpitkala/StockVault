import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWS } from '../../context/WSContext';
import { formatCurrency, getInitials } from '../../utils/helpers';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: HomeIcon,      label: 'Home' },
  { to: '/stocks',    icon: StocksIcon,    label: 'Stocks' },
  { to: '/fno',       icon: FnOIcon,       label: 'F&O' },
  { to: '/market',    icon: MarketIcon,    label: 'Markets' },
  { to: '/portfolio', icon: PortfolioIcon, label: 'Portfolio' },
  { to: '/orders',    icon: OrdersIcon,    label: 'Orders' },
  { to: '/watchlist', icon: WatchlistIcon, label: 'Watchlist' },
  { to: '/ipo',       icon: IPOIcon,       label: 'IPO' },
  { to: '/sip',       icon: SIPIcon,       label: 'Mutual Funds' },
];

// ── Notification Bell ─────────────────────────────────────────────────────
function NotificationBell() {
  const { user } = useAuth();
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const auto = [];
    if (user?.createdAt) {
      auto.push({
        id:'welcome', type:'info', icon:'👋',
        title:`Welcome, ${user.name?.split(' ')[0]}!`,
        desc:'Your virtual trading account is ready. Start with ₹1,00,000.',
        time: user.createdAt, read:false,
      });
    }
    if (user?.balance < 5000) {
      auto.push({
        id:'low_bal', type:'warn', icon:'⚠️',
        title:'Low Balance Alert',
        desc:`Your balance is ${formatCurrency(user.balance)}. Add funds to continue trading.`,
        time: new Date().toISOString(), read:false,
      });
    }
    if (user?.referralCount > 0) {
      auto.push({
        id:'referral', type:'success', icon:'🎁',
        title:'Referral Bonus Credited!',
        desc:`₹599 added for your referral. Total earned: ₹${user.referralEarnings?.toLocaleString('en-IN') || 599}.`,
        time: new Date().toISOString(), read:false,
      });
    }
    const stored  = JSON.parse(localStorage.getItem('sv_notifs') || '[]');
    const readIds = JSON.parse(localStorage.getItem('sv_notifs_read') || '[]');
    const all = [...auto, ...stored]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 20)
      .map(n => ({ ...n, read: readIds.includes(n.id) }));
    setNotifs(all);
    setUnread(all.filter(n => !n.read).length);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    const ids = notifs.map(n => n.id);
    localStorage.setItem('sv_notifs_read', JSON.stringify(ids));
    setNotifs(prev => prev.map(n => ({ ...n, read:true })));
    setUnread(0);
  };

  const markOne = (id) => {
    const readIds = JSON.parse(localStorage.getItem('sv_notifs_read') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('sv_notifs_read', JSON.stringify(readIds));
    }
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read:true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const timeAgo = (t) => {
    const diff = Date.now() - new Date(t).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };

  const typeColor = (type) => ({
    success: { bg:'var(--up-bg)',     color:'var(--up)'    },
    warn:    { bg:'var(--warn-bg)',   color:'#f39c12'       },
    info:    { bg:'var(--surface-2)', color:'var(--brand)'  },
    error:   { bg:'var(--dn-bg)',     color:'var(--dn)'    },
  }[type] || { bg:'var(--surface-2)', color:'var(--text-2)' });

  return (
    <div ref={ref} style={{ position:'relative' }}>
   <button onClick={() => setOpen(o => !o)} style={{
        width:36, height:36, borderRadius:'50%',
        background: open ? 'var(--surface-2)' : 'transparent',
        border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', transition:'all .15s',
        color:'var(--text-2)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = open ? 'var(--surface-2)' : 'transparent'}
      >
        <BellIcon />
        {unread > 0 && (
          <span style={{
            position:'absolute', top:4, right:4,
            width:16, height:16, borderRadius:'50%',
            background:'var(--dn)', color:'#fff',
            fontSize:9, fontWeight:800,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid var(--bg)', fontFamily:'var(--font)',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 10px)', right:0,
          width:340, maxHeight:480,
          background:'var(--surface-0)', border:'1px solid var(--line)',
          borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)',
          overflow:'hidden', zIndex:200,
          animation:'slideDown .15s ease',
        }}>
          <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid var(--line)' }}>
            <div style={{ fontSize:14, fontWeight:700 }}>
              Notifications
              {unread > 0 && (
                <span style={{ marginLeft:8, fontSize:11, padding:'2px 8px', borderRadius:99, background:'var(--dn)', color:'#fff', fontWeight:700 }}>
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize:11, fontWeight:600, color:'var(--brand)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)' }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY:'auto', maxHeight:380 }}>
            {notifs.length === 0 ? (
              <div style={{ padding:'32px 16px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🔔</div>
                No notifications yet
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                onClick={() => markOne(n.id)}
                style={{
                  display:'flex', gap:12, padding:'12px 16px',
                  borderBottom:'1px solid var(--line)',
                  background: n.read ? 'transparent' : 'var(--surface-1)',
                  cursor:'pointer', transition:'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--surface-1)'}
              >
                <div style={{
                  width:36, height:36, borderRadius:10, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:16, ...typeColor(n.type),
                }}>{n.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight: n.read ? 500 : 700, marginBottom:3, color:'var(--text-1)' }}>{n.title}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', lineHeight:1.4, marginBottom:4 }}>{n.desc}</div>
                  <div style={{ fontSize:10, color:'var(--text-4)' }}>{timeAgo(n.time)}</div>
                </div>
                {!n.read && (
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--brand)', flexShrink:0, marginTop:4 }}/>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Export helper to add order notifications ──────────────────────────────
export function addOrderNotification(order) {
  const stored = JSON.parse(localStorage.getItem('sv_notifs') || '[]');
  const isBuy  = order.type === 'BUY';
  const notif  = {
    id:    `order_${order._id || Date.now()}`,
    type:  isBuy ? 'info' : 'success',
    icon:  isBuy ? '📈' : '📉',
    title: `Order ${isBuy ? 'Bought' : 'Sold'} — ${order.symbol}`,
    desc:  `${isBuy ? 'Bought' : 'Sold'} ${order.quantity} shares @ ₹${order.price?.toFixed(2)} · Total: ₹${order.totalAmount?.toLocaleString('en-IN')}`,
    time:  new Date().toISOString(),
    read:  false,
  };
  stored.unshift(notif);
  localStorage.setItem('sv_notifs', JSON.stringify(stored.slice(0, 50)));
}

// ── Main Layout ───────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { connected } = useWS();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    document.getElementById('main-content')?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="var(--brand)"/>
              <path d="M5 14l4-5 3 3.5 2.5-4L18 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={styles.logoText}>StockVault</span>
        </div>

        <div className={styles.balCard}>
          <div className={styles.balAvatar}>{getInitials(user?.name)}</div>
          <div className={styles.balInfo}>
            <span className={styles.balName}>{user?.name?.split(' ')[0]}</span>
            <span className={styles.balAmt}>{formatCurrency(user?.balance)}</span>
          </div>
          <div className={`${styles.liveChip} ${connected ? styles.liveOn : styles.liveOff}`}>
            <span className={connected ? 'live-dot' : ''} style={!connected ? { display:'inline-block',width:6,height:6,borderRadius:'50%',background:'var(--dn)',marginRight:3 } : {}} />
            {connected ? 'Live' : 'Off'}
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
              <span className={styles.navIcon}><Icon /></span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <NavLink to="/profile" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}>
            <span className={styles.navIcon}><ProfileIcon /></span>
            <span className={styles.navLabel}>Profile</span>
          </NavLink>
          <button className={styles.navItem} onClick={toggleTheme}>
            <span className={styles.navIcon}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
            <span className={styles.navLabel}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className={`${styles.navItem} ${styles.logoutItem}`} onClick={() => { logout(); navigate('/login'); }}>
            <span className={styles.navIcon}><LogoutIcon /></span>
            <span className={styles.navLabel}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.hamburger} onClick={() => setMobileOpen(true)}>
            <span/><span/><span/>
          </button>

          <div className={styles.indexTicker}>
            <IndexTick symbol="NIFTY50" label="NIFTY" />
            <IndexTick symbol="SENSEX"  label="SENSEX" />
          </div>

          <div className={styles.topRight}>
            {/* 🔔 Notification Bell */}
            <NotificationBell />

            <button className={styles.iconBtn} onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon size={18}/> : <MoonIcon size={18}/>}
            </button>
            <NavLink to="/profile">
              <div className={styles.avatarBtn}>{getInitials(user?.name)}</div>
            </NavLink>
          </div>
        </header>

        <main className={styles.content} id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Index ticker
function IndexTick({ symbol, label }) {
  const [indexData, setIndexData] = React.useState(null);
  React.useEffect(() => {
    import('../../services/stockService').then(({ marketService }) => {
      marketService.getIndices().then(({ data }) => {
        const idx = data.indices?.find(i => i.symbol === symbol);
        if (idx) setIndexData(idx);
      }).catch(() => {});
    });
  }, [symbol]);
  if (!indexData) return null;
  const isUp = indexData.changePercent >= 0;
  return (
    <div className={styles.indexTick}>
      <span className={styles.indexName}>{label}</span>
      <span className={`${styles.indexVal} num`}>{indexData.currentValue?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      <span className={`${styles.indexChg} ${isUp ? 'up' : 'dn'}`}>
        {isUp ? '▲' : '▼'} {Math.abs(indexData.changePercent || 0).toFixed(2)}%
      </span>
    </div>
  );
}

function HomeIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function StocksIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; }
function MarketIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h.01M12 8h.01M17 8h.01M7 12h10"/></svg>; }
function PortfolioIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>; }
function OrdersIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>; }
function WatchlistIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IPOIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>; }
function SIPIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; }
function ProfileIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function LogoutIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function MoonIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function SunIcon({ size = 16 })  { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>; }
function FnOIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2l20 20M7 7c0 5.523 4.477 10 10 10"/><path d="M3.34 14A10 10 0 0012 22"/><path d="M12 2a10 10 0 018.66 5"/></svg>; }
function BellIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }