import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bookmark, Clock, Dna, Sparkles } from 'lucide-react';
import { cn } from '../../utils/helpers';

const variants = {
  search: {
    icon: Search,
    color: '#FFE600',
    animation: 'animate-pulse',
    defaultTitle: 'No Results Yet',
    defaultDescription: 'Search for a drug to discover repurposing opportunities.',
  },
  saved: {
    icon: Bookmark,
    color: '#00D4AA',
    animation: 'animate-float',
    defaultTitle: 'No Saved Opportunities',
    defaultDescription: 'Save promising opportunities from your analyses to track them here.',
  },
  history: {
    icon: Clock,
    color: '#00B4D8',
    animation: 'animate-spin-slow',
    defaultTitle: 'No Search History',
    defaultDescription: 'Your past drug analyses will appear here.',
  },
  results: {
    icon: Dna,
    color: '#8B5CF6',
    animation: 'animate-pulse',
    defaultTitle: 'No Opportunities Found',
    defaultDescription: 'Try analyzing a different drug or broadening your search criteria.',
  },
  default: {
    icon: Sparkles,
    color: '#FFE600',
    animation: 'animate-pulse',
    defaultTitle: 'Nothing Here Yet',
    defaultDescription: 'Get started by exploring the platform.',
  },
};

const EmptyState = ({
  variant = 'default',
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  const config = variants[variant] || variants.default;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('flex flex-col items-center justify-center py-16 px-6', className)}
    >
      {/* Animated icon container */}
      <div className="relative mb-6">
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-20"
          style={{ backgroundColor: config.color }}
        />
        {/* Orbit rings */}
        <svg width="120" height="120" viewBox="0 0 120 120" className="relative">
          {/* Outer orbit */}
          <circle
            cx="60" cy="60" r="55"
            fill="none"
            stroke={config.color}
            strokeWidth="0.5"
            strokeOpacity="0.15"
            strokeDasharray="4 6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="20s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Middle orbit */}
          <circle
            cx="60" cy="60" r="40"
            fill="none"
            stroke={config.color}
            strokeWidth="0.5"
            strokeOpacity="0.1"
            strokeDasharray="3 8"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 60 60"
              to="0 60 60"
              dur="15s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Orbiting dots */}
          <circle cx="60" cy="5" r="2" fill={config.color} fillOpacity="0.4">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="20" cy="60" r="1.5" fill={config.color} fillOpacity="0.3">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="120 60 60"
              to="480 60 60"
              dur="12s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="60" cy="115" r="1" fill={config.color} fillOpacity="0.2">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="240 60 60"
              to="600 60 60"
              dur="16s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
        {/* Center icon */}
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${config.color}15` }}
          >
            <Icon
              className="w-7 h-7"
              style={{ color: config.color }}
            />
          </motion.div>
        </div>
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm text-text-muted text-center max-w-sm mb-6">
        {description || config.defaultDescription}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-colors"
          style={{
            backgroundColor: `${config.color}15`,
            color: config.color,
          }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
