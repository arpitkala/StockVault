import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-secondary)', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: 'var(--accent)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: -1,
      }}>SV</div>
      <div style={{
        width: 32, height: 32,
        border: '3px solid var(--border)',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
