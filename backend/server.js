const express    = require('express');
const http       = require('http');
const WebSocket  = require('ws');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const cron       = require('node-cron');
require('dotenv').config();

const connectDB      = require('./config/db');
const authRoutes     = require('./routes/auth');
const stockRoutes    = require('./routes/stocks');
const orderRoutes    = require('./routes/orders');
const portfolioRoutes= require('./routes/portfolio');
const watchlistRoutes= require('./routes/watchlist');
const ipoRoutes      = require('./routes/ipo');
const sipRoutes      = require('./routes/sip');
const marketRoutes   = require('./routes/market');
const { updateStockPrices } = require('./services/stockService');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });
const clients= new Set();

wss.on('connection', ws => {
  clients.add(ws);
  ws.on('close',  () => clients.delete(ws));
  ws.on('error',  () => clients.delete(ws));
});

const broadcast = data => {
  const msg = JSON.stringify({ type:'PRICE_UPDATE', data });
  clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
};
app.set('broadcastPrices', broadcast);

connectDB();

app.use(
  cors({ 
    origin:"https://stockvault01.netlify.app",
     credentials: true 
     })
     );
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 500 }));

app.use('/api/auth',      authRoutes);
app.use('/api/stocks',    stockRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/ipo',       ipoRoutes);
app.use('/api/sip',       sipRoutes);
app.use('/api/market',    marketRoutes);

app.get("/", (req, res) => {
  res.send("StockVault API is running successfully");
});
app.get('/api/health', (_, res) => res.json({ status:'ok', ts: new Date() }));
app.use((_, res) => res.status(404).json({ error:'Route not found' }));
app.use((err, _, res, __) => res.status(err.status||500).json({ error: err.message }));

cron.schedule('*/15 * * * * *', async () => {
  const updated = await updateStockPrices();
  if (updated?.length) broadcast(updated);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`StockVault v2 on :${PORT}`));
