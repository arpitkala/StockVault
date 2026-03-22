import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sv_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sv_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login:            (email, password)                        => api.post('/auth/login',    { email, password }),
  register:         (name, email, password, referralCode)    => api.post('/auth/register', { name, email, password, referralCode }),
  getMe:            ()                                       => api.get('/auth/me'),
  updateProfile:    (data)                                   => api.put('/auth/profile', data),
  completeKYC:      ()                                       => api.post('/auth/kyc/complete'),
  getReferralStats: ()                                       => api.get('/auth/referral'),
};

// ─── Stocks ───────────────────────────────────────────────────────────────────
export const stockService = {
  getAll:      (params)  => api.get('/stocks',          { params }),
  getBySymbol: (symbol)  => api.get(`/stocks/${symbol}`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderService = {
  place:      (data)   => api.post('/orders', data),
  getHistory: (params) => api.get('/orders',  { params }),
};

// ─── Portfolio ────────────────────────────────────────────────────────────────
export const portfolioService = {
  get: () => api.get('/portfolio'),
};

// ─── Watchlist ────────────────────────────────────────────────────────────────
export const watchlistService = {
  get:    ()       => api.get('/watchlist'),
  add:    (symbol) => api.post(`/watchlist/${symbol}`),
  remove: (symbol) => api.delete(`/watchlist/${symbol}`),
};

// ─── Market ───────────────────────────────────────────────────────────────────
export const marketService = {
  getIndices:    ()            => api.get('/market/indices'),
  getIndexChart: (sym, params) => api.get(`/market/indices/${sym}/chart`, { params }),
  getMovers:     ()            => api.get('/market/movers'),
};

// ─── IPO ──────────────────────────────────────────────────────────────────────
export const ipoService = {
  getAll:      (params) => api.get('/ipo',            { params }),
  getBySymbol: (symbol) => api.get(`/ipo/${symbol}`),
  applyIPO:    (id)     => api.post(`/ipo/apply/${id}`),
};

// ─── SIP / Mutual Funds ───────────────────────────────────────────────────────
export const sipService = {
  getFunds:    (params) => api.get('/sip/funds',       { params }),
  getFundById: (id)     => api.get(`/sip/funds/${id}`),
  calculate:   (params) => api.get('/sip/calculate',   { params }),
};

// ─── F&O ──────────────────────────────────────────────────────────────────────
export const fnoService = {
  getChain:   (symbol, expiry) => api.get('/orders/fno/chain', { params: { symbol, expiry } }),
  placeOrder: (data)           => api.post('/orders/fno', data),
};