import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WSProvider } from './context/WSContext';

import AppLayout       from './components/layout/AppLayout';
import LoadingScreen   from './components/ui/LoadingScreen';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import StocksPage      from './pages/StocksPage';
import StockDetailPage from './pages/StockDetailPage';
import MarketPage      from './pages/MarketPage';
import PortfolioPage   from './pages/PortfolioPage';
import WatchlistPage   from './pages/WatchlistPage';
import OrdersPage      from './pages/OrdersPage';
import IPOPage         from './pages/IPOPage';
import SIPPage         from './pages/SIPPage';
import ProfilePage     from './pages/ProfilePage';
import ReferralPage    from './pages/ReferralPage';
import FnOPage         from './pages/FnOPage';


const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
};

const Public = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login"    element={<Public><LoginPage /></Public>} />
    <Route path="/register" element={<Public><RegisterPage /></Public>} />
    <Route path="/" element={<Protected><AppLayout /></Protected>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard"       element={<DashboardPage />} />
      <Route path="stocks"          element={<StocksPage />} />
      <Route path="stocks/:symbol"  element={<StockDetailPage />} />
      <Route path="market"          element={<MarketPage />} />
      <Route path="portfolio"       element={<PortfolioPage />} />
      <Route path="watchlist"       element={<WatchlistPage />} />
      <Route path="orders"          element={<OrdersPage />} />
      <Route path="ipo"             element={<IPOPage />} />
      <Route path="sip"             element={<SIPPage />} />
      <Route path="profile"         element={<ProfilePage />} />
      <Route path="referral"        element={<ReferralPage />} />
      <Route path="fno"             element={<FnOPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WSProvider>
          <Router>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--surface-0)',
                  color: 'var(--text-1)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: 'var(--shadow-md)',
                },
                success: { iconTheme: { primary: '#00b386', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#e74c3c', secondary: '#fff' } },
              }}
            />
          </Router>
        </WSProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}