import React from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, TrendingUp, Users, Settings, Info } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { DIMENSION_CONFIG } from '../../utils/constants';
import { formatScore, formatPercentage } from '../../utils/formatters';
import Card from '../common/Card';
import DimensionBar from './DimensionBar';
import Tooltip from '../common/Tooltip';

const icons = {
  FlaskConical,
  TrendingUp,
  Users,
  Settings,
};

const ScoreBreakdown = ({ compositeScore, className }) => {
  if (!compositeScore) return null;

  const dimensions = [
    { key: 'scientific_evidence', data: compositeScore.scientific_evidence },
    { key: 'market_opportunity', data: compositeScore.market_opportunity },
    { key: 'competitive_landscape', data: compositeScore.competitive_landscape },
    { key: 'development_feasibility', data: compositeScore.development_feasibility },
  ];

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Score Breakdown</h3>
        <Tooltip content="Weighted composite of 4 scoring dimensions">
          <Info className="w-4 h-4 text-text-muted cursor-help" />
        </Tooltip>
      </div>

      <div className="space-y-4">
        {dimensions.map((dim, index) => {
          const config = DIMENSION_CONFIG[dim.key];
          const Icon = icons[config.icon];
          const data = dim.data || {};

          return (
            <motion.div
              key={dim.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <DimensionBar
                icon={Icon}
                label={config.shortLabel}
                score={data.score || 0}
                weight={config.weight}
                weightedScore={data.weighted_score || 0}
                color={config.color}
                description={config.description}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-brand-border">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Composite Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-yellow">
              {formatScore(compositeScore.overall_score)}
            </span>
            <span className="text-sm text-text-muted">/ 100</span>
          </div>
        </div>
      </div>

      {/* Data completeness */}
      {compositeScore.data_completeness !== undefined && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-text-muted">Data Completeness</span>
          <span className="text-text-secondary">
            {formatPercentage(compositeScore.data_completeness, 0, true)}
          </span>
        </div>
      )}
    </Card>
  );
};

export default ScoreBreakdown;
