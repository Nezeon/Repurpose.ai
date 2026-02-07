import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SortDesc, SortAsc, Search } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { CONFIDENCE_LEVELS } from '../../utils/constants';
import OpportunityCard from './OpportunityCard';
import SearchInput from '../common/SearchInput';
import Button from '../common/Button';
import Skeleton from '../common/Skeleton';

const sortOptions = [
  { id: 'score_desc', label: 'Highest Score', icon: SortDesc },
  { id: 'score_asc', label: 'Lowest Score', icon: SortAsc },
  { id: 'evidence_desc', label: 'Most Evidence', icon: SortDesc },
  { id: 'alpha_asc', label: 'A-Z', icon: SortAsc },
];

const filterOptions = [
  { id: 'all', label: 'All', color: 'text-text-secondary' },
  { id: 'veryHigh', label: 'Very High', color: 'text-confidence-veryHigh' },
  { id: 'high', label: 'High', color: 'text-confidence-high' },
  { id: 'moderate', label: 'Moderate', color: 'text-confidence-moderate' },
  { id: 'low', label: 'Low+', color: 'text-confidence-low' },
];

const OpportunityList = ({
  opportunities = [],
  selectedId,
  savedIds = [],
  onSelect,
  onSave,
  onViewDetails,
  loading = false,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score_desc');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    let result = [...opportunities];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((opp) =>
        opp.indication.toLowerCase().includes(query)
      );
    }

    // Filter by confidence level
    if (filterBy !== 'all') {
      const minScore = CONFIDENCE_LEVELS[filterBy]?.min || 0;
      result = result.filter((opp) => {
        const score = opp.composite_score?.overall_score || opp.confidence_score || 0;
        return score >= minScore;
      });
    }

    // Sort
    result.sort((a, b) => {
      const scoreA = a.composite_score?.overall_score || a.confidence_score || 0;
      const scoreB = b.composite_score?.overall_score || b.confidence_score || 0;

      switch (sortBy) {
        case 'score_desc':
          return scoreB - scoreA;
        case 'score_asc':
          return scoreA - scoreB;
        case 'evidence_desc':
          return (b.evidence_count || 0) - (a.evidence_count || 0);
        case 'alpha_asc':
          return a.indication.localeCompare(b.indication);
        default:
          return scoreB - scoreA;
      }
    });

    return result;
  }, [opportunities, searchQuery, sortBy, filterBy]);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton.OpportunityCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="w-full sm:w-64">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter indications..."
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={Filter}
          >
            Filter
          </Button>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-brand-darker border border-brand-border rounded-lg text-sm text-text-secondary focus:outline-none focus:border-brand-yellow/50"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter pills */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-brand-border">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFilterBy(option.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    filterBy === option.id
                      ? 'bg-brand-yellow/20 text-brand-yellow'
                      : 'bg-brand-darker text-text-secondary hover:text-text-primary'
                  )}
                >
                  <span className={filterBy === option.id ? '' : option.color}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <p className="text-sm text-text-muted mb-4">
        Showing {filteredOpportunities.length} of {opportunities.length} opportunities
      </p>

      {/* Opportunity cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredOpportunities.map((opportunity, index) => (
            <OpportunityCard
              key={opportunity.indication}
              opportunity={opportunity}
              rank={index + 1}
              isSelected={selectedId === opportunity.indication}
              isSaved={savedIds.includes(opportunity.indication)}
              onClick={() => onSelect?.(opportunity)}
              onSave={onSave}
              onViewDetails={onViewDetails}
            />
          ))}
        </AnimatePresence>

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No opportunities match your filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterBy('all');
              }}
              className="mt-2 text-sm text-brand-yellow hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityList;
