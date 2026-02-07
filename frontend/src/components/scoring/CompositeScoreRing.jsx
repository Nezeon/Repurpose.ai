import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { getConfidenceColor, getConfidenceLabel } from '../../utils/formatters';

const sizes = {
  sm: {
    size: 48,
    strokeWidth: 4,
    fontSize: 'text-sm',
    labelSize: 'text-[8px]',
  },
  md: {
    size: 80,
    strokeWidth: 5,
    fontSize: 'text-xl',
    labelSize: 'text-[10px]',
  },
  lg: {
    size: 120,
    strokeWidth: 6,
    fontSize: 'text-3xl',
    labelSize: 'text-xs',
  },
  xl: {
    size: 160,
    strokeWidth: 8,
    fontSize: 'text-4xl',
    labelSize: 'text-sm',
  },
};

const CompositeScoreRing = ({
  score = 0,
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  glowEffect = true,
  className,
}) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const config = sizes[size];
  const color = getConfidenceColor(score);
  const confidenceLabel = label || getConfidenceLabel(score);

  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  // Animate score counting
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000;
    const startTime = Date.now();
    const startScore = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentScore = startScore + (score - startScore) * easedProgress;

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  return (
    <div
      className={cn('relative inline-flex flex-col items-center', className)}
      style={{ width: config.size, height: config.size + (showLabel ? 20 : 0) }}
    >
      {/* Glow effect */}
      {glowEffect && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{
            backgroundColor: color,
            transform: 'scale(0.8)',
          }}
        />
      )}

      {/* SVG Ring */}
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-brand-border"
        />

        {/* Progress circle */}
        <motion.circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: glowEffect ? `drop-shadow(0 0 6px ${color})` : undefined,
          }}
        />
      </svg>

      {/* Score text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ width: config.size, height: config.size }}
      >
        <span
          className={cn('font-bold', config.fontSize)}
          style={{ color }}
        >
          {Math.round(displayScore)}
        </span>
        {size !== 'sm' && (
          <span className={cn('text-text-muted', config.labelSize)}>
            {confidenceLabel}
          </span>
        )}
      </div>

      {/* Label below */}
      {showLabel && (
        <span className="mt-2 text-xs text-text-secondary text-center">
          {confidenceLabel}
        </span>
      )}
    </div>
  );
};

export default CompositeScoreRing;
