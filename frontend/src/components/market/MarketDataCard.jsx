import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Banknote,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import Card from '../common/Card';
import Badge from '../common/Badge';

/**
 * MarketDataCard - Displays exact market numbers with detailed breakdown
 * Shows actual dollar amounts, percentages, and patient population data
 */
const MarketDataCard = ({ marketData, indication, className }) => {
  if (!marketData) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">
            No market data available
          </p>
        </div>
      </Card>
    );
  }

  // Extract factors from SubScore
  const factors = marketData.factors || {};
  const score = marketData.score || 0;
  const dataCompleteness = marketData.data_completeness || 0;

  // Raw values
  const marketSizeBillions = factors.market_size_raw_billions;
  const cagrPercent = factors.cagr_percent_raw;
  const unmetNeedScore = factors.unmet_need_raw;
  const patientPopMillions = factors.patient_population_millions;
  const pricingPotential = factors.pricing_potential_raw;

  // Determine data quality
  const isEstimated = !marketSizeBillions && marketSizeBillions !== 0;

  // Format functions
  const formatBillions = (val) => {
    if (val === null || val === undefined) return '—';
    if (val >= 100) return `$${val.toFixed(0)}B`;
    if (val >= 1) return `$${val.toFixed(1)}B`;
    return `$${(val * 1000).toFixed(0)}M`;
  };

  const formatMillions = (val) => {
    if (val === null || val === undefined) return '—';
    if (val >= 1000) return `${(val / 1000).toFixed(2)} billion`;
    if (val >= 1) return `${val.toFixed(1)} million`;
    return `${(val * 1000).toFixed(0)} thousand`;
  };

  const formatPercent = (val) => {
    if (val === null || val === undefined) return '—';
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  // CAGR trend
  const getTrendIcon = () => {
    if (!cagrPercent && cagrPercent !== 0) return <Minus className="w-4 h-4 text-text-muted" />;
    if (cagrPercent >= 5) return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (cagrPercent >= 0) return <ArrowUp className="w-4 h-4 text-brand-yellow" />;
    return <ArrowDown className="w-4 h-4 text-red-400" />;
  };

  const getUnmetNeedLevel = () => {
    if (!unmetNeedScore) return { label: 'Unknown', color: 'text-text-muted', bg: 'bg-brand-dark' };
    if (unmetNeedScore >= 80) return { label: 'Very High', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (unmetNeedScore >= 60) return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    if (unmetNeedScore >= 40) return { label: 'Moderate', color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' };
    return { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/10' };
  };

  const getPricingBadge = () => {
    if (!pricingPotential) return null;
    const variants = {
      premium: { variant: 'success', label: 'Premium Pricing' },
      standard: { variant: 'warning', label: 'Standard Pricing' },
      generic: { variant: 'outline', label: 'Generic/Low Pricing' },
    };
    return variants[pricingPotential] || null;
  };

  const unmetNeed = getUnmetNeedLevel();
  const pricingBadge = getPricingBadge();

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-brand-teal/10 to-brand-yellow/5 border-b border-brand-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-teal" />
            <h3 className="font-semibold text-text-primary">Market Data</h3>
          </div>
          <div className="flex items-center gap-2">
            {isEstimated && (
              <Badge variant="outline" size="sm">
                <AlertCircle className="w-3 h-3 mr-1" />
                Estimated
              </Badge>
            )}
            <Badge variant={dataCompleteness >= 0.7 ? 'success' : 'warning'} size="sm">
              {Math.round(dataCompleteness * 100)}% complete
            </Badge>
          </div>
        </div>
        {indication && (
          <p className="text-sm text-text-muted mt-1">
            Market analysis for <span className="text-text-primary">{indication}</span>
          </p>
        )}
      </div>

      {/* Data Rows */}
      <div className="divide-y divide-brand-dark">
        {/* Market Size */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Banknote className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Market Size</p>
              <p className="text-xs text-text-muted">Global addressable market</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">
              {formatBillions(marketSizeBillions)}
            </p>
            <p className="text-xs text-text-muted">USD</p>
          </div>
        </motion.div>

        {/* CAGR */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-yellow" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Growth Rate (CAGR)</p>
              <p className="text-xs text-text-muted">Compound annual growth</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            {getTrendIcon()}
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {formatPercent(cagrPercent)}
              </p>
              <p className="text-xs text-text-muted">per year</p>
            </div>
          </div>
        </motion.div>

        {/* Patient Population */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Patient Population</p>
              <p className="text-xs text-text-muted">Global affected population</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">
              {formatMillions(patientPopMillions)}
            </p>
            <p className="text-xs text-text-muted">patients worldwide</p>
          </div>
        </motion.div>

        {/* Unmet Need */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', unmetNeed.bg)}>
              <Activity className={cn('w-5 h-5', unmetNeed.color)} />
            </div>
            <div>
              <p className="text-sm text-text-muted">Unmet Medical Need</p>
              <p className="text-xs text-text-muted">Treatment gap score</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">
              {unmetNeedScore ? Math.round(unmetNeedScore) : '—'}<span className="text-lg text-text-muted">/100</span>
            </p>
            <Badge variant="outline" size="sm" className={unmetNeed.color}>
              {unmetNeed.label}
            </Badge>
          </div>
        </motion.div>

        {/* Pricing Potential */}
        {pricingBadge && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Pricing Potential</p>
                <p className="text-xs text-text-muted">Expected pricing tier</p>
              </div>
            </div>
            <Badge variant={pricingBadge.variant} size="lg">
              {pricingBadge.label}
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Footer - Overall Score */}
      <div className="p-4 bg-brand-dark/50 border-t border-brand-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-teal" />
            <span className="text-sm text-text-muted">Market Opportunity Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-brand-dark rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="h-full bg-gradient-to-r from-brand-teal to-brand-yellow rounded-full"
              />
            </div>
            <span className="text-lg font-bold text-text-primary">{Math.round(score)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MarketDataCard;
