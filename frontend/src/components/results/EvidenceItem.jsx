import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  Star,
  BookOpen,
  Stethoscope,
  Dna,
  FileText,
  Database,
  Shield,
  Target,
  GraduationCap,
  Pill,
  GitBranch,
  Atom,
  Book,
  Layers,
  Globe,
  Boxes,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { EVIDENCE_SOURCES } from '../../utils/constants';
import { formatDate, formatScore, truncateText } from '../../utils/formatters';
import Badge from '../common/Badge';

// Icon mapping
const icons = {
  BookOpen,
  Stethoscope,
  Dna,
  FileText,
  Database,
  Shield,
  Target,
  GraduationCap,
  Pill,
  GitBranch,
  Atom,
  Book,
  Layers,
  Globe,
  Boxes,
};

const EvidenceItem = ({ evidence, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sourceConfig = EVIDENCE_SOURCES[evidence.source] || {};
  const Icon = icons[sourceConfig.icon] || Database;

  const hasMoreContent =
    evidence.summary?.length > 150 ||
    evidence.metadata ||
    evidence.url;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-brand-border bg-brand-slate/30 transition-colors',
        'hover:border-brand-border/80',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${sourceConfig.color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: sourceConfig.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="neutral"
              size="sm"
              style={{ backgroundColor: `${sourceConfig.color}20`, color: sourceConfig.color }}
            >
              {sourceConfig.label || evidence.source}
            </Badge>

            {evidence.relevance_score && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Star className="w-3 h-3" />
                <span>{formatScore(evidence.relevance_score * 100, 0)}%</span>
              </div>
            )}

            {evidence.date && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(evidence.date)}</span>
              </div>
            )}
          </div>

          {/* Title */}
          {evidence.title && (
            <h4 className="font-medium text-text-primary mb-1">
              {truncateText(evidence.title, 100)}
            </h4>
          )}

          {/* Summary */}
          <p className="text-sm text-text-secondary leading-relaxed">
            {isExpanded
              ? evidence.summary
              : truncateText(evidence.summary, 150)}
          </p>

          {/* Expand/collapse for long content */}
          {hasMoreContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-2 text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show more
                </>
              )}
            </button>
          )}

          {/* Expanded content */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-brand-border"
            >
              {/* Metadata */}
              {evidence.metadata && Object.keys(evidence.metadata).length > 0 && (
                <div className="mb-3">
                  <h5 className="text-xs font-semibold text-text-muted mb-2">Details</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(evidence.metadata).slice(0, 6).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-text-muted capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>{' '}
                        <span className="text-text-secondary">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External link */}
              {evidence.url && (
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View source
                </a>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceItem;
