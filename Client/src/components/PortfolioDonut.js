import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/helpers';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#00b386', '#3b82f6', '#f59e0b', '#eb5757', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

export default function PortfolioDonut({ holdings = [] }) {
  const data = {
    labels: holdings.map((h) => h.symbol),
    datasets: [{
      data: holdings.map((h) => h.currentValue || h.totalInvested),
      backgroundColor: holdings.map((_, i) => COLORS[i % COLORS.length]),
      borderWidth: 2,
      borderColor: 'var(--bg-card)',
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`,
        },
      },
    },
  };

  const total = holdings.reduce((s, h) => s + (h.currentValue || h.totalInvested), 0);

  return (
    <div>
      <div style={{ position: 'relative', maxWidth: 200, margin: '0 auto 20px' }}>
        <Doughnut data={data} options={options} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</p>
          <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatCurrency(total)}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {holdings.map((h, i) => {
          const val = h.currentValue || h.totalInvested;
          const pct = ((val / total) * 100).toFixed(1);
          return (
            <div key={h.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{h.symbol}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pct}%</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(val)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
