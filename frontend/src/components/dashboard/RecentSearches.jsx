import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Search, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { formatTimeAgo, formatDrugName } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

const RecentSearches = ({ searches = [], maxItems = 5, className }) => {
  const navigate = useNavigate();

  const handleSearchClick = (search) => {
    navigate(`${ROUTES.RESULTS}/${encodeURIComponent(search.drugName)}`);
  };

  if (searches.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Recent Searches</h3>
        </div>
        <div className="text-center py-8">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No recent searches</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(ROUTES.SEARCH)}
            className="mt-3"
          >
            Start a search
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Recent Searches</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.HISTORY)}
          rightIcon={ArrowRight}
        >
          View all
        </Button>
      </div>

      <div className="space-y-2">
        {searches.slice(0, maxItems).map((search, index) => (
          <motion.button
            key={`${search.drugName}-${search.timestamp}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleSearchClick(search)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-brand-darker hover:bg-brand-slate transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-brand-yellow" />
              </div>
              <div className="text-left">
                <p className="font-medium text-text-primary">
                  {formatDrugName(search.drugName)}
                </p>
                <p className="text-xs text-text-muted">
                  {search.opportunityCount || 0} opportunities • {formatTimeAgo(search.timestamp)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {search.cached && (
                <Badge variant="info" size="sm">Cached</Badge>
              )}
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </Card>
  );
};

export default RecentSearches;
