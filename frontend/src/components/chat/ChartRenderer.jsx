import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DEFAULT_COLORS = ['#00D4AA', '#FFE600', '#00B4D8', '#A78BFA', '#F472B6', '#34D399'];

const ChartRenderer = ({ chart }) => {
  if (!chart || !chart.datasets || !chart.labels) return null;

  // Transform data for Recharts
  const data = chart.labels.map((label, idx) => {
    const point = { name: label };
    chart.datasets.forEach((ds) => {
      point[ds.label] = ds.data[idx];
    });
    return point;
  });

  const chartType = chart.chart_type || 'bar';

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#1a2332' }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#1a2332' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0d1829',
              border: '1px solid #1a2332',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {chart.datasets.map((ds, idx) => (
            <Bar
              key={ds.label}
              dataKey={ds.label}
              fill={ds.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Fallback: simple bar chart for any type
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0d1829', border: '1px solid #1a2332', borderRadius: '8px' }}
        />
        {chart.datasets.map((ds, idx) => (
          <Bar
            key={ds.label}
            dataKey={ds.label}
            fill={ds.color || DEFAULT_COLORS[idx]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ChartRenderer;
