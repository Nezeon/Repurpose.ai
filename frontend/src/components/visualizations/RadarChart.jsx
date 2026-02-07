import React from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '../../utils/helpers';
import { DIMENSION_CONFIG } from '../../utils/constants';
import Card from '../common/Card';

const RadarChart = ({ compositeScore, className }) => {
  if (!compositeScore) return null;

  const data = [
    {
      dimension: 'Scientific',
      score: compositeScore.scientific_evidence?.score || 0,
      fullMark: 100,
    },
    {
      dimension: 'Market',
      score: compositeScore.market_opportunity?.score || 0,
      fullMark: 100,
    },
    {
      dimension: 'Competition',
      score: compositeScore.competitive_landscape?.score || 0,
      fullMark: 100,
    },
    {
      dimension: 'Feasibility',
      score: compositeScore.development_feasibility?.score || 0,
      fullMark: 100,
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-brand-slate border border-brand-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-text-primary">{item.dimension}</p>
          <p className="text-xs text-text-secondary">Score: {item.score.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="font-semibold text-text-primary mb-4">Dimension Comparison</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#243044" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#64748B', fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#FFE600"
              fill="#FFE600"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default RadarChart;
