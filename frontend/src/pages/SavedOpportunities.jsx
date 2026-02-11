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
  StickyNote,
  ChevronDown,
} from 'lucide-react';
import useAppStore from '../store';
import { ROUTES } from '../utils/constants';
import { formatTimeAgo, formatDrugName, formatScore } from '../utils/formatters';
import { sortBy, groupBy } from '../utils/helpers';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import { CompositeScoreRing } from '../components/scoring';
import { OpportunityDetailPanel } from '../components/results';

const STATUS_OPTIONS = [
  { value: 'none', label: 'No Status', color: '#64748B' },
  { value: 'investigating', label: 'Investigating', color: '#00B4D8' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#FFE600' },
  { value: 'in_development', label: 'In Development', color: '#10B981' },
  { value: 'deprioritized', label: 'Deprioritized', color: '#94A3B8' },
];

const SavedOpportunities = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByField, setSortByField] = useState('savedAt');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingOpportunity, setViewingOpportunity] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  const {
    savedOpportunities,
    removeOpportunity,
    saveOpportunity,
    updateOpportunityStatus,
    updateOpportunityNotes,
  } = useAppStore();

  const toggleNotes = (id) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter and sort
  let filteredOpportunities = savedOpportunities;
  if (searchQuery) {
    filteredOpportunities = filteredOpportunities.filter(
      (opp) =>
        opp.indication.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.drugName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (filterStatus !== 'all') {
    filteredOpportunities = filteredOpportunities.filter(
      (opp) => (opp.status || 'none') === filterStatus
    );
  }

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
        <EmptyState
          variant="saved"
          title="No Saved Opportunities"
          description="Bookmark promising opportunities from search results to track and manage them here."
          actionLabel="Start a Search"
          onAction={() => navigate(ROUTES.SEARCH)}
        />
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-brand-darker border border-brand-border rounded-lg text-sm text-text-secondary focus:outline-none focus:border-brand-yellow/50"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
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
                        className="group cursor-pointer"
                      >
                        <div className="flex items-start justify-between" onClick={() => handleViewOpportunity(opp)}>
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-text-primary truncate">
                                {opp.indication}
                              </h4>
                              {/* Status badge */}
                              {opp.status && opp.status !== 'none' && (() => {
                                const st = STATUS_OPTIONS.find(s => s.value === opp.status);
                                return st ? (
                                  <span
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                                    style={{ backgroundColor: `${st.color}20`, color: st.color }}
                                  >
                                    {st.label}
                                  </span>
                                ) : null;
                              })()}
                            </div>
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

                        {/* Status + Notes row */}
                        <div className="mt-3 pt-3 border-t border-brand-border/50 flex items-center gap-2">
                          <select
                            value={opp.status || 'none'}
                            onChange={(e) => { e.stopPropagation(); updateOpportunityStatus(opp.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 bg-brand-darker border border-brand-border rounded-md text-[11px] text-text-secondary focus:outline-none focus:border-brand-yellow/50 cursor-pointer"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleNotes(opp.id); }}
                            className={cn(
                              'flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition-colors',
                              expandedNotes.has(opp.id)
                                ? 'text-brand-yellow bg-brand-yellow/10'
                                : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                            )}
                          >
                            <StickyNote className="w-3 h-3" />
                            {opp.notes ? 'Notes' : 'Add Note'}
                          </button>
                          <div className="flex-1" />
                          <button
                            onClick={(e) => handleRemove(opp, e)}
                            className="text-[11px] text-text-muted hover:text-error transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleGoToResults(opp, e)}
                            className="text-[11px] text-text-muted hover:text-brand-teal transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <span
                            onClick={() => handleViewOpportunity(opp)}
                            className="text-[11px] text-brand-yellow flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            View
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>

                        {/* Expandable notes */}
                        <AnimatePresence>
                          {expandedNotes.has(opp.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <textarea
                                value={opp.notes || ''}
                                onChange={(e) => updateOpportunityNotes(opp.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Add notes about this opportunity..."
                                className="mt-2 w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-yellow/50 resize-none"
                                rows={3}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
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
