// Format currency in Indian Rupees
export const formatCurrency = (amount, compact = false) => {
  if (amount === undefined || amount === null) return '₹0';
  if (compact) {
    if (Math.abs(amount) >= 1e7) return `₹${(amount / 1e7).toFixed(2)}Cr`;
    if (Math.abs(amount) >= 1e5) return `₹${(amount / 1e5).toFixed(2)}L`;
    if (Math.abs(amount) >= 1e3) return `₹${(amount / 1e3).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format large numbers
export const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e7) return `${(num / 1e7).toFixed(2)}Cr`;
  if (num >= 1e5) return `${(num / 1e5).toFixed(2)}L`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

// Format percentage
export const formatPercent = (val) => {
  if (val === undefined || val === null) return '0.00%';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${Number(val).toFixed(2)}%`;
};

// Format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

// Short date
export const formatShortDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date));
};

// Is gain?
export const isGain = (val) => Number(val) >= 0;

// Get initials for avatar
export const getInitials = (name = '') => {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
};

// Debounce
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
