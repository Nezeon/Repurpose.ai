import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Trophy, Medal, Award } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { formatScore, getConfidenceColor } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import Card from '../common/Card';
import Button from '../common/Button';
import CompositeScoreRing from '../scoring/CompositeScoreRing';

const rankIcons = [Trophy, Medal, Award];
const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];

const TrendingOpportunities = ({ opportunities = [], className }) => {
  const navigate = useNavigate();

  if (opportunities.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-teal" />
          <h3 className="font-semibold text-text-primary">Top Opportunities</h3>
        </div>
        <div className="text-center py-8">
          <TrendingUp className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No opportunities yet</p>
          <p className="text-sm text-text-muted mt-1">
            Run a search to discover repurposing opportunities
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-teal" />
          <h3 className="font-semibold text-text-primary">Top Opportunities</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.SAVED)}
          rightIcon={ArrowRight}
        >
          View all
        </Button>
      </div>

      <div className="space-y-3">
        {opportunities.slice(0, 3).map((opp, index) => {
          const RankIcon = rankIcons[index];
          const score = opp.composite_score?.overall_score || opp.confidence_score || 0;

          return (
            <motion.div
              key={`${opp.drugName}-${opp.indication}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-lg bg-brand-darker hover:bg-brand-slate transition-colors cursor-pointer"
              onClick={() => navigate(`${ROUTES.RESULTS}/${encodeURIComponent(opp.drugName)}`)}
            >
              <div className="flex items-center justify-center w-8">
                <RankIcon className={cn('w-5 h-5', rankColors[index])} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">
                  {opp.indication}
                </p>
                <p className="text-sm text-text-muted truncate">
                  {opp.drugName} • {opp.evidence_count || 0} evidence
                </p>
              </div>

              <CompositeScoreRing score={score} size="sm" animated={false} />
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

export default TrendingOpportunities;
