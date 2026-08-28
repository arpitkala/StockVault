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
  search:      (q)       => api.get('/stocks/search',   { params: { q } }),
  getBySymbol: (symbol)  => api.get(`/stocks/${symbol}`),
  getMovers:   ()        => api.get('/stocks/market/movers'),
  getSectors:  ()        => api.get('/stocks/sectors/list'),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderService = {
  place:      (data)   => api.post('/orders', data),
  getHistory: (params) => api.get('/orders',  { params }),
  getById:    (id)     => api.get(`/orders/${id}`),
  cancel:     (id)     => api.put(`/orders/${id}/cancel`),
};

// ─── Portfolio ────────────────────────────────────────────────────────────────
export const portfolioService = {
  get:        ()       => api.get('/portfolio'),
  getSummary: ()       => api.get('/portfolio/summary'),
  getHolding: (symbol) => api.get(`/portfolio/${symbol}`),
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
  getStatus:     ()            => api.get('/market/status'),
  getSectors:    ()            => api.get('/market/sectors'),
};

// ─── IPO ──────────────────────────────────────────────────────────────────────
export const ipoService = {
  getAll:              (params) => api.get('/ipo',                   { params }),
  getStats:            ()       => api.get('/ipo/stats'),
  getMyApplications:   (params) => api.get('/ipo/my-applications',  { params }),
  getBySymbol:         (symbol) => api.get(`/ipo/${symbol}`),
  getSubscription:     (symbol) => api.get(`/ipo/${symbol}/subscription`),
  getTimeline:         (symbol) => api.get(`/ipo/${symbol}/timeline`),
  applyIPO:            (id, data) => api.post(`/ipo/apply/${id}`,   data),
  cancelApplication:   (appId)  => api.delete(`/ipo/cancel/${appId}`),
};

// ─── SIP / Mutual Funds ───────────────────────────────────────────────────────
export const sipService = {
  getFunds:       (params) => api.get('/sip/funds',       { params }),
  getFundById:    (id)     => api.get(`/sip/funds/${id}`),
  calculate:      (params) => api.get('/sip/calculate',   { params }),
  invest:         (data)   => api.post('/sip/invest',      data),
  getInvestments: ()       => api.get('/sip/investments'),
  cancelOrRedeem: (id, act)=> api.post(`/sip/investments/${id}/action`, { action: act }),
};

// ─── F&O ──────────────────────────────────────────────────────────────────────
export const fnoService = {
  getChain:     (symbol, expiry) => api.get('/fno/chain',     { params: { symbol, expiry } }),
  placeOrder:   (data)           => api.post('/fno/order',    data),
  getPositions: (params)         => api.get('/fno/positions', { params }),
  getExpiries:  ()               => api.get('/fno/expiries'),
  getLotSizes:  (symbol)         => api.get('/fno/lot-sizes', { params: { symbol } }),
};