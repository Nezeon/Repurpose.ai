import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { INSIGHT_CATEGORIES } from '../../utils/constants';

const icons = {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
};

const InsightCard = ({
  insight,
  index = 0,
  compact = false,
  className,
}) => {
  const category = INSIGHT_CATEGORIES[insight.category] || INSIGHT_CATEGORIES.recommendation;
  const Icon = icons[category.icon] || ArrowRight;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'flex items-start gap-2 py-2',
          className
        )}
      >
        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', category.color)} />
        <span className="text-sm text-text-secondary">{insight.title}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'p-4 rounded-xl border border-brand-border',
        category.bgColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            category.bgColor
          )}
        >
          <Icon className={cn('w-5 h-5', category.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-text-primary">{insight.title}</h4>
            {insight.severity && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium rounded uppercase',
                  insight.severity === 'high' && 'bg-error/20 text-error',
                  insight.severity === 'medium' && 'bg-warning/20 text-warning',
                  insight.severity === 'low' && 'bg-info/20 text-info'
                )}
              >
                {insight.severity}
              </span>
            )}
          </div>

          {insight.description && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {insight.description}
            </p>
          )}

          {insight.source_dimension && (
            <p className="mt-2 text-xs text-text-muted">
              Source: {insight.source_dimension.replace('_', ' ')}
            </p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
      </div>
    </motion.div>
  );
};

// Insights list component
InsightCard.List = ({ insights, category, title, compact = false, className }) => {
  const filteredInsights = category
    ? insights?.filter((i) => i.category === category)
    : insights;

  if (!filteredInsights?.length) return null;

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          {title}
        </h3>
      )}
      <div className={cn(compact ? 'divide-y divide-brand-border' : 'space-y-3')}>
        {filteredInsights.map((insight, index) => (
          <InsightCard
            key={`${insight.category}-${index}`}
            insight={insight}
            index={index}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

export default InsightCard;
