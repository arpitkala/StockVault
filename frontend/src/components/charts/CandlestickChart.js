import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

const PERIODS = ['1W', '1M', '3M', '6M', '1Y'];

export default function CandlestickChart({ data = [], positive = true, height = 380, showVolume = true }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volumeRef    = useRef(null);
  const lineRef      = useRef(null);
  const areaRef      = useRef(null);

  const [period,    setPeriod]    = useState('1M');
  const [chartType, setChartType] = useState('candle');

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const bg        = isDark ? '#0f1117' : '#ffffff';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const textColor = '#9297b0';
  const upColor   = '#26a69a';
  const downColor = '#ef5350';
  const lineColor = positive ? '#26a69a' : '#ef5350';

  const slicedData = React.useMemo(() => {
    const cuts = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    return data.slice(-(cuts[period] || 30));
  }, [data, period]);

  const lwCandles = React.useMemo(() =>
    slicedData
      .map(d => ({ time: d.date, open: d.open, high: d.high, low: d.low, close: d.close }))
      .sort((a, b) => (a.time > b.time ? 1 : -1)),
    [slicedData]
  );

  const lwLine = React.useMemo(() =>
    slicedData
      .map(d => ({ time: d.date, value: d.close }))
      .sort((a, b) => (a.time > b.time ? 1 : -1)),
    [slicedData]
  );

  const lwVolume = React.useMemo(() =>
    slicedData
      .map(d => ({
        time:  d.date,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38,166,154,0.45)' : 'rgba(239,83,80,0.45)',
      }))
      .sort((a, b) => (a.time > b.time ? 1 : -1)),
    [slicedData]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      lineRef.current   = null;
      areaRef.current   = null;
    }

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: showVolume ? height : height - 60,
      layout: {
        background: { color: bg },
        textColor:  textColor,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize:   11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          labelBackgroundColor: isDark ? '#2a2f43' : '#e8ecf5',
        },
        horzLine: {
          color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          labelBackgroundColor: isDark ? '#2a2f43' : '#e8ecf5',
        },
      },
      rightPriceScale: {
        borderColor:  isDark ? '#2a2f43' : '#e8ecf5',
        scaleMargins: { top: 0.08, bottom: showVolume ? 0.28 : 0.08 },
        ticksVisible: true,
      },
      timeScale: {
        borderColor:    isDark ? '#2a2f43' : '#e8ecf5',
        timeVisible:    true,
        secondsVisible: false,
        rightOffset:    5,
        barSpacing:     8,
        minBarSpacing:  2,
        fixLeftEdge:    false,
        fixRightEdge:   false,
        shiftVisibleRangeOnNewBar: true,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale:  { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });

    chartRef.current = chart;

    if (showVolume) {
      const vol = chart.addHistogramSeries({
        priceFormat:      { type: 'volume' },
        priceScaleId:     'vol',
        lastValueVisible: false,
        priceLineVisible: false,
      });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
      vol.setData(lwVolume);
      volumeRef.current = vol;
    }

    if (chartType === 'candle') {
      const candle = chart.addCandlestickSeries({
        upColor:          upColor,
        downColor:        downColor,
        borderUpColor:    upColor,
        borderDownColor:  downColor,
        wickUpColor:      upColor,
        wickDownColor:    downColor,
        borderVisible:    true,
        wickVisible:      true,
        priceScaleId:     'right',
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineColor:   lineColor,
        priceLineWidth:   1,
        priceLineStyle:   LineStyle.Dashed,
      });
      candle.setData(lwCandles);
      candleRef.current = candle;
    } else if (chartType === 'line') {
      const line = chart.addLineSeries({
        color:                  lineColor,
        lineWidth:              2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius:  4,
        lastValueVisible:       true,
        priceLineVisible:       true,
        priceLineColor:         lineColor,
        priceLineStyle:         LineStyle.Dashed,
      });
      line.setData(lwLine);
      lineRef.current = line;
    } else if (chartType === 'area') {
      const area = chart.addAreaSeries({
        topColor:               lineColor + '55',
        bottomColor:            lineColor + '00',
        lineColor:              lineColor,
        lineWidth:              2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius:  4,
        lastValueVisible:       true,
        priceLineVisible:       true,
        priceLineColor:         lineColor,
        priceLineStyle:         LineStyle.Dashed,
      });
      area.setData(lwLine);
      areaRef.current = area;
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        chartRef.current.applyOptions({ width: entries[0].contentRect.width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [slicedData, chartType, isDark, showVolume]);

  const handleZoomIn = useCallback(() => {
    const ts = chartRef.current?.timeScale();
    if (ts) {
      const range = ts.getVisibleLogicalRange();
      if (range) {
        const mid  = (range.from + range.to) / 2;
        const half = (range.to - range.from) / 4;
        ts.setVisibleLogicalRange({ from: mid - half, to: mid + half });
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const ts = chartRef.current?.timeScale();
    if (ts) {
      const range = ts.getVisibleLogicalRange();
      if (range) {
        const mid  = (range.from + range.to) / 2;
        const half = (range.to - range.from);
        ts.setVisibleLogicalRange({ from: mid - half, to: mid + half });
      }
    }
  }, []);

  const handleReset = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
  }, []);

  const btnBase = {
    padding: '5px 12px', borderRadius: 'var(--radius-sm)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font)', border: 'none', transition: 'all 0.15s',
  };

  const iconBtn = {
    ...btnBase, padding: '5px 10px',
    background: 'var(--surface-2)', color: 'var(--text-3)',
    fontSize: 14, lineHeight: 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 10px', flexWrap: 'wrap', gap: 8,
      }}>
        {/* Period */}
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              ...btnBase,
              background: period === p ? 'var(--brand)' : 'var(--surface-2)',
              color:      period === p ? '#fff' : 'var(--text-3)',
            }}>{p}</button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={handleZoomIn}  style={iconBtn} title="Zoom In">＋</button>
            <button onClick={handleZoomOut} style={iconBtn} title="Zoom Out">－</button>
            <button onClick={handleReset}   style={iconBtn} title="Fit All">⤢</button>
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--line-2)' }} />
          {[{ key: 'line', label: 'Line' }, { key: 'area', label: 'Area' }, { key: 'candle', label: 'Candle' }].map(({ key, label }) => (
            <button key={key} onClick={() => setChartType(key)} style={{
              ...btnBase, padding: '5px 11px', fontSize: 11,
              background: chartType === key ? 'var(--surface-3)' : 'transparent',
              color:      chartType === key ? 'var(--text-1)'    : 'var(--text-3)',
              border:     `1px solid ${chartType === key ? 'var(--line-2)' : 'transparent'}`,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ width: '100%', height, padding: '0 4px 4px', cursor: 'crosshair' }} />

      {/* Hint */}
      <div style={{ textAlign: 'right', padding: '2px 20px 8px', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font)' }}>
        Scroll to zoom · Drag to pan
      </div>
    </div>
  );
}