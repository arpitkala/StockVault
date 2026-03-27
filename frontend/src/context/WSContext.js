import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WSContext = createContext(null);

// ── Alert checker helper ──────────────────────────────────────────────────
function checkAndTriggerAlerts(newPrices) {
  try {
    const alerts  = JSON.parse(localStorage.getItem('sv_price_alerts') || '[]');
    const active  = alerts.filter(a => a.active);
    const updated = [...alerts];
    let   changed = false;

    active.forEach(a => {
      const live = newPrices[a.symbol]?.currentPrice;
      if (!live) return;

      const triggered =
        (a.condition === 'above' && live >= a.targetPrice) ||
        (a.condition === 'below' && live <= a.targetPrice);

      if (triggered) {
        // Show toast
        toast(`🎯 ${a.symbol} hit ₹${a.targetPrice?.toLocaleString('en-IN')}!`, {
          duration: 6000,
          style: {
            background: 'var(--surface-0)',
            color: 'var(--text-1)',
            border: '1px solid var(--brand)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        });

        // Add to notifications
        const notifs = JSON.parse(localStorage.getItem('sv_notifs') || '[]');
        notifs.unshift({
          id:    `alert_triggered_${a.id}_${Date.now()}`,
          type:  'success',
          icon:  '🎯',
          title: `Price Alert Triggered — ${a.symbol}`,
          desc:  `${a.symbol} has gone ${a.condition} ₹${a.targetPrice?.toLocaleString('en-IN')}. Current: ₹${live?.toLocaleString('en-IN', { maximumFractionDigits:2 })}`,
          time:  new Date().toISOString(),
          read:  false,
        });
        localStorage.setItem('sv_notifs', JSON.stringify(notifs.slice(0, 50)));

        // Mark alert as inactive
        const idx = updated.findIndex(u => u.id === a.id);
        if (idx >= 0) { updated[idx] = { ...updated[idx], active: false }; changed = true; }
      }
    });

    if (changed) localStorage.setItem('sv_price_alerts', JSON.stringify(updated));
  } catch (e) {
    console.error('Alert check error:', e);
  }
}

export const WSProvider = ({ children }) => {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const [prices,    setPrices]    = useState({});
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws:////stockvault-glve.onrender.com';

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnected(true);
        console.log('📡 WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PRICE_UPDATE' && Array.isArray(msg.data)) {
            setPrices((prev) => {
              const next = { ...prev };
              msg.data.forEach(({ symbol, currentPrice, change, changePercent }) => {
                next[symbol] = { currentPrice, change, changePercent };
              });
              // ── Check price alerts on every update ──
              checkAndTriggerAlerts(next);
              return next;
            });
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };

      wsRef.current.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (err) => {
        console.error('WS error', err);
        wsRef.current?.close();
      };
    } catch (err) {
      console.error('WS connection failed', err);
    }
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const getLivePrice = (symbol) => prices[symbol];

  return (
    <WSContext.Provider value={{ prices, connected, getLivePrice }}>
      {children}
    </WSContext.Provider>
  );
};

export const useWS = () => useContext(WSContext);