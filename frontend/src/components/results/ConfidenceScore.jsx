/**
 * ConfidenceScore Component
 * Visual gauge for confidence scores (0-100)
 * EY Healthcare Theme
 */

import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const ConfidenceScore = ({ score, size = 'md', showLabel = true }) => {
  // Determine color based on score - using theme colors
  const getScoreColor = () => {
    if (score >= 80) return {
      stroke: '#00C853', // health-green
      text: 'text-health-green',
      bg: 'bg-health-green/10',
      border: 'border-health-green/30'
    };
    if (score >= 60) return {
      stroke: '#00A8B5', // health-teal
      text: 'text-health-teal',
      bg: 'bg-health-teal/10',
      border: 'border-health-teal/30'
    };
    if (score >= 40) return {
      stroke: '#FFE600', // brand-yellow
      text: 'text-brand-yellow',
      bg: 'bg-brand-yellow/10',
      border: 'border-brand-yellow/30'
    };
    return {
      stroke: '#FF4444', // red
      text: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/30'
    };
  };

  const getScoreLabel = () => {
    if (score >= 80) return { text: 'High', icon: CheckCircle2 };
    if (score >= 60) return { text: 'Moderate', icon: TrendingUp };
    if (score >= 40) return { text: 'Low', icon: AlertTriangle };
    return { text: 'Very Low', icon: AlertCircle };
  };

  const colors = getScoreColor();
  const label = getScoreLabel();
  const Icon = label.icon;

  // Size configurations
  const sizes = {
    sm: { circle: 'w-14 h-14', text: 'text-base', icon: 'w-3 h-3', labelText: 'text-xs' },
    md: { circle: 'w-20 h-20', text: 'text-xl', icon: 'w-4 h-4', labelText: 'text-sm' },
    lg: { circle: 'w-28 h-28', text: 'text-2xl', icon: 'w-5 h-5', labelText: 'text-sm' },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center">
      {/* Circular gauge */}
      <div className="relative">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-lg opacity-30"
          style={{ backgroundColor: colors.stroke }}
        />

        {/* Background circle */}
        <svg
          className={`${sizeConfig.circle} transform -rotate-90 relative`}
          viewBox="0 0 100 100"
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#2E2E38"
            strokeWidth="8"
          />

          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 264} 264`}
            style={{
              transition: 'stroke-dasharray 1s ease-in-out',
              filter: `drop-shadow(0 0 6px ${colors.stroke}40)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${sizeConfig.text} ${colors.text}`}>
            {Math.round(score)}
          </div>
          {size !== 'sm' && (
            <div className="text-[10px] text-gray-500 -mt-0.5">/ 100</div>
          )}
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
          <Icon className={`${sizeConfig.icon} ${colors.text}`} />
          <span className={`${sizeConfig.labelText} font-medium ${colors.text}`}>
            {label.text}
          </span>
        </div>
      )}
    </div>
  );
};

export default ConfidenceScore;
