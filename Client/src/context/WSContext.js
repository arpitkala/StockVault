import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WSContext = createContext(null);

export const WSProvider = ({ children }) => {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const [prices, setPrices] = useState({});
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

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
              return next;
            });
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };

      wsRef.current.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 3s
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

  // Get live price for a symbol (falls back to undefined)
  const getLivePrice = (symbol) => prices[symbol];

  return (
    <WSContext.Provider value={{ prices, connected, getLivePrice }}>
      {children}
    </WSContext.Provider>
  );
};

export const useWS = () => useContext(WSContext);
