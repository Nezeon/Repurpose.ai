import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Pill, FlaskConical, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';
import Card from '../common/Card';
import Badge from '../common/Badge';

const phaseColors = {
  'Approved': 'success',
  'Phase 4': 'success',
  'Phase 3': 'warning',
  'Phase 2': 'info',
  'Phase 1': 'neutral',
  'Preclinical': 'neutral',
};

const CompetitorList = ({ competitors = [], className }) => {
  if (competitors.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Competitive Landscape</h3>
        </div>
        <p className="text-text-muted text-center py-8">
          No competitor data available
        </p>
      </Card>
    );
  }

  // Group by phase
  const approvedCount = competitors.filter(c => c.phase === 'Approved' || c.phase === 'Phase 4').length;
  const phase3Count = competitors.filter(c => c.phase === 'Phase 3').length;
  const earlyCount = competitors.length - approvedCount - phase3Count;

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-yellow" />
          <h3 className="font-semibold text-text-primary">Competitive Landscape</h3>
        </div>
        <span className="text-sm text-text-muted">
          {competitors.length} competitors
        </span>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {approvedCount > 0 && (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            {approvedCount} Approved
          </Badge>
        )}
        {phase3Count > 0 && (
          <Badge variant="warning">
            <FlaskConical className="w-3 h-3 mr-1" />
            {phase3Count} Phase 3
          </Badge>
        )}
        {earlyCount > 0 && (
          <Badge variant="neutral">
            {earlyCount} Early Stage
          </Badge>
        )}
      </div>

      {/* Competitor list */}
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {competitors.slice(0, 10).map((competitor, index) => (
          <motion.div
            key={`${competitor.company}-${competitor.drug}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-brand-darker"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-brand-slate rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-text-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {competitor.drug || 'Unknown Drug'}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {competitor.company || 'Unknown Company'}
                </p>
              </div>
            </div>
            <Badge
              variant={phaseColors[competitor.phase] || 'neutral'}
              size="sm"
            >
              {competitor.phase || 'Unknown'}
            </Badge>
          </motion.div>
        ))}

        {competitors.length > 10 && (
          <p className="text-center text-sm text-text-muted py-2">
            +{competitors.length - 10} more competitors
          </p>
        )}
      </div>
    </Card>
  );
};

export default CompetitorList;
