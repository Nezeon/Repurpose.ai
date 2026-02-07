import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { formatCompactNumber } from '../../utils/formatters';

const StatsCard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = '#FFE600',
  trend, // 'up', 'down', or 'neutral'
  loading = false,
  className,
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-muted';

  if (loading) {
    return (
      <div className={cn('card p-5', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-brand-border rounded w-20" />
          <div className="h-8 bg-brand-border rounded w-16" />
          <div className="h-3 bg-brand-border rounded w-24" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('card-hover p-5', className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">
            {typeof value === 'number' ? formatCompactNumber(value) : value}
          </p>

          {(change !== undefined || changeLabel) && (
            <div className="flex items-center gap-1.5 mt-2">
              {change !== undefined && (
                <>
                  <TrendIcon className={cn('w-3.5 h-3.5', trendColor)} />
                  <span className={cn('text-sm font-medium', trendColor)}>
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                </>
              )}
              {changeLabel && (
                <span className="text-xs text-text-muted">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon className="w-6 h-6" style={{ color: iconColor }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
