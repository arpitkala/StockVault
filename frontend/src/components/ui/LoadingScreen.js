import React, { useEffect, useState } from 'react';

const TICKERS = [
  { sym:'RELIANCE',  val:'₹2,964', chg:'+1.22%', up:true  },
  { sym:'TCS',       val:'₹4,159', chg:'+1.03%', up:true  },
  { sym:'NIFTY50',   val:'22,531', chg:'-0.25%', up:false },
  { sym:'SENSEX',    val:'74,446', chg:'+0.32%', up:true  },
  { sym:'HDFCBANK',  val:'₹1,785', chg:'-3.59%', up:false },
  { sym:'INFY',      val:'₹1,927', chg:'+0.57%', up:true  },
  { sym:'SBIN',      val:'₹839',   chg:'+5.45%', up:true  },
  { sym:'ZOMATO',    val:'₹267',   chg:'+2.10%', up:true  },
  { sym:'WIPRO',     val:'₹579',   chg:'+0.44%', up:true  },
  { sym:'ITC',       val:'₹454',   chg:'-2.76%', up:false },
];

const STATS = [
  { val:'22,531', lbl:'NIFTY 50',  chg:'-0.25%', up:false },
  { val:'74,446', lbl:'SENSEX',    chg:'+0.32%', up:true  },
  { val:'47,718', lbl:'BANKNIFTY', chg:'+0.29%', up:true  },
];

const MSGS = [
  'Fetching live market data',
  'Loading your portfolio',
  'Syncing watchlist',
  'Preparing options chain',
  'Connecting to NSE',
  'Almost ready',
];

const FLOAT_STOCKS = [
  { sym:'RELIANCE', val:'₹2,964', chg:'+1.22%', up:true,  x:'4%',  y:'20%', delay:'0s',  dur:'4s'   },
  { sym:'TCS',      val:'₹4,159', chg:'+1.03%', up:true,  x:'78%', y:'15%', delay:'1s',  dur:'5s'   },
  { sym:'SBIN',     val:'₹839',   chg:'+5.45%', up:true,  x:'6%',  y:'65%', delay:'2s',  dur:'4.5s' },
  { sym:'INFY',     val:'₹1,927', chg:'+0.57%', up:true,  x:'76%', y:'60%', delay:'.5s', dur:'3.8s' },
];

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade,   setFade]   = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % MSGS.length);
        setFade(true);
      }, 250);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const allTickers = [...TICKERS, ...TICKERS];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#060b14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflow: 'hidden', zIndex: 9999,
    }}>
      <style>{`
        @keyframes gridMove   { from{background-position:0 0} to{background-position:0 60px} }
        @keyframes glowPulse  { 0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes ringPulse  { 0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.03)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes iconPop    { from{transform:scale(.5) rotate(-20deg);opacity:0} to{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes fillBar    { 0%{width:0%}25%{width:28%}55%{width:62%}80%{width:85%}100%{width:100%} }
        @keyframes scrollTick { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes blink      { 0%,80%,100%{opacity:.3} 40%{opacity:1} }
        @keyframes floatOrb   { 0%{transform:translateY(100vh) rotate(0deg);opacity:0} 5%{opacity:1} 95%{opacity:.7} 100%{transform:translateY(-100px) rotate(360deg);opacity:0} }
        @keyframes floatCard  { 0%,100%{transform:translateY(0px) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(1deg)} }
        @keyframes shoot      { 0%{opacity:0;transform:translate(0,0) scaleX(1)} 10%{opacity:1} 100%{opacity:0;transform:translate(300px,150px) scaleX(40)} }
      `}</style>

      {/* Moving grid */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'linear-gradient(rgba(0,208,156,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(0,208,156,.07) 1px,transparent 1px)',
        backgroundSize:'60px 60px',
        animation:'gridMove 8s linear infinite',
      }}/>

      {/* Radial glow */}
      <div style={{
        position:'absolute', width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,208,156,.08) 0%,transparent 70%)',
        top:'50%', left:'50%',
        animation:'glowPulse 3s ease-in-out infinite',
      }}/>

      {/* Rings */}
      {[
        { size:320, delay:'0s',   color:'rgba(0,208,156,.12)' },
        { size:480, delay:'.8s',  color:'rgba(0,208,156,.07)' },
        { size:640, delay:'1.6s', color:'rgba(0,208,156,.04)' },
      ].map((r, i) => (
        <div key={i} style={{
          position:'absolute', borderRadius:'50%',
          width:r.size, height:r.size,
          border:`1px solid ${r.color}`,
          top:'50%', left:'50%',
          animation:`ringPulse 4s ease-in-out ${r.delay} infinite`,
        }}/>
      ))}

      {/* Shooting stars */}
      {Array.from({ length:8 }).map((_, i) => (
        <div key={i} style={{
          position:'absolute', width:2, height:2,
          background:'#fff', borderRadius:'50%', opacity:0,
          left:`${(i * 12) % 60}%`,
          top:`${(i * 8)  % 50}%`,
          animation:`shoot ${3 + (i % 4)}s linear ${i * 1.1}s infinite`,
        }}/>
      ))}

      {/* Floating orbs */}
      {Array.from({ length:20 }).map((_, i) => {
        const size = 3 + (i % 5);
        const isUp = i % 3 !== 0;
        return (
          <div key={i} style={{
            position:'absolute', borderRadius:'50%',
            width:size, height:size,
            left:`${(i * 5.2) % 100}%`,
            background: isUp ? 'rgba(0,208,156,.4)' : 'rgba(239,83,80,.35)',
            animation:`floatOrb ${5 + (i % 4) * 2}s linear ${(i * 0.4) % 6}s infinite`,
          }}/>
        );
      })}

      {/* Floating stock cards */}
      {FLOAT_STOCKS.map((f, i) => (
        <div key={i} style={{
          position:'absolute', left:f.x, top:f.y,
          background:'rgba(255,255,255,.04)',
          border:'1px solid rgba(255,255,255,.08)',
          borderRadius:10, padding:'8px 14px',
          display:'flex', alignItems:'center', gap:10,
          animation:`floatCard ${f.dur} ease-in-out ${f.delay} infinite`,
          pointerEvents:'none',
        }}>
          <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.7)', minWidth:70 }}>{f.sym}</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontFamily:'monospace' }}>{f.val}</span>
          <span style={{
            fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4,
            background: f.up ? 'rgba(0,208,156,.15)' : 'rgba(239,83,80,.15)',
            color: f.up ? '#00d09c' : '#ef5350',
          }}>{f.chg}</span>
        </div>
      ))}

      {/* Center content */}
      <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', zIndex:10 }}>

        {/* Animated chart SVG */}
        <div style={{ marginBottom:32, animation:'fadeUp .8s ease .2s both' }}>
          <svg width="340" height="100" viewBox="0 0 340 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="340" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00d09c" stopOpacity=".3"/>
                <stop offset="100%" stopColor="#00f5b8"/>
              </linearGradient>
              <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d09c" stopOpacity=".25"/>
                <stop offset="100%" stopColor="#00d09c" stopOpacity="0"/>
              </linearGradient>
              <clipPath id="svClip"><rect width="340" height="100"/></clipPath>
              <filter id="glow2">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <path
              d="M0 80 C20 75,40 68,60 60 C80 52,90 65,110 55 C130 45,140 30,160 28 C180 26,190 40,210 35 C230 30,240 15,260 12 C280 9,300 20,320 18 L340 16 L340 100 L0 100Z"
              fill="url(#fillGrad)" clipPath="url(#svClip)"/>

            <path
              d="M0 80 C20 75,40 68,60 60 C80 52,90 65,110 55 C130 45,140 30,160 28 C180 26,190 40,210 35 C230 30,240 15,260 12 C280 9,300 20,320 18 L340 16"
              stroke="url(#lineGrad)" strokeWidth="2.5" fill="none" filter="url(#glow2)"
              strokeDasharray="600" strokeDashoffset="600">
              <animate attributeName="strokeDashoffset" from="600" to="0" dur="2s" fill="freeze"/>
            </path>

            <circle cx="340" cy="16" r="5" fill="#00d09c" opacity="0">
              <animate attributeName="opacity" values="0;1" begin="1.8s" dur=".3s" fill="freeze"/>
              <animate attributeName="r" values="3;6;4" begin="2s" dur="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="340" cy="16" r="12" fill="none" stroke="#00d09c" strokeWidth="1" opacity="0">
              <animate attributeName="opacity" values="0;0.4" begin="1.8s" dur=".3s" fill="freeze"/>
              <animate attributeName="r" values="6;14;6" begin="2s" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values=".4;0" begin="2s" dur="1.5s" repeatCount="indefinite"/>
            </circle>

            <rect x="290" y="4" width="50" height="20" rx="4" fill="#00d09c" opacity="0">
              <animate attributeName="opacity" values="0;1" begin="2s" dur=".4s" fill="freeze"/>
            </rect>
            <text x="315" y="17" textAnchor="middle" fontSize="10" fontWeight="700" fill="#060b14" opacity="0" fontFamily="monospace">
              +2.4%
              <animate attributeName="opacity" values="0;1" begin="2s" dur=".4s" fill="freeze"/>
            </text>
          </svg>
        </div>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8, animation:'fadeUp .7s ease .4s both' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'#00d09c', display:'flex', alignItems:'center', justifyContent:'center', animation:'iconPop .6s ease .4s both' }}>
            <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
              <path d="M3 14l4-5 3 3.5 2.5-4L18 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize:32, fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>
            Stock<span style={{ color:'#00d09c' }}>Vault</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,.3)', marginBottom:32, animation:'fadeUp .7s ease .5s both' }}>
          Virtual Trading Platform · NSE Live
        </div>

        {/* Progress bar */}
        <div style={{ width:240, marginBottom:12, animation:'fadeUp .7s ease .6s both' }}>
          <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#00d09c,#00f5b8)', animation:'fillBar 3s ease-in-out forwards' }}/>
          </div>
        </div>

        {/* Message */}
        <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', letterSpacing:'.5px', animation:'fadeUp .7s ease .7s both', transition:'opacity .25s', opacity: fade ? 1 : 0 }}>
          {MSGS[msgIdx]}
          {['0s','.2s','.4s'].map((d, i) => (
            <span key={i} style={{ display:'inline-block', animation:`blink 1.2s infinite ${d}`, color:'rgba(255,255,255,.35)' }}>.</span>
          ))}
        </div>

        {/* Index stats */}
        <div style={{ display:'flex', gap:16, marginTop:28, animation:'fadeUp .7s ease .8s both', flexWrap:'wrap', justifyContent:'center' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
              borderRadius:10, padding:'12px 18px', minWidth:90,
            }}>
              <div style={{ fontSize:16, fontWeight:800, fontFamily:'monospace', color:'#fff' }}>{s.val}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.8px' }}>{s.lbl}</div>
              <div style={{ fontSize:11, fontWeight:700, color: s.up ? '#00d09c' : '#ef5350' }}>{s.chg}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticker strip */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, borderTop:'1px solid rgba(255,255,255,.05)', padding:'10px 0 14px', overflow:'hidden' }}>
        <div style={{ display:'flex', gap:36, animation:'scrollTick 22s linear infinite', width:'max-content' }}>
          {allTickers.map((t, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.7)' }}>{t.sym}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontFamily:'monospace' }}>{t.val}</span>
              <span style={{
                fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4,
                background: t.up ? 'rgba(0,208,156,.15)' : 'rgba(239,83,80,.15)',
                color: t.up ? '#00d09c' : '#ef5350',
              }}>{t.chg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}