const STOCKS = [
  // NIFTY 50
  { symbol:'RELIANCE',  name:'Reliance Industries Ltd',        sector:'Energy',       industry:'Oil & Gas',          exchange:'NSE', basePrice:2956.75, marketCap:2001200000000, pe:28.4, eps:104.1, high52:3217.90, low52:2220.30, lotSize:1  },
  { symbol:'TCS',       name:'Tata Consultancy Services',      sector:'IT',           industry:'IT Services',         exchange:'NSE', basePrice:4123.40, marketCap:1498700000000, pe:31.2, eps:132.2, high52:4592.25, low52:3311.85, lotSize:1  },
  { symbol:'HDFCBANK',  name:'HDFC Bank Ltd',                  sector:'Banking',      industry:'Private Banks',       exchange:'NSE', basePrice:1748.60, marketCap:1331200000000, pe:19.8, eps:88.3,  high52:1880.00, low52:1363.55, lotSize:1  },
  { symbol:'BHARTIARTL',name:'Bharti Airtel Ltd',              sector:'Telecom',      industry:'Telecom Services',    exchange:'NSE', basePrice:1876.30, marketCap:1112300000000, pe:78.2, eps:24.0,  high52:1975.00, low52:1023.65, lotSize:1  },
  { symbol:'ICICIBANK', name:'ICICI Bank Ltd',                 sector:'Banking',      industry:'Private Banks',       exchange:'NSE', basePrice:1284.45, marketCap:904500000000,  pe:18.9, eps:67.9,  high52:1338.90, low52:945.00,  lotSize:1  },
  { symbol:'INFY',      name:'Infosys Ltd',                    sector:'IT',           industry:'IT Services',         exchange:'NSE', basePrice:1905.80, marketCap:793400000000,  pe:28.7, eps:66.4,  high52:2006.45, low52:1358.35, lotSize:1  },
  { symbol:'HINDUNILVR',name:'Hindustan Unilever Ltd',         sector:'FMCG',         industry:'Personal Products',   exchange:'NSE', basePrice:2398.25, marketCap:562300000000,  pe:55.3, eps:43.4,  high52:2717.75, low52:2172.10, lotSize:1  },
  { symbol:'ITC',       name:'ITC Ltd',                        sector:'FMCG',         industry:'Cigarettes',          exchange:'NSE', basePrice:464.75,  marketCap:578900000000,  pe:27.1, eps:17.1,  high52:528.50,  low52:399.35,  lotSize:1  },
  { symbol:'SBIN',      name:'State Bank of India',            sector:'Banking',      industry:'PSU Banks',           exchange:'NSE', basePrice:812.30,  marketCap:724500000000,  pe:10.2, eps:79.6,  high52:912.10,  low52:543.20,  lotSize:1  },
  { symbol:'BAJFINANCE',name:'Bajaj Finance Ltd',              sector:'Finance',      industry:'NBFC',                exchange:'NSE', basePrice:7234.55, marketCap:437600000000,  pe:35.6, eps:203.2, high52:8192.00, low52:6187.80, lotSize:1  },
  { symbol:'WIPRO',     name:'Wipro Ltd',                      sector:'IT',           industry:'IT Services',         exchange:'NSE', basePrice:578.90,  marketCap:298700000000,  pe:22.1, eps:26.2,  high52:640.05,  low52:418.70,  lotSize:1  },
  { symbol:'AXISBANK',  name:'Axiz Bank Ltd',                  sector:'Banking',      industry:'Private Banks',       exchange:'NSE', basePrice:1156.70, marketCap:357600000000,  pe:15.4, eps:75.1,  high52:1339.65, low52:900.15,  lotSize:1  },
  { symbol:'KOTAKBANK', name:'Kotak Mahindra Bank Ltd',        sector:'Banking',      industry:'Private Banks',       exchange:'NSE', basePrice:1887.45, marketCap:375400000000,  pe:22.3, eps:84.6,  high52:2063.70, low52:1544.15, lotSize:1  },
  { symbol:'MARUTI',    name:'Maruti Suzuki India Ltd',        sector:'Auto',         industry:'Passenger Cars',      exchange:'NSE', basePrice:12456.30,marketCap:376500000000,  pe:29.8, eps:417.9, high52:13680.00,low52:9832.75, lotSize:1  },
  { symbol:'TATAMOTORS',name:'Tata Motors Ltd',                sector:'Auto',         industry:'Automobiles',         exchange:'NSE', basePrice:945.60,  marketCap:346700000000,  pe:8.9,  eps:106.2, high52:1179.00, low52:614.45,  lotSize:1  },
  { symbol:'SUNPHARMA', name:'Sun Pharmaceutical Industries',  sector:'Pharma',       industry:'Pharmaceuticals',     exchange:'NSE', basePrice:1876.45, marketCap:450200000000,  pe:34.2, eps:54.9,  high52:1960.35, low52:1135.00, lotSize:1  },
  { symbol:'HCLTECH',   name:'HCL Technologies Ltd',           sector:'IT',           industry:'IT Services',         exchange:'NSE', basePrice:1923.75, marketCap:522300000000,  pe:30.1, eps:63.9,  high52:2012.90, low52:1235.20, lotSize:1  },
  { symbol:'LT',        name:'Larsen & Toubro Ltd',            sector:'Infra',        industry:'Construction',        exchange:'NSE', basePrice:3687.25, marketCap:506700000000,  pe:36.8, eps:100.2, high52:3963.90, low52:2831.45, lotSize:1  },
  { symbol:'TITAN',     name:'Titan Company Ltd',              sector:'Consumer',     industry:'Gems & Jewellery',    exchange:'NSE', basePrice:3456.80, marketCap:306500000000,  pe:89.4, eps:38.7,  high52:3886.00, low52:2555.00, lotSize:1  },
  { symbol:'ASIANPAINT',name:'Asian Paints Ltd',               sector:'Consumer',     industry:'Paints',              exchange:'NSE', basePrice:2478.35, marketCap:237400000000,  pe:48.2, eps:51.4,  high52:3394.70, low52:2194.85, lotSize:1  },
  { symbol:'NESTLEIND', name:'Nestle India Ltd',               sector:'FMCG',         industry:'Food Products',       exchange:'NSE', basePrice:2298.45, marketCap:221300000000,  pe:72.1, eps:31.9,  high52:2778.00, low52:2103.90, lotSize:1  },
  { symbol:'POWERGRID', name:'Power Grid Corporation',         sector:'Utilities',    industry:'Power Transmission',  exchange:'NSE', basePrice:318.75,  marketCap:296500000000,  pe:18.3, eps:17.4,  high52:366.25,  low52:213.20,  lotSize:1  },
  { symbol:'NTPC',      name:'NTPC Ltd',                       sector:'Utilities',    industry:'Power Generation',    exchange:'NSE', basePrice:387.45,  marketCap:375400000000,  pe:16.8, eps:23.1,  high52:448.45,  low52:255.20,  lotSize:1  },
  { symbol:'ONGC',      name:'Oil & Natural Gas Corporation',  sector:'Energy',       industry:'Oil Exploration',     exchange:'NSE', basePrice:278.35,  marketCap:350200000000,  pe:7.8,  eps:35.7,  high52:345.00,  low52:178.35,  lotSize:1  },
  { symbol:'TECHM',     name:'Tech Mahindra Ltd',              sector:'IT',           industry:'IT Services',         exchange:'NSE', basePrice:1687.30, marketCap:165400000000,  pe:46.3, eps:36.4,  high52:1807.85, low52:1069.90, lotSize:1  },
  { symbol:'MM',        name:'Mahindra & Mahindra Ltd',        sector:'Auto',         industry:'SUVs & Tractors',     exchange:'NSE', basePrice:3123.45, marketCap:386500000000,  pe:31.2, eps:100.1, high52:3264.95, low52:1626.30, lotSize:1  },
  { symbol:'ADANIENT',  name:'Adani Enterprises Ltd',          sector:'Conglomerate', industry:'Diversified',         exchange:'NSE', basePrice:2956.30, marketCap:336700000000,  pe:94.2, eps:31.4,  high52:3743.90, low52:1900.70, lotSize:1  },
  { symbol:'ADANIPORTS',name:'Adani Ports & SEZ Ltd',          sector:'Infra',        industry:'Ports & Logistics',   exchange:'NSE', basePrice:1387.25, marketCap:297600000000,  pe:28.7, eps:48.3,  high52:1621.40, low52:754.90,  lotSize:1  },
  { symbol:'COALINDIA', name:'Coal India Ltd',                 sector:'Materials',    industry:'Coal Mining',         exchange:'NSE', basePrice:476.85,  marketCap:294500000000,  pe:7.4,  eps:64.4,  high52:543.55,  low52:311.60,  lotSize:1  },
  { symbol:'DRREDDY',   name:"Dr Reddy's Laboratories",        sector:'Pharma',       industry:'Pharmaceuticals',     exchange:'NSE', basePrice:6456.70, marketCap:107600000000,  pe:18.6, eps:347.1, high52:7407.00, low52:4768.85, lotSize:1  },
  { symbol:'EICHERMOT', name:'Eicher Motors Ltd',              sector:'Auto',         industry:'Motorcycles',         exchange:'NSE', basePrice:4987.60, marketCap:136500000000,  pe:32.1, eps:155.4, high52:5340.00, low52:3367.70, lotSize:1  },
  { symbol:'HEROMOTOCO',name:'Hero MotoCorp Ltd',              sector:'Auto',         industry:'2-Wheelers',          exchange:'NSE', basePrice:4823.45, marketCap:96500000000,   pe:20.3, eps:237.6, high52:6246.35, low52:3554.80, lotSize:1  },
  { symbol:'HINDALCO',  name:'Hindalco Industries Ltd',        sector:'Materials',    industry:'Aluminium',           exchange:'NSE', basePrice:687.45,  marketCap:155400000000,  pe:12.4, eps:55.4,  high52:772.65,  low52:467.00,  lotSize:1  },
  { symbol:'JSWSTEEL',  name:'JSW Steel Ltd',                  sector:'Materials',    industry:'Steel',               exchange:'NSE', basePrice:978.30,  marketCap:234500000000,  pe:20.1, eps:48.7,  high52:1063.15, low52:726.55,  lotSize:1  },
  { symbol:'TATASTEEL', name:'Tata Steel Ltd',                 sector:'Materials',    industry:'Steel',               exchange:'NSE', basePrice:145.70,  marketCap:183400000000,  pe:24.3, eps:6.0,   high52:184.60,  low52:113.90,  lotSize:1  },
  { symbol:'ZOMATO',    name:'Zomato Ltd',                     sector:'Consumer',     industry:'Food Delivery',       exchange:'NSE', basePrice:267.45,  marketCap:235600000000,  pe:312.0,eps:0.86,  high52:304.70,  low52:112.30,  lotSize:1  },
  { symbol:'BAJAJFINSV',name:'Bajaj Finserv Ltd',              sector:'Finance',      industry:'Financial Services',  exchange:'NSE', basePrice:1876.45, marketCap:298700000000,  pe:23.4, eps:80.2,  high52:2029.90, low52:1419.05, lotSize:1  },
  { symbol:'GRASIM',    name:'Grasim Industries Ltd',          sector:'Materials',    industry:'Cement',              exchange:'NSE', basePrice:2734.55, marketCap:180400000000,  pe:27.8, eps:98.4,  high52:2938.55, low52:1712.40, lotSize:1  },
  { symbol:'INDUSINDBK',name:'IndusInd Bank Ltd',              sector:'Banking',      industry:'Private Banks',       exchange:'NSE', basePrice:1034.25, marketCap:80500000000,   pe:11.8, eps:87.6,  high52:1694.50, low52:774.25,  lotSize:1  },
  { symbol:'DIVISLAB',  name:"Divi's Laboratories Ltd",        sector:'Pharma',       industry:'Pharmaceuticals',     exchange:'NSE', basePrice:5123.45, marketCap:136400000000,  pe:65.3, eps:78.5,  high52:5593.50, low52:2903.20, lotSize:1  },
  { symbol:'CIPLA',     name:'Cipla Ltd',                      sector:'Pharma',       industry:'Pharmaceuticals',     exchange:'NSE', basePrice:1578.90, marketCap:127300000000,  pe:28.4, eps:55.6,  high52:1702.05, low52:1144.70, lotSize:1  },
  { symbol:'ULTRACEMCO',name:'UltraTech Cement Ltd',           sector:'Materials',    industry:'Cement',              exchange:'NSE', basePrice:11234.50,marketCap:323400000000,  pe:43.2, eps:260.1, high52:12638.65,low52:8217.70, lotSize:1  },
  { symbol:'TATACONSUM',name:'Tata Consumer Products Ltd',     sector:'FMCG',         industry:'Food & Beverages',    exchange:'NSE', basePrice:1087.35, marketCap:97300000000,   pe:78.4, eps:13.9,  high52:1258.55, low52:838.85,  lotSize:1  },
  { symbol:'APOLLOHOSP',name:'Apollo Hospitals Enterprise',    sector:'Healthcare',   industry:'Hospitals',           exchange:'NSE', basePrice:7234.50, marketCap:103400000000,  pe:89.2, eps:81.1,  high52:7545.00, low52:5223.00, lotSize:1  },
  { symbol:'PIDILITIND', name:'Pidilite Industries Ltd',       sector:'Chemicals',    industry:'Adhesives',           exchange:'NSE', basePrice:3145.20, marketCap:159600000000,  pe:84.3, eps:37.3,  high52:3403.70, low52:2395.00, lotSize:1  },
  { symbol:'DMART',     name:'Avenue Supermarts Ltd',          sector:'Consumer',     industry:'Retail',              exchange:'NSE', basePrice:4567.80, marketCap:296700000000,  pe:98.4, eps:46.4,  high52:5235.60, low52:3448.50, lotSize:1  },
  { symbol:'HAVELLS',   name:'Havells India Ltd',              sector:'Consumer',     industry:'Electricals',         exchange:'NSE', basePrice:1678.45, marketCap:105100000000,  pe:62.3, eps:26.9,  high52:2001.20, low52:1313.65, lotSize:1  },
  { symbol:'SIEMENS',   name:'Siemens Ltd',                    sector:'Infra',        industry:'Capital Goods',       exchange:'NSE', basePrice:7023.45, marketCap:249800000000,  pe:92.1, eps:76.3,  high52:8143.55, low52:4661.10, lotSize:1  },
  { symbol:'TRENT',     name:'Trent Ltd',                      sector:'Consumer',     industry:'Retail',              exchange:'NSE', basePrice:6234.15, marketCap:221200000000,  pe:278.3,eps:22.4,  high52:8345.60, low52:3196.45, lotSize:1  },
  { symbol:'PAYTM',     name:'One97 Communications Ltd',       sector:'Fintech',      industry:'Digital Payments',    exchange:'NSE', basePrice:878.35,  marketCap:55600000000,   pe:null, eps:-18.4, high52:1062.95, low52:310.00,  lotSize:1  },

  // ── Listed IPO Stocks ──
  { symbol:'HYUNDAI',   name:'Hyundai Motor India Ltd',        sector:'Auto',      industry:'Passenger Cars',    exchange:'NSE', basePrice:1645.30, marketCap:133600000000, pe:26.3, eps:62.4,  high52:2012.00, low52:1450.00, lotSize:7   },
  { symbol:'NTPCGREEN', name:'NTPC Green Energy Ltd',           sector:'Utilities', industry:'Renewable Energy',  exchange:'NSE', basePrice:115.50,  marketCap:112300000000, pe:98.4, eps:1.17,  high52:145.00,  low52:95.00,   lotSize:138 },
  { symbol:'SWIGGY',    name:'Swiggy Ltd',                      sector:'Consumer',  industry:'Food Delivery',     exchange:'NSE', basePrice:443.50,  marketCap:95600000000,  pe:null, eps:-8.4,  high52:617.00,  low52:325.00,  lotSize:38  },
  { symbol:'AFCONS',    name:'Afcons Infrastructure Ltd',       sector:'Infra',     industry:'Construction',      exchange:'NSE', basePrice:421.10,  marketCap:56700000000,  pe:32.1, eps:13.1,  high52:520.00,  low52:380.00,  lotSize:32  },
  { symbol:'ACMESOLAR', name:'ACME Solar Holdings Ltd',         sector:'Utilities', industry:'Solar Energy',      exchange:'NSE', basePrice:265.45,  marketCap:23400000000,  pe:45.2, eps:5.87,  high52:340.00,  low52:220.00,  lotSize:51  },
  { symbol:'CAPITALSFB',name:'CapitalSmall Finance Bank Ltd',   sector:'Banking',   industry:'Small Finance Bank',exchange:'NSE', basePrice:450.00,  marketCap:8900000000,   pe:12.4, eps:36.3,  high52:520.00,  low52:380.00,  lotSize:33  },
];

// IPO data
const IPOS = [
  { company:'Hyundai Motor India Ltd', symbol:'HYUNDAI', issuePrice:1960, currentPrice:1645.30, lotSize:7,  openDate:'2024-10-15', closeDate:'2024-10-17', listingDate:'2024-10-22', issueSize:27870.00, subscribed:2.37,  status:'Listed',    gmp:0,    rating:3, sector:'Auto',      exchange:'NSE' },
  { company:'NTPC Green Energy Ltd',   symbol:'NTPCGREEN',issuePrice:108,  currentPrice:115.50, lotSize:138,openDate:'2024-11-19', closeDate:'2024-11-22', listingDate:'2024-11-27', issueSize:10000.00, subscribed:2.55,  status:'Listed',    gmp:8,    rating:4, sector:'Utilities', exchange:'NSE' },
  { company:'Swiggy Ltd',              symbol:'SWIGGY',  issuePrice:390,  currentPrice:443.50, lotSize:38, openDate:'2024-11-06', closeDate:'2024-11-08', listingDate:'2024-11-13', issueSize:11327.00, subscribed:3.59,  status:'Listed',    gmp:55,   rating:3, sector:'Consumer',  exchange:'NSE' },
  { company:'Afcons Infrastructure',   symbol:'AFCONS',  issuePrice:463,  currentPrice:421.10, lotSize:32, openDate:'2024-10-25', closeDate:'2024-10-29', listingDate:'2024-11-04', issueSize:5430.00,  subscribed:2.64,  status:'Listed',    gmp:0,    rating:3, sector:'Infra',     exchange:'NSE' },
  { company:'ACME Solar Holdings',     symbol:'ACMESOLAR',issuePrice:289, currentPrice:265.45, lotSize:51, openDate:'2024-11-06', closeDate:'2024-11-08', listingDate:'2024-11-13', issueSize:2900.00,  subscribed:2.75,  status:'Listed',    gmp:0,    rating:3, sector:'Utilities', exchange:'NSE' },
  // Upcoming
  { company:'LG Electronics India',    symbol:'LGEIL',   issuePrice:null, currentPrice:null,   lotSize:null,openDate:'2025-04-10', closeDate:'2025-04-14', listingDate:'2025-04-18', issueSize:15000.00, subscribed:null,  status:'Upcoming',  gmp:145,  rating:4, sector:'Consumer',  exchange:'NSE' },
  { company:'Navi Technologies',       symbol:'NAVI',    issuePrice:null, currentPrice:null,   lotSize:null,openDate:'2025-04-22', closeDate:'2025-04-25', listingDate:'2025-04-29', issueSize:3350.00,  subscribed:null,  status:'Upcoming',  gmp:28,   rating:3, sector:'Fintech',   exchange:'NSE' },
  { company:'PhysicsWallah Ltd',       symbol:'PW',      issuePrice:null, currentPrice:null,   lotSize:null,openDate:'2025-05-05', closeDate:'2025-05-08', listingDate:'2025-05-14', issueSize:2500.00,  subscribed:null,  status:'Upcoming',  gmp:65,   rating:4, sector:'EdTech',    exchange:'NSE' },
  // Open now
  { company:'CapitalSmall Finance Bank',symbol:'CAPITALSFB',issuePrice:450,currentPrice:null,  lotSize:33, openDate:'2025-03-17', closeDate:'2025-03-21', listingDate:'2025-03-25', issueSize:450.00,   subscribed:1.24,  status:'Open',      gmp:35,   rating:3, sector:'Banking',   exchange:'NSE' },
];

// SIP recommended mutual funds
const MUTUAL_FUNDS = [
  { name:'Mirae Asset Large Cap Fund',        category:'Large Cap',   amc:'Mirae Asset',   nav:102.34,  returns1y:18.4, returns3y:14.2, returns5y:16.8, minSip:1000,  riskLevel:'Moderate',   rating:5, aum:38234 },
  { name:'Axis Bluechip Fund',               category:'Large Cap',   amc:'Axis MF',       nav:68.42,   returns1y:16.2, returns3y:13.1, returns5y:15.3, minSip:500,   riskLevel:'Moderate',   rating:5, aum:45123 },
  { name:'SBI Small Cap Fund',               category:'Small Cap',   amc:'SBI MF',        nav:178.56,  returns1y:42.1, returns3y:28.4, returns5y:32.6, minSip:500,   riskLevel:'High',       rating:5, aum:28456 },
  { name:'Parag Parikh Flexi Cap Fund',      category:'Flexi Cap',   amc:'PPFAS MF',      nav:76.23,   returns1y:28.3, returns3y:20.1, returns5y:22.4, minSip:1000,  riskLevel:'Moderate',   rating:5, aum:67891 },
  { name:'Nippon India Small Cap Fund',      category:'Small Cap',   amc:'Nippon MF',     nav:156.78,  returns1y:45.6, returns3y:30.2, returns5y:35.1, minSip:100,   riskLevel:'High',       rating:4, aum:52341 },
  { name:'HDFC Mid-Cap Opportunities',       category:'Mid Cap',     amc:'HDFC MF',       nav:123.45,  returns1y:35.4, returns3y:24.6, returns5y:28.9, minSip:100,   riskLevel:'High',       rating:5, aum:71234 },
  { name:'ICICI Pru Technology Fund',        category:'Sectoral',    amc:'ICICI Pru MF',  nav:234.67,  returns1y:22.3, returns3y:19.8, returns5y:24.5, minSip:1000,  riskLevel:'Very High',  rating:4, aum:12345 },
  { name:'Kotak Emerging Equity Fund',       category:'Mid Cap',     amc:'Kotak MF',      nav:98.34,   returns1y:38.2, returns3y:26.3, returns5y:30.7, minSip:1000,  riskLevel:'High',       rating:4, aum:34567 },
  { name:'Canara Robeco Equity Hybrid',      category:'Hybrid',      amc:'Canara Robeco', nav:56.78,   returns1y:20.4, returns3y:15.6, returns5y:18.2, minSip:1000,  riskLevel:'Moderate',   rating:4, aum:23456 },
  { name:'Quant Small Cap Fund',             category:'Small Cap',   amc:'Quant MF',      nav:267.45,  returns1y:58.3, returns3y:42.1, returns5y:48.6, minSip:1000,  riskLevel:'Very High',  rating:5, aum:18923 },
  { name:'DSP Nifty 50 Index Fund',          category:'Index Fund',  amc:'DSP MF',        nav:38.45,   returns1y:16.8, returns3y:12.4, returns5y:14.1, minSip:500,   riskLevel:'Moderate',   rating:4, aum:8234  },
  { name:'UTI Nifty Index Fund',             category:'Index Fund',  amc:'UTI MF',        nav:142.56,  returns1y:16.5, returns3y:12.2, returns5y:13.9, minSip:500,   riskLevel:'Moderate',   rating:4, aum:15678 },
];

// Nifty and Sensex historical data
const INDICES = [
  { symbol:'NIFTY50',  name:'Nifty 50',     exchange:'NSE', baseValue:22519.40, high52:26277.35, low52:19270.55 },
  { symbol:'SENSEX',   name:'BSE Sensex',   exchange:'BSE', baseValue:74119.49, high52:85978.25, low52:63295.90 },
  { symbol:'BANKNIFTY',name:'Bank Nifty',   exchange:'NSE', baseValue:47862.70, high52:54467.35, low52:41783.40 },
  { symbol:'NIFTYMID', name:'Nifty Midcap 100', exchange:'NSE', baseValue:51234.30, high52:60925.35, low52:39234.70 },
];

module.exports = {
  STOCKS,
  IPOS,
  MUTUAL_FUNDS,
  INDICES
};