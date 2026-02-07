import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { getConfidenceColor } from '../../utils/formatters';

const sizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
  xl: 'h-4',
};

const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  color,
  showLabel = false,
  labelPosition = 'right',
  animated = true,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const barColor = color || getConfidenceColor(percentage);

  return (
    <div
      className={cn('flex items-center gap-3', className)}
      {...props}
    >
      {showLabel && labelPosition === 'left' && (
        <span className="text-sm font-medium text-text-secondary min-w-[3rem] text-right">
          {Math.round(percentage)}%
        </span>
      )}

      <div
        className={cn(
          'flex-1 bg-brand-border rounded-full overflow-hidden',
          sizes[size]
        )}
      >
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full')}
          style={{ backgroundColor: barColor }}
        />
      </div>

      {showLabel && labelPosition === 'right' && (
        <span className="text-sm font-medium text-text-secondary min-w-[3rem]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

// Segmented progress bar for multi-step processes
ProgressBar.Segmented = ({
  current = 0,
  total = 5,
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('flex gap-1', className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-full transition-colors duration-300',
            sizes[size],
            i < current
              ? 'bg-brand-teal'
              : i === current
              ? 'bg-brand-yellow animate-pulse'
              : 'bg-brand-border'
          )}
        />
      ))}
    </div>
  );
};

// Circular progress indicator
ProgressBar.Circular = ({
  value = 0,
  max = 100,
  size = 48,
  strokeWidth = 4,
  color,
  showLabel = true,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const barColor = color || getConfidenceColor(percentage);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-brand-border"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={barColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-medium"
          style={{ color: barColor }}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
