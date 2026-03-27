import React from 'react';

// Card wrapper
export const Card = ({ children, className = '', style = {} }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    ...style,
  }} className={className}>
    {children}
  </div>
);

// Badge
export const Badge = ({ children, color = 'default', size = 'sm' }) => {
  const colors = {
    gain: { bg: 'var(--gain-light)', color: 'var(--gain)' },
    loss: { bg: 'var(--loss-light)', color: 'var(--loss)' },
    info: { bg: 'var(--info-light)', color: 'var(--info)' },
    warning: { bg: 'var(--warning-light)', color: 'var(--warning)' },
    default: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius: 99, fontSize: size === 'sm' ? 12 : 13,
      fontWeight: 600, display: 'inline-flex', alignItems: 'center',
    }}>
      {children}
    </span>
  );
};

// Spinner
export const Spinner = ({ size = 24, color = 'var(--accent)' }) => (
  <div style={{
    width: size, height: size,
    border: `2px solid var(--border)`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Stat card (metric display)
export const StatCard = ({ label, value, subValue, subColor, icon, style = {} }) => (
  <Card style={{ ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', fontFamily: 'var(--font-mono)' }}>{value}</p>
        {subValue && (
          <p style={{ fontSize: 13, marginTop: 4, color: subColor || 'var(--text-secondary)' }}>{subValue}</p>
        )}
      </div>
      {icon && (
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}>
          {icon}
        </div>
      )}
    </div>
  </Card>
);

// Empty state
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 20px', gap: 12, textAlign: 'center',
  }}>
    <div style={{ fontSize: 40 }}>{icon}</div>
    <p style={{ fontWeight: 600, fontSize: 16 }}>{title}</p>
    {description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 300 }}>{description}</p>}
    {action}
  </div>
);

// Skeleton line
export const SkeletonLine = ({ width = '100%', height = 16, style = {} }) => (
  <div className="skeleton" style={{ width, height, borderRadius: 6, ...style }} />
);

// Page header
export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// Button
export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, loading = false, style = {} }) => {
  const variants = {
    primary: { background: 'var(--accent)', color: 'white', border: 'none' },
    secondary: { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger)', color: 'white', border: 'none' },
    outline: { background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' },
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: 13 },
    md: { padding: '10px 20px', fontSize: 14 },
    lg: { padding: '13px 28px', fontSize: 15 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant], ...sizes[size],
        borderRadius: 'var(--radius-sm)', fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'all 0.15s',
        fontFamily: 'var(--font)',
        ...style,
      }}
    >
      {loading && <Spinner size={16} color="currentColor" />}
      {children}
    </button>
  );
};
