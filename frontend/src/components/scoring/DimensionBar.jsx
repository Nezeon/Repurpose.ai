import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { formatScore, formatPercentage } from '../../utils/formatters';
import Tooltip from '../common/Tooltip';

const DimensionBar = ({
  icon: Icon,
  label,
  score,
  weight,
  weightedScore,
  color,
  description,
  showWeighted = true,
  className,
}) => {
  const percentage = Math.min(Math.max(score, 0), 100);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Tooltip content={description} position="right">
          <div className="flex items-center gap-2 cursor-help">
            {Icon && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            )}
            <div>
              <span className="font-medium text-text-primary">{label}</span>
              <span className="text-xs text-text-muted ml-2">
                ({formatPercentage(weight, 0, true)} weight)
              </span>
            </div>
          </div>
        </Tooltip>

        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-text-primary" style={{ color }}>
            {formatScore(score, 0)}
          </span>
          {showWeighted && weightedScore !== undefined && (
            <span className="text-xs text-text-muted">
              (+{formatScore(weightedScore, 1)})
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-brand-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
    </div>
  );
};

export default DimensionBar;
