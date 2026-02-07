import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  FlaskConical,
  TrendingUp,
  Users,
  Settings,
  Eye,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { DIMENSION_CONFIG, EVIDENCE_SOURCES } from '../../utils/constants';
import { formatScore, getConfidenceLevel } from '../../utils/formatters';
import CompositeScoreRing from '../scoring/CompositeScoreRing';
import Badge from '../common/Badge';
import Tooltip from '../common/Tooltip';

// Rank icons
const rankIcons = {
  1: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
  2: { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/20' },
  3: { icon: Award, color: 'text-orange-400', bg: 'bg-orange-400/20' },
};

const dimensionIcons = {
  scientific_evidence: FlaskConical,
  market_opportunity: TrendingUp,
  competitive_landscape: Users,
  development_feasibility: Settings,
};

const OpportunityCard = ({
  opportunity,
  rank,
  isSelected = false,
  isSaved = false,
  onClick,
  onSave,
  onViewDetails,
  className,
}) => {
  const { indication, confidence_score, composite_score, evidence_count, supporting_sources } = opportunity;
  const score = composite_score?.overall_score || confidence_score || 0;
  const confidenceLevel = getConfidenceLevel(score);
  const rankConfig = rankIcons[rank];

  // Get dimension scores
  const dimensions = [
    { key: 'scientific_evidence', score: composite_score?.scientific_evidence?.score },
    { key: 'market_opportunity', score: composite_score?.market_opportunity?.score },
    { key: 'competitive_landscape', score: composite_score?.competitive_landscape?.score },
    { key: 'development_feasibility', score: composite_score?.development_feasibility?.score },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={cn(
        'relative p-5 rounded-xl border cursor-pointer transition-all duration-300',
        isSelected
          ? 'border-brand-yellow/50 bg-brand-yellow/5 shadow-glow-sm'
          : 'border-brand-border bg-brand-slate/50 hover:border-brand-yellow/30 hover:shadow-glow-sm',
        className
      )}
    >
      {/* Rank badge (for top 3) */}
      {rankConfig && (
        <div
          className={cn(
            'absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center',
            rankConfig.bg
          )}
        >
          <rankConfig.icon className={cn('w-4 h-4', rankConfig.color)} />
        </div>
      )}

      <div className="flex items-start gap-5">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                {rank && (
                  <span className="text-xs font-bold text-text-muted">#{rank}</span>
                )}
                <h3 className="text-lg font-semibold text-text-primary truncate">
                  {indication}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={confidenceLevel.label === 'Very High' ? 'teal' :
                          confidenceLevel.label === 'High' ? 'success' :
                          confidenceLevel.label === 'Moderate' ? 'warning' : 'error'}
                  size="sm"
                >
                  {confidenceLevel.label}
                </Badge>
                <span className="text-sm text-text-muted">
                  {evidence_count} evidence items
                </span>
              </div>
            </div>

            {/* Save button */}
            <Tooltip content={isSaved ? 'Saved' : 'Save opportunity'}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.(opportunity);
                }}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isSaved
                    ? 'text-brand-yellow bg-brand-yellow/10'
                    : 'text-text-muted hover:text-brand-yellow hover:bg-brand-yellow/10'
                )}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
            </Tooltip>
          </div>

          {/* Dimension score cards */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {dimensions.map((dim) => {
              const config = DIMENSION_CONFIG[dim.key];
              const Icon = dimensionIcons[dim.key];
              const dimScore = dim.score || 0;

              return (
                <Tooltip key={dim.key} content={`${config.label}: ${formatScore(dimScore, 0)}%`}>
                  <div className="bg-brand-darker rounded-lg p-2.5">
                    <div className="flex flex-col items-center gap-1">
                      {/* Icon */}
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                      {/* Short label */}
                      <span className="text-[10px] text-text-muted truncate w-full text-center leading-tight">
                        {config.shortLabel}
                      </span>
                      {/* Score */}
                      <span className="text-sm font-bold" style={{ color: config.color }}>
                        {formatScore(dimScore, 0)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-brand-border rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${dimScore}%`,
                          backgroundColor: config.color,
                        }}
                      />
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>

          {/* Sources and View Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Sources:</span>
              <div className="flex flex-wrap gap-1">
                {supporting_sources?.slice(0, 4).map((source) => {
                  const sourceConfig = EVIDENCE_SOURCES[source];
                  return (
                    <span
                      key={source}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-brand-darker text-text-muted"
                    >
                      {sourceConfig?.label || source}
                    </span>
                  );
                })}
                {supporting_sources?.length > 4 && (
                  <span className="text-[10px] text-text-muted">
                    +{supporting_sources.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* View Details button */}
            {onViewDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(opportunity);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-teal hover:text-brand-yellow bg-brand-teal/10 hover:bg-brand-yellow/10 rounded-lg transition-colors"
              >
                <Eye className="w-3 h-3" />
                View Details
              </button>
            )}
          </div>
        </div>

        {/* Score ring */}
        <div className="flex-shrink-0">
          <CompositeScoreRing score={score} size="md" />
        </div>
      </div>

      {/* View details indicator */}
      <div className="absolute bottom-3 right-3">
        <ChevronRight className="w-4 h-4 text-text-muted" />
      </div>
    </motion.div>
  );
};

export default OpportunityCard;
