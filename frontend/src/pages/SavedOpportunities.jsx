import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Search,
  Trash2,
  ExternalLink,
  Calendar,
  ChevronRight,
  Eye,
} from 'lucide-react';
import useAppStore from '../store';
import { ROUTES } from '../utils/constants';
import { formatTimeAgo, formatDrugName, formatScore } from '../utils/formatters';
import { sortBy, groupBy } from '../utils/helpers';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SearchInput from '../components/common/SearchInput';
import { CompositeScoreRing } from '../components/scoring';
import { OpportunityDetailPanel } from '../components/results';

const SavedOpportunities = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByField, setSortByField] = useState('savedAt');
  const [viewingOpportunity, setViewingOpportunity] = useState(null);

  const { savedOpportunities, removeOpportunity, saveOpportunity } = useAppStore();

  // Filter and sort
  const filteredOpportunities = searchQuery
    ? savedOpportunities.filter(
        (opp) =>
          opp.indication.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.drugName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedOpportunities;

  const sortedOpportunities = sortBy(
    filteredOpportunities,
    sortByField === 'score'
      ? 'composite_score.overall_score'
      : sortByField,
    'desc'
  );

  // Group by drug
  const groupedByDrug = groupBy(sortedOpportunities, 'drugName');

  const handleViewOpportunity = (opp) => {
    // View saved data in-place without re-searching
    setViewingOpportunity(opp);
  };

  const handleRemove = (opp, e) => {
    e.stopPropagation();
    removeOpportunity(opp.id);
  };

  const handleSaveOpportunity = (opportunity) => {
    const opp = viewingOpportunity;
    if (!opp) return;
    // Toggle - if already saved, remove it
    removeOpportunity(opp.id);
    setViewingOpportunity(null);
  };

  const handleGoToResults = (opp, e) => {
    e.stopPropagation();
    navigate(`${ROUTES.RESULTS}/${encodeURIComponent(opp.drugName)}`);
  };

  if (savedOpportunities.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-brand-slate rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            No Saved Opportunities
          </h2>
          <p className="text-text-secondary mb-6">
            Bookmark opportunities from search results to save them here
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.SEARCH)}
            leftIcon={Search}
          >
            Start a Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Saved Opportunities</h1>
          <p className="text-text-secondary">
            {savedOpportunities.length} bookmarked items
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter..."
            size="sm"
            className="w-48"
          />
          <select
            value={sortByField}
            onChange={(e) => setSortByField(e.target.value)}
            className="px-3 py-2 bg-brand-darker border border-brand-border rounded-lg text-sm text-text-secondary focus:outline-none focus:border-brand-yellow/50"
          >
            <option value="savedAt">Recently Saved</option>
            <option value="score">Highest Score</option>
            <option value="indication">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Grouped view */}
      <div className="space-y-8">
        {Object.entries(groupedByDrug).map(([drugName, opportunities]) => (
          <div key={drugName}>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-yellow rounded-full" />
              {formatDrugName(drugName)} ({opportunities.length})
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <AnimatePresence>
                {opportunities.map((opp, index) => {
                  const score = opp.composite_score?.overall_score || opp.confidence_score || 0;
                  return (
                    <motion.div
                      key={opp.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        hover
                        onClick={() => handleViewOpportunity(opp)}
                        className="group cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <h4 className="font-semibold text-text-primary mb-1 truncate">
                              {opp.indication}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Saved {formatTimeAgo(opp.savedAt)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="teal" size="sm">
                                {opp.evidence_count || 0} evidence
                              </Badge>
                              {opp.supporting_sources?.length > 0 && (
                                <Badge variant="neutral" size="sm">
                                  {opp.supporting_sources.length} sources
                                </Badge>
                              )}
                            </div>
                          </div>

                          <CompositeScoreRing score={score} size="sm" animated={false} />
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between">
                          <button
                            onClick={(e) => handleRemove(opp, e)}
                            className="text-sm text-text-muted hover:text-error transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => handleGoToResults(opp, e)}
                              className="text-sm text-text-muted hover:text-brand-teal transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Re-analyze
                            </button>
                            <span className="text-sm text-brand-yellow flex items-center gap-1 group-hover:gap-2 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                              View saved
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {sortedOpportunities.length === 0 && searchQuery && (
          <div className="text-center py-8 text-text-muted">
            No saved opportunities match "{searchQuery}"
          </div>
        )}
      </div>

      {/* Opportunity Detail Panel - shows saved data without re-searching */}
      <OpportunityDetailPanel
        isOpen={!!viewingOpportunity}
        onClose={() => setViewingOpportunity(null)}
        opportunity={viewingOpportunity}
        evidenceItems={viewingOpportunity?.savedEvidence || []}
        drugName={viewingOpportunity?.drugName}
        onSave={handleSaveOpportunity}
        isSaved={true}
      />
    </div>
  );
};

export default SavedOpportunities;
