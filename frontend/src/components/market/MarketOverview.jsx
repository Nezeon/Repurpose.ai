import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity, BarChart3, Info } from 'lucide-react';
import { cn } from '../../utils/helpers';
import Card from '../common/Card';
import Skeleton from '../common/Skeleton';
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
 * Format patient population in millions
 */
const formatPatientPopulation = (millions) => {
  if (!millions && millions !== 0) return 'N/A';
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)}B`;
  if (millions >= 1) return `${millions.toFixed(0)}M`;
  return `${(millions * 1000).toFixed(0)}K`;
};

/**
 * Format CAGR percentage
 */
const formatCAGR = (percent) => {
  if (!percent && percent !== 0) return 'N/A';
  return `${percent.toFixed(1)}%`;
};

/**
 * Get trend indicator based on CAGR
 */
const getTrendIndicator = (cagr) => {
  if (!cagr) return { label: 'Unknown', color: 'text-text-muted' };
  if (cagr >= 10) return { label: 'High Growth', color: 'text-green-400' };
  if (cagr >= 5) return { label: 'Growing', color: 'text-brand-teal' };
  if (cagr >= 0) return { label: 'Stable', color: 'text-brand-yellow' };
  return { label: 'Declining', color: 'text-red-400' };
};

const MarketOverview = ({ marketData, loading = false, className }) => {
  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <Skeleton height="1.5rem" width="40%" className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton height="0.75rem" width="60%" />
              <Skeleton height="1.5rem" width="80%" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!marketData) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Market Overview</h3>
        </div>
        <p className="text-text-muted text-center py-8">
          Select an opportunity to view market data
        </p>
      </Card>
    );
  }

  // Extract data from SubScore structure (marketData is the market_opportunity SubScore)
  const factors = marketData.factors || {};
  const score = marketData.score || 0;
  const notes = marketData.notes || [];

  // Get raw values from factors (added in composite_scorer)
  const marketSizeBillions = factors.market_size_raw_billions;
  const cagrPercent = factors.cagr_percent_raw;
  const unmetNeedRaw = factors.unmet_need_raw;
  const patientPopulationMillions = factors.patient_population_millions;
  const pricingPotential = factors.pricing_potential_raw;

  // Fallback to score-based estimates if raw values not available
  const hasRawData = marketSizeBillions !== null && marketSizeBillions !== undefined;

  const trend = getTrendIndicator(cagrPercent);

  const metrics = [
    {
      label: 'Market Size',
      value: formatMarketSize(marketSizeBillions),
      subValue: hasRawData ? null : '(estimated)',
      icon: DollarSign,
      color: '#00D4AA',
    },
    {
      label: 'Growth (CAGR)',
      value: formatCAGR(cagrPercent),
      subValue: trend.label,
      subValueColor: trend.color,
      icon: TrendingUp,
      color: '#FFE600',
    },
    {
      label: 'Patient Population',
      value: formatPatientPopulation(patientPopulationMillions),
      subValue: 'global',
      icon: Users,
      color: '#00B4D8',
    },
    {
      label: 'Unmet Need',
      value: unmetNeedRaw ? `${Math.round(unmetNeedRaw)}/100` : `${Math.round(factors.unmet_need * 100 / 30)}/100`,
      icon: Activity,
      color: '#A78BFA',
    },
  ];

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-teal" />
          <h3 className="font-semibold text-text-primary">Market Overview</h3>
        </div>
        <Badge variant={score >= 70 ? 'success' : score >= 50 ? 'warning' : 'outline'}>
          Score: {Math.round(score)}/100
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-brand-darker rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: metric.color }} />
                <span className="text-xs text-text-muted">{metric.label}</span>
              </div>
              <p className="text-xl font-bold text-text-primary">{metric.value}</p>
              {metric.subValue && (
                <p className={cn('text-xs mt-1', metric.subValueColor || 'text-text-muted')}>
                  {metric.subValue}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Pricing Potential */}
      {pricingPotential && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-text-muted">Pricing Potential:</span>
          <Badge
            variant={pricingPotential === 'premium' ? 'success' : pricingPotential === 'standard' ? 'warning' : 'outline'}
            size="sm"
          >
            {pricingPotential.charAt(0).toUpperCase() + pricingPotential.slice(1)}
          </Badge>
        </div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <div className="mt-4 p-3 bg-brand-dark/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-teal mt-0.5" />
            <div className="text-sm text-text-secondary">
              {notes.map((note, i) => (
                <span key={i}>{note}{i < notes.length - 1 ? ' • ' : ''}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Indicator */}
      {!hasRawData && (
        <p className="mt-3 text-xs text-text-muted italic flex items-center gap-1">
          <Info className="w-3 h-3" />
          Market data estimated based on indication analysis
        </p>
      )}
    </Card>
  );
};

export default MarketOverview;
