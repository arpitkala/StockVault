const axios = require('axios');

// ── Yahoo Finance symbol mapping ──────────────────────────────────────────────
// NSE stocks use .NS suffix, BSE index uses ^BSESN, etc.
const YAHOO_SYMBOL_MAP = {
  // Indices
  'NIFTY50':   '^NSEI',
  'SENSEX':    '^BSESN',
  'BANKNIFTY': '^NSEBANK',
  'NIFTYMID':  'NIFTY_MIDCAP_100.NS',
};

/**
 * Convert an NSE symbol to Yahoo Finance format.
 * If symbol is in the map, use that; otherwise append .NS
 */
const toYahooSymbol = (symbol) => {
  if (YAHOO_SYMBOL_MAP[symbol]) return YAHOO_SYMBOL_MAP[symbol];
  return `${symbol}.NS`;
};

// ── In-memory cache ───────────────────────────────────────────────────────────
const priceCache = new Map();
const CACHE_TTL_MS = 12000; // 12 seconds

const getCached = (key) => {
  const entry = priceCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    priceCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data) => {
  priceCache.set(key, { data, ts: Date.now() });
};

// ── Rate limiter ──────────────────────────────────────────────────────────────
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 250; // 250ms between requests (max ~4/sec)

const waitForRateLimit = async () => {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();
};

// ── Fetch single quote from Yahoo Finance ─────────────────────────────────────
const fetchYahooQuote = async (nseSymbol) => {
  const cacheKey = `quote_${nseSymbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    await waitForRateLimit();

    const yahooSym = toYahooSymbol(nseSymbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}`;

    const response = await axios.get(url, {
      params: {
        interval: '1d',
        range: '1d',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 8000,
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quote = {
      symbol: nseSymbol,
      currentPrice: parseFloat((meta.regularMarketPrice || 0).toFixed(2)),
      previousClose: parseFloat((meta.chartPreviousClose || meta.previousClose || 0).toFixed(2)),
      open: parseFloat((meta.regularMarketOpen || 0).toFixed(2) || '0'),
      high: parseFloat((meta.regularMarketDayHigh || meta.regularMarketPrice || 0).toFixed(2)),
      low: parseFloat((meta.regularMarketDayLow || meta.regularMarketPrice || 0).toFixed(2)),
      volume: meta.regularMarketVolume || 0,
      change: 0,
      changePercent: 0,
      marketState: meta.marketState || 'CLOSED', // PRE, REGULAR, POST, CLOSED
      currency: meta.currency || 'INR',
      exchange: meta.exchangeName || 'NSI',
    };

    // Calculate change
    if (quote.previousClose > 0) {
      quote.change = parseFloat((quote.currentPrice - quote.previousClose).toFixed(2));
      quote.changePercent = parseFloat(((quote.change / quote.previousClose) * 100).toFixed(2));
    }

    setCache(cacheKey, quote);
    return quote;
  } catch (err) {
    // Don't log 404s for invalid symbols, just return null
    if (err.response?.status !== 404) {
      console.error(`[MarketPrice] Error fetching ${nseSymbol}:`, err.message);
    }
    return null;
  }
};

// ── Fetch batch quotes ────────────────────────────────────────────────────────
// Yahoo Finance v8/chart only supports 1 symbol at a time,
// so we batch by fetching multiple in parallel with concurrency control
const fetchBatchQuotes = async (nseSymbols, concurrency = 5) => {
  const results = {};

  // Process in batches
  for (let i = 0; i < nseSymbols.length; i += concurrency) {
    const batch = nseSymbols.slice(i, i + concurrency);
    const promises = batch.map(async (sym) => {
      const quote = await fetchYahooQuote(sym);
      if (quote) results[sym] = quote;
    });
    await Promise.allSettled(promises);
  }

  return results;
};

// ── Fetch index quote ─────────────────────────────────────────────────────────
const fetchIndexQuote = async (indexSymbol) => {
  const cacheKey = `index_${indexSymbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    await waitForRateLimit();

    const yahooSym = YAHOO_SYMBOL_MAP[indexSymbol];
    if (!yahooSym) return null;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}`;

    const response = await axios.get(url, {
      params: { interval: '1d', range: '5d' },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 8000,
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const indexData = {
      symbol: indexSymbol,
      currentValue: parseFloat((meta.regularMarketPrice || 0).toFixed(2)),
      previousClose: parseFloat((meta.chartPreviousClose || meta.previousClose || 0).toFixed(2)),
      high: parseFloat((meta.regularMarketDayHigh || 0).toFixed(2)),
      low: parseFloat((meta.regularMarketDayLow || 0).toFixed(2)),
      change: 0,
      changePercent: 0,
      marketState: meta.marketState || 'CLOSED',
    };

    if (indexData.previousClose > 0) {
      indexData.change = parseFloat((indexData.currentValue - indexData.previousClose).toFixed(2));
      indexData.changePercent = parseFloat(((indexData.change / indexData.previousClose) * 100).toFixed(2));
    }

    setCache(cacheKey, indexData);
    return indexData;
  } catch (err) {
    console.error(`[MarketPrice] Error fetching index ${indexSymbol}:`, err.message);
    return null;
  }
};

// ── Check if NSE market is open ───────────────────────────────────────────────
const isMarketOpen = () => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;
  const istHour = Math.floor((istMinutes % 1440) / 60);
  const istMin = istMinutes % 60;

  // Get IST day of week
  const istDate = new Date(now.getTime() + istOffset * 60 * 1000);
  const day = istDate.getUTCDay(); // 0=Sun, 6=Sat

  // Market closed on weekends
  if (day === 0 || day === 6) return false;

  // Market hours: 9:15 AM - 3:30 PM IST
  const timeInMinutes = istHour * 60 + istMin;
  return timeInMinutes >= 555 && timeInMinutes <= 930; // 9:15=555, 15:30=930
};

// ── Clear cache ───────────────────────────────────────────────────────────────
const clearPriceCache = () => {
  priceCache.clear();
};

// ── Search Yahoo Finance for symbols ────────────────────────────────────────────
const searchYahooFinance = async (query) => {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search`;
    const response = await axios.get(url, {
      params: { q: query, quotesCount: 10, newsCount: 0 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
    });

    const quotes = response.data?.quotes || [];
    // Filter for Indian exchanges (.NS or .BO)
    const indianStocks = quotes.filter(
      (q) => q.exchange === 'NSI' || q.exchange === 'BSE' || q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')
    );

    return indianStocks.map((q) => {
      // Remove .NS suffix to get our internal symbol
      const internalSymbol = q.symbol.replace(/\.NS$/, '').replace(/\.BO$/, '');
      return {
        symbol: internalSymbol,
        name: q.shortname || q.longname || internalSymbol,
        sector: q.sector || 'Unknown',
        exchange: q.exchange === 'BSE' ? 'BSE' : 'NSE', // Default to NSE
      };
    });
  } catch (err) {
    console.error(`[MarketPrice] Error searching Yahoo Finance for ${query}:`, err.message);
    return [];
  }
};

// ── Fetch historical chart data from Yahoo Finance ──────────────────────────────
const fetchHistoricalData = async (nseSymbol, range = '1y', interval = '1d') => {
  try {
    await waitForRateLimit();
    const yahooSym = toYahooSymbol(nseSymbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}`;
    const response = await axios.get(url, {
      params: { range, interval },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 8000,
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const { open = [], high = [], low = [], close = [], volume = [] } = quote;

    const formatted = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (open[i] === null || close[i] === null || high[i] === null || low[i] === null) continue;

      formatted.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        open: parseFloat(open[i].toFixed(2)),
        high: parseFloat(high[i].toFixed(2)),
        low: parseFloat(low[i].toFixed(2)),
        close: parseFloat(close[i].toFixed(2)),
        volume: volume[i] ? parseInt(volume[i]) : 0,
      });
    }
    return formatted;
  } catch (err) {
    console.error(`[MarketPrice] Historical data fetch failed for ${nseSymbol}:`, err.message);
    return null;
  }
};

module.exports = {
  fetchYahooQuote,
  fetchBatchQuotes,
  fetchIndexQuote,
  searchYahooFinance,
  isMarketOpen,
  clearPriceCache,
  toYahooSymbol,
  YAHOO_SYMBOL_MAP,
  fetchHistoricalData,
};

