import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '../../utils/helpers';
import { EVIDENCE_SOURCES } from '../../utils/constants';
import Card from '../common/Card';

const SourceDistribution = ({ evidenceItems = [], className }) => {
  // Calculate distribution
  const distribution = evidenceItems.reduce((acc, item) => {
    const source = item.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(distribution)
    .map(([source, count]) => ({
      name: EVIDENCE_SOURCES[source]?.label || source,
      value: count,
      color: EVIDENCE_SOURCES[source]?.color || '#64748B',
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-brand-slate border border-brand-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-text-primary">{item.name}</p>
          <p className="text-xs text-text-secondary">
            {item.value} items ({((item.value / evidenceItems.length) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <h3 className="font-semibold text-text-primary mb-4">Source Distribution</h3>
        <p className="text-text-muted text-center py-8">No evidence data</p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="font-semibold text-text-primary mb-4">Evidence by Source</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.slice(0, 6).map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-text-secondary truncate">
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SourceDistribution;
