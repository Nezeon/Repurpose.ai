/**
 * EvidenceChart Component
 * Bar chart visualization of top indications using Recharts
 * EY Healthcare Theme
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Get color based on confidence score
const getConfidenceColor = (score) => {
  if (score >= 80) return '#00C853'; // health-green
  if (score >= 60) return '#00A8B5'; // health-teal
  if (score >= 40) return '#FFE600'; // brand-yellow
  return '#FF4444'; // red
};

// Theme-aligned colors for variety (when not using score-based colors)
const COLORS = ['#FFE600', '#00A8B5', '#00C853', '#A855F7', '#00E5A0', '#FFC700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const score = data.confidence;
    const color = getConfidenceColor(score);

    return (
      <div className="bg-brand-charcoal p-4 rounded-xl border border-white/10 shadow-2xl min-w-[200px]">
        <p className="font-semibold text-white mb-2 leading-tight">
          {data.fullIndication}
        </p>
        <div className="space-y-1.5 text-sm">
          <p style={{ color }}>
            Confidence: <span className="font-bold">{score.toFixed(1)}/100</span>
          </p>
          <p className="text-gray-400">
            Evidence: <span className="font-semibold text-white">{data.evidence_count} items</span>
          </p>
          <p className="text-gray-400">
            Sources: <span className="font-semibold text-white">{data.sources_count}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const EvidenceChart = ({ indications = [], maxItems = 10, colorByScore = true }) => {
  if (!indications || indications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available for visualization</p>
      </div>
    );
  }

  // Prepare data for chart (top N indications)
  const chartData = indications.slice(0, maxItems).map((indication, index) => ({
    indication: indication.indication.length > 20
      ? indication.indication.slice(0, 20) + '...'
      : indication.indication,
    fullIndication: indication.indication,
    confidence: Number(indication.confidence_score) || 0,
    evidence_count: indication.evidence_count || 0,
    sources_count: indication.supporting_sources?.length || 0,
    rank: index + 1,
  }));

  // Debug: Log chart data to verify confidence scores are different
  console.log('EvidenceChart data:', chartData.map(d => ({
    name: d.indication,
    confidence: d.confidence
  })));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Confidence Score Comparison
        </h3>
        <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-lg">
          Top {Math.min(maxItems, indications.length)} opportunities
        </span>
      </div>

      <div className="bg-brand-dark/50 rounded-xl p-4 border border-white/5">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2E2E38" vertical={false} />

            <XAxis
              dataKey="indication"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#2E2E38' }}
              tickLine={{ stroke: '#2E2E38' }}
              interval={0}
            />

            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#2E2E38' }}
              tickLine={{ stroke: '#2E2E38' }}
              label={{
                value: 'Confidence Score',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 13, fill: '#6B7280' },
              }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255, 230, 0, 0.05)' }}
            />

            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              content={() => (
                <div className="flex justify-center">
                  <span className="text-sm text-gray-500">
                    Bar height represents confidence score (0-100)
                  </span>
                </div>
              )}
            />

            <Bar
              dataKey="confidence"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
              name="Confidence"
            >
              {chartData.map((entry, index) => {
                // Color by score if enabled, otherwise cycle through colors
                const fillColor = colorByScore
                  ? getConfidenceColor(entry.confidence)
                  : COLORS[index % COLORS.length];

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={fillColor}
                    style={{
                      filter: `drop-shadow(0 0 8px ${fillColor}40)`,
                    }}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Statistics */}
      {chartData.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-brand-dark/30 rounded-lg p-3 text-center border border-white/5">
            <div className="text-2xl font-bold text-health-green">
              {Math.max(...chartData.map(d => d.confidence)).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Highest Score</div>
          </div>
          <div className="bg-brand-dark/30 rounded-lg p-3 text-center border border-white/5">
            <div className="text-2xl font-bold text-health-teal">
              {(chartData.reduce((acc, d) => acc + d.confidence, 0) / chartData.length).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Average Score</div>
          </div>
          <div className="bg-brand-dark/30 rounded-lg p-3 text-center border border-white/5">
            <div className="text-2xl font-bold text-brand-yellow">
              {Math.min(...chartData.map(d => d.confidence)).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Lowest Score</div>
          </div>
        </div>
      )}

      {/* Legend for confidence levels */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-health-green/10 border border-health-green/30 rounded-full">
          <div className="w-2.5 h-2.5 rounded-full bg-health-green" />
          <span className="text-health-green">High (80-100)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-health-teal/10 border border-health-teal/30 rounded-full">
          <div className="w-2.5 h-2.5 rounded-full bg-health-teal" />
          <span className="text-health-teal">Moderate (60-79)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-yellow" />
          <span className="text-brand-yellow">Low (40-59)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-400/10 border border-red-400/30 rounded-full">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-red-400">Very Low (&lt;40)</span>
        </div>
      </div>
    </div>
  );
};

export default EvidenceChart;
