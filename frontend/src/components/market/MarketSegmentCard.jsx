import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Zap,
  PieChart,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { cn } from '../../utils/helpers';

/**
 * MarketSegmentCard - Displays specific market segment information
 * Shows: segment name, size, patient population, unmet need, target profile
 */
const MarketSegmentCard = ({ segment, parentIndication }) => {
  if (!segment) {
    return (
      <Card className="p-5">
        <div className="text-center py-4">
          <Target className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Market segment analysis not available</p>
        </div>
      </Card>
    );
  }

  const {
    segment_name,
    parent_indication,
    segment_size_billions,
    total_indication_size_billions,
    segment_share_percent,
    patient_subpopulation,
    total_indication_population,
    unmet_need_level,
    unmet_need_description,
    target_patient_profile,
    key_differentiators = [],
    growth_rate_percent,
    competitive_intensity,
  } = segment;

  // Get unmet need badge variant
  const getUnmetNeedVariant = (level) => {
    const variants = {
      very_high: 'error',
      high: 'warning',
      moderate: 'outline',
      low: 'success',
    };
    return variants[level] || 'outline';
  };

  // Get competitive intensity color
  const getCompetitiveColor = (intensity) => {
    const colors = {
      high: 'text-red-400',
      medium: 'text-yellow-400',
      low: 'text-green-400',
    };
    return colors[intensity] || 'text-text-muted';
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-brand-darker to-brand-dark border-brand-teal/20">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success" size="sm" className="uppercase text-xs tracking-wide">
              Target Segment
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-text-primary">{segment_name}</h3>
          <p className="text-sm text-text-muted">
            within {parent_indication || parentIndication}
          </p>
        </div>
        <div className="text-right">
          {growth_rate_percent && (
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">{growth_rate_percent}%</span>
              <span className="text-xs text-text-muted">CAGR</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Segment Size */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 bg-brand-darker/50 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-brand-yellow" />
            <span className="text-xs text-text-muted">Segment Size</span>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {segment_size_billions ? `$${segment_size_billions}B` : 'N/A'}
          </p>
          {total_indication_size_billions && (
            <p className="text-xs text-text-muted">
              of ${total_indication_size_billions}B total
            </p>
          )}
        </motion.div>

        {/* Segment Share */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-3 bg-brand-darker/50 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-text-muted">Market Share</span>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {segment_share_percent ? `${segment_share_percent}%` : 'N/A'}
          </p>
          <p className="text-xs text-text-muted">of indication market</p>
        </motion.div>

        {/* Patient Population */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3 bg-brand-darker/50 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-text-muted">Patients</span>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {formatNumber(patient_subpopulation)}
          </p>
          {total_indication_population && (
            <p className="text-xs text-text-muted">
              of {formatNumber(total_indication_population)} total
            </p>
          )}
        </motion.div>

        {/* Competition */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-3 bg-brand-darker/50 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-text-muted">Competition</span>
          </div>
          <p className={cn('text-xl font-bold capitalize', getCompetitiveColor(competitive_intensity))}>
            {competitive_intensity || 'Unknown'}
          </p>
          <p className="text-xs text-text-muted">intensity level</p>
        </motion.div>
      </div>

      {/* Unmet Need Section */}
      <div className="mb-6 p-4 bg-brand-darker rounded-lg border-l-4 border-brand-teal">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-teal" />
            <span className="text-sm font-medium text-text-primary">Unmet Need</span>
          </div>
          <Badge variant={getUnmetNeedVariant(unmet_need_level)} size="sm">
            {unmet_need_level?.replace('_', ' ').toUpperCase() || 'N/A'}
          </Badge>
        </div>
        <p className="text-sm text-text-secondary">
          {unmet_need_description || 'Unmet need analysis not available for this segment'}
        </p>
      </div>

      {/* Target Patient Profile */}
      {target_patient_profile && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-yellow" />
            Target Patient Profile
          </h4>
          <p className="text-sm text-text-secondary bg-brand-darker/50 p-3 rounded-lg">
            {target_patient_profile}
          </p>
        </div>
      )}

      {/* Key Differentiators */}
      {key_differentiators.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Key Differentiators for This Segment
          </h4>
          <div className="space-y-2">
            {key_differentiators.map((diff, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-text-secondary">{diff}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Market Share Bar */}
      {segment_share_percent && (
        <div className="mt-6 pt-4 border-t border-brand-dark">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Segment Share of Total Market</span>
            <span>{segment_share_percent}%</span>
          </div>
          <div className="w-full h-3 bg-brand-dark rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${segment_share_percent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-brand-teal to-brand-yellow rounded-full"
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default MarketSegmentCard;
