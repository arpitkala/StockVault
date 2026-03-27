import React, { useState, useEffect } from 'react';
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

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { connected } = useWS();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar + scroll to top on every route change
  useEffect(() => {
    setMobileOpen(false);
    document.getElementById('main-content')?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="var(--brand)"/>
              <path d="M5 14l4-5 3 3.5 2.5-4L18 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={styles.logoText}>StockVault</span>
        </div>

        {/* User balance card */}
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

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
            >
              <span className={styles.navIcon}><Icon /></span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
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
        {/* Topbar */}
        <header className={styles.topbar}>
          <button className={styles.hamburger} onClick={() => setMobileOpen(true)}>
            <span/><span/><span/>
          </button>

          {/* Nifty/Sensex ticker */}
          <div className={styles.indexTicker}>
            <IndexTick symbol="NIFTY50" label="NIFTY" />
            <IndexTick symbol="SENSEX"  label="SENSEX" />
          </div>

          <div className={styles.topRight}>
            <button className={styles.iconBtn} onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon size={18}/> : <MoonIcon size={18}/>}
            </button>
            <NavLink to="/profile">
              <div className={styles.avatarBtn}>{getInitials(user?.name)}</div>
            </NavLink>
          </div>
        </header>

        {/* Page content — id used for scroll reset */}
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
function FnOIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2l20 20M7 7c0 5.523 4.477 10 10 10"/><path d="M3.34 14A10 10 0 0012 22"/><path d="M12 2a10 10 0 018.66 5"/></svg>; }