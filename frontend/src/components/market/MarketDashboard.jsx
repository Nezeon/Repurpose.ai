import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  BarChart3,
  Activity,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import Card from '../common/Card';
import Badge from '../common/Badge';

/**
 * Format market size in billions to readable string
 */
const formatMarketSize = (billions) => {
  if (!billions && billions !== 0) return 'N/A';
  if (billions >= 100) return `$${billions.toFixed(0)}B`;
  if (billions >= 10) return `$${billions.toFixed(1)}B`;
  if (billions >= 1) return `$${billions.toFixed(1)}B`;
  return `$${(billions * 1000).toFixed(0)}M`;
};

/**
 * Colors for charts
 */
const CHART_COLORS = [
  '#00D4AA', // teal
  '#FFE600', // yellow
  '#00B4D8', // cyan
  '#A78BFA', // purple
  '#FF6B6B', // coral
  '#4ECDC4', // mint
  '#45B7D1', // sky
  '#96CEB4', // sage
];

/**
 * Custom tooltip for charts
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-darker border border-brand-border rounded-lg p-3 shadow-xl">
        <p className="text-text-primary font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * MarketDashboard - Aggregate market analysis with multiple visualizations
 */
const MarketDashboard = ({ opportunities = [], className }) => {
  // Calculate aggregate data
  const aggregateData = useMemo(() => {
    if (!opportunities?.length) return null;

    const validOpportunities = opportunities.filter(
      (o) => o.composite_score?.market_opportunity
    );

    if (!validOpportunities.length) return null;

    // Get all market data
    const marketDataList = validOpportunities.map((o) => ({
      indication: o.indication,
      score: o.composite_score?.overall_score || 0,
      marketScore: o.composite_score?.market_opportunity?.score || 0,
      marketSize: o.composite_score?.market_opportunity?.factors?.market_size_raw_billions || 0,
      growthRate: o.composite_score?.market_opportunity?.factors?.cagr_percent_raw || 0,
      unmetNeed: o.composite_score?.market_opportunity?.factors?.unmet_need_raw || 0,
      patientPop: o.composite_score?.market_opportunity?.factors?.patient_population_millions || 0,
    }));

    // Calculate totals
    const totalMarketSize = marketDataList.reduce((sum, m) => sum + (m.marketSize || 0), 0);
    const avgGrowthRate = marketDataList.reduce((sum, m) => sum + (m.growthRate || 0), 0) / marketDataList.length;
    const avgMarketScore = marketDataList.reduce((sum, m) => sum + (m.marketScore || 0), 0) / marketDataList.length;
    const totalPatientPop = marketDataList.reduce((sum, m) => sum + (m.patientPop || 0), 0);

    // Sort by market score for ranking
    const ranked = [...marketDataList].sort((a, b) => b.marketScore - a.marketScore);

    // Prepare chart data
    const barChartData = ranked.slice(0, 10).map((item) => ({
      name: item.indication.length > 20 ? item.indication.slice(0, 20) + '...' : item.indication,
      fullName: item.indication,
      marketSize: item.marketSize,
      marketScore: item.marketScore,
    }));

    const scatterData = marketDataList.map((item) => ({
      x: item.marketSize,
      y: item.growthRate,
      z: item.score,
      name: item.indication,
    }));

    // Pie chart - top 5 + others
    const top5 = ranked.slice(0, 5);
    const othersMarketSize = ranked.slice(5).reduce((sum, m) => sum + m.marketSize, 0);
    const pieData = [
      ...top5.map((item) => ({
        name: item.indication.length > 15 ? item.indication.slice(0, 15) + '...' : item.indication,
        value: item.marketSize,
      })),
    ];
    if (othersMarketSize > 0) {
      pieData.push({ name: 'Others', value: othersMarketSize });
    }

    return {
      totalMarketSize,
      avgGrowthRate,
      avgMarketScore,
      totalPatientPop,
      opportunityCount: validOpportunities.length,
      ranked,
      barChartData,
      scatterData,
      pieData,
    };
  }, [opportunities]);

  if (!aggregateData) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Market Analysis</h3>
        </div>
        <p className="text-text-muted text-center py-8">
          No market data available. Run a search to analyze market opportunities.
        </p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-brand-teal" />
            <span className="text-xs text-text-muted">Total Addressable Market</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatMarketSize(aggregateData.totalMarketSize)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Combined across {aggregateData.opportunityCount} indications
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-brand-yellow" />
            <span className="text-xs text-text-muted">Avg. Growth Rate</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {aggregateData.avgGrowthRate.toFixed(1)}%
          </p>
          <p className={cn(
            'text-xs mt-1 flex items-center gap-1',
            aggregateData.avgGrowthRate >= 5 ? 'text-green-400' : 'text-brand-yellow'
          )}>
            {aggregateData.avgGrowthRate >= 5 ? (
              <><ChevronUp className="w-3 h-3" /> Strong growth</>
            ) : (
              <><Activity className="w-3 h-3" /> Moderate growth</>
            )}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-text-muted">Avg. Market Score</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {Math.round(aggregateData.avgMarketScore)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Out of 100 points
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-text-muted">Opportunities</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {aggregateData.opportunityCount}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Analyzed indications
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart - Market Size by Indication */}
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-teal" />
            Market Size by Indication
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aggregateData.barChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#888"
                  fontSize={11}
                  width={75}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="marketSize"
                  name="Market Size ($B)"
                  fill="#00D4AA"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Scatter Chart - Market Size vs Growth */}
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-yellow" />
            Market Size vs Growth Rate
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Market Size"
                  unit="B"
                  stroke="#888"
                  fontSize={12}
                  label={{ value: 'Market Size ($B)', position: 'bottom', fill: '#888' }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Growth"
                  unit="%"
                  stroke="#888"
                  fontSize={12}
                  label={{ value: 'Growth Rate (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Score" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-brand-darker border border-brand-border rounded-lg p-3 shadow-xl">
                          <p className="text-text-primary font-medium mb-1">{data.name}</p>
                          <p className="text-sm text-brand-teal">Market: ${data.x.toFixed(1)}B</p>
                          <p className="text-sm text-brand-yellow">Growth: {data.y.toFixed(1)}%</p>
                          <p className="text-sm text-purple-400">Score: {data.z}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  name="Opportunities"
                  data={aggregateData.scatterData}
                  fill="#FFE600"
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart - Market Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Market Distribution
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregateData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {aggregateData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-brand-darker border border-brand-border rounded-lg p-3 shadow-xl">
                          <p className="text-text-primary font-medium">{payload[0].name}</p>
                          <p className="text-sm text-brand-teal">
                            {formatMarketSize(payload[0].value)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Ranking Table */}
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            Top Opportunities Ranking
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-text-muted border-b border-brand-border">
                  <th className="text-left py-2 pr-2">#</th>
                  <th className="text-left py-2 pr-2">Indication</th>
                  <th className="text-right py-2 pr-2">Market</th>
                  <th className="text-right py-2 pr-2">Growth</th>
                  <th className="text-right py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {aggregateData.ranked.slice(0, 10).map((item, index) => (
                  <motion.tr
                    key={item.indication}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-brand-border/50 hover:bg-brand-darker/50"
                  >
                    <td className="py-2 pr-2">
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 ? 'bg-brand-yellow text-black' :
                        index === 1 ? 'bg-gray-300 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-brand-darker text-text-muted'
                      )}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-sm text-text-primary truncate max-w-[150px]">
                      {item.indication}
                    </td>
                    <td className="py-2 pr-2 text-sm text-text-secondary text-right">
                      {formatMarketSize(item.marketSize)}
                    </td>
                    <td className="py-2 pr-2 text-sm text-right">
                      <span className={cn(
                        item.growthRate >= 10 ? 'text-green-400' :
                        item.growthRate >= 5 ? 'text-brand-teal' :
                        'text-text-muted'
                      )}>
                        {item.growthRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <Badge
                        variant={
                          item.marketScore >= 70 ? 'success' :
                          item.marketScore >= 50 ? 'warning' : 'outline'
                        }
                        size="sm"
                      >
                        {Math.round(item.marketScore)}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MarketDashboard;
