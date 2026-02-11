import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  GitCompare, X, Plus, Search, ArrowRight,
  TrendingUp, Target, Shield, Beaker, Sparkles, AlertTriangle,
  Minus, Loader2, AlertCircle,
} from 'lucide-react';
import useAppStore from '../store';
import { formatDrugName, getConfidenceLevel } from '../utils/formatters';
import { ROUTES, DIMENSION_CONFIG } from '../utils/constants';
import { cn } from '../utils/helpers';
import Card from '../components/common/Card';
import { compareDrugs } from '../services/api';

const DIMENSION_ICONS = {
  scientific_evidence: Beaker,
  market_opportunity: TrendingUp,
  competitive_landscape: Shield,
  development_feasibility: Target,
};

const DIMENSION_COLORS = {
  scientific_evidence: '#00D4E8',
  market_opportunity: '#10B981',
  competitive_landscape: '#FBBF24',
  development_feasibility: '#8B5CF6',
};

const Compare = () => {
  const navigate = useNavigate();
  const { searchHistory } = useAppStore();
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);

  // Filter available drugs for selector
  const availableDrugs = useMemo(() => {
    const selected = new Set(selectedDrugs.map(d => d.drugName.toLowerCase()));
    let drugs = (searchHistory || []).filter(s => !selected.has(s.drugName.toLowerCase()));
    if (selectorSearch) {
      const q = selectorSearch.toLowerCase();
      drugs = drugs.filter(d => d.drugName.toLowerCase().includes(q));
    }
    return drugs;
  }, [searchHistory, selectedDrugs, selectorSearch]);

  const addDrug = (drug) => {
    if (selectedDrugs.length < 3) {
      setSelectedDrugs(prev => [...prev, drug]);
      setShowSelector(false);
      setSelectorSearch('');
    }
  };

  const removeDrug = (index) => {
    setSelectedDrugs(prev => prev.filter((_, i) => i !== index));
  };

  const canCompare = selectedDrugs.length >= 2;

  // Fetch comparison data from backend when drugs are selected
  useEffect(() => {
    if (!canCompare) {
      setComparisonResult(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchComparison = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const drugNames = selectedDrugs.map(d => d.drugName);
        const data = await compareDrugs(drugNames);

        if (cancelled) return;

        const drugs = data.drugs.map(drug => ({
          name: formatDrugName(drug.drug_name),
          drugName: drug.drug_name,
          opportunities: drug.indication_count,
          evidenceCount: drug.evidence_count,
          cached: drug.cached,
          hasScores: drug.scores.overall > 0,
          scores: drug.scores,
        }));

        setComparisonResult({
          drugs,
          overlapping_indications: data.overlapping_indications || [],
          unique_indications: data.unique_indications || {},
          comparison_summary: data.comparison_summary || '',
        });
      } catch (err) {
        if (cancelled) return;
        console.error('Comparison error:', err);
        setError(err.message || 'Failed to fetch comparison data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchComparison();

    return () => { cancelled = true; };
  }, [selectedDrugs, canCompare]);

  const hasMissingData = comparisonResult?.drugs?.some(d => !d.cached);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-brand-yellow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Drug Comparison</h1>
            <p className="text-sm text-text-secondary">Compare up to 3 drugs side-by-side</p>
          </div>
        </div>
      </motion.div>

      {/* Drug Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((slot) => {
          const drug = selectedDrugs[slot];
          return (
            <motion.div
              key={slot}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: slot * 0.05 }}
            >
              {drug ? (
                <Card className="p-4 border-brand-yellow/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm',
                        slot === 0 ? 'bg-brand-yellow/20 text-brand-yellow' :
                        slot === 1 ? 'bg-brand-teal/20 text-brand-teal' :
                        'bg-info/20 text-info'
                      )}>
                        {String.fromCharCode(65 + slot)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{formatDrugName(drug.drugName)}</p>
                        <p className="text-xs text-text-muted">{drug.opportunityCount || 0} opportunities</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDrug(slot)}
                      className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ) : (
                <button
                  onClick={() => setShowSelector(true)}
                  disabled={selectedDrugs.length >= 3}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center gap-2',
                    selectedDrugs.length < 3
                      ? 'border-brand-border hover:border-brand-yellow/50 hover:bg-brand-yellow/5 text-text-muted hover:text-text-primary cursor-pointer'
                      : 'border-brand-border/30 text-text-muted/30 cursor-not-allowed'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Drug {String.fromCharCode(65 + slot)}</span>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Drug selector dropdown */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Search className="w-4 h-4 text-text-muted" />
                <input
                  value={selectorSearch}
                  onChange={(e) => setSelectorSearch(e.target.value)}
                  placeholder="Search from your history..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                  autoFocus
                />
                <button onClick={() => { setShowSelector(false); setSelectorSearch(''); }} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {availableDrugs.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  {searchHistory?.length ? 'No matching drugs found' : 'No search history yet — analyze a drug first'}
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {availableDrugs.slice(0, 10).map((drug, i) => (
                    <button
                      key={i}
                      onClick={() => addDrug(drug)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-yellow/5 text-left transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-brand-yellow" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{formatDrugName(drug.drugName)}</p>
                        <p className="text-xs text-text-muted">{drug.opportunityCount || 0} opportunities</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Comparing Drugs...</h3>
            <p className="text-sm text-text-muted">
              Fetching scores and indications from cached results
            </p>
          </Card>
        </motion.div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-6 border-error/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-error mb-1">Comparison Failed</h3>
                <p className="text-xs text-text-muted">{error}</p>
                <p className="text-xs text-text-muted mt-2">
                  Make sure all selected drugs have been analyzed from the Search page first.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Comparison View */}
      {!isLoading && !error && canCompare && comparisonResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Missing data warning */}
          {hasMissingData && (
            <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <p className="text-xs text-warning">
                Some drugs don't have cached results. Analyze them from the Search page first for complete comparison data.
              </p>
            </div>
          )}

          {/* Overall Score Comparison */}
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-4">
              Overall Composite Scores
            </h3>
            <div className="space-y-4">
              {comparisonResult.drugs.map((drug, i) => {
                const score = drug.scores.overall || 0;
                const color = i === 0 ? '#FFE600' : i === 1 ? '#00D4AA' : '#00B4D8';
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-text-primary w-32 truncate">{drug.name}</span>
                    <div className="flex-1 h-8 bg-brand-darker rounded-lg overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-lg"
                        style={{ backgroundColor: `${color}30` }}
                      />
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold font-mono"
                        style={{ color }}
                      >
                        {score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Dimension Breakdown */}
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-4">
              4D Score Breakdown
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
                const Icon = DIMENSION_ICONS[key] || Target;
                const dimColor = DIMENSION_COLORS[key];
                return (
                  <div key={key} className="p-4 rounded-xl bg-brand-darker border border-brand-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4" style={{ color: dimColor }} />
                      <span className="text-xs font-semibold text-text-primary">{config.label}</span>
                      <span className="text-[10px] text-text-muted ml-auto">{config.weight}%</span>
                    </div>
                    <div className="space-y-2.5">
                      {comparisonResult.drugs.map((drug, i) => {
                        const dimScore = drug.scores[key] || 0;
                        const color = i === 0 ? '#FFE600' : i === 1 ? '#00D4AA' : '#00B4D8';
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-text-muted truncate max-w-[80px]">{drug.name}</span>
                              <span className="font-mono font-medium" style={{ color }}>{Math.round(dimScore)}</span>
                            </div>
                            <div className="h-1.5 bg-brand-dark rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${dimScore}%` }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Opportunity Count Comparison */}
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-4">
              Opportunity Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparisonResult.drugs.map((drug, i) => {
                const color = i === 0 ? '#FFE600' : i === 1 ? '#00D4AA' : '#00B4D8';
                const score = drug.scores.overall || 0;
                const confLevel = getConfidenceLevel(score);
                return (
                  <div key={i} className="p-4 rounded-xl bg-brand-darker border border-brand-border/30 text-center">
                    <p className="text-sm font-semibold text-text-primary mb-3">{drug.name}</p>
                    <p className="text-3xl font-bold font-mono mb-1" style={{ color }}>{drug.opportunities}</p>
                    <p className="text-xs text-text-muted">Repurposing Opportunities</p>
                    <div className="mt-2">
                      <p className="text-xs text-text-muted">
                        <span className="font-mono" style={{ color }}>{drug.evidenceCount}</span> evidence items
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-brand-border/30">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                        backgroundColor: `${confLevel.color}15`,
                        color: confLevel.color,
                      }}>
                        {confLevel.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Overlapping Indications */}
          {comparisonResult.overlapping_indications.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-4">
                Overlapping Indications ({comparisonResult.overlapping_indications.length})
              </h3>
              <p className="text-sm text-text-secondary mb-3">
                Therapeutic areas where multiple drugs show repurposing potential
              </p>
              <div className="flex flex-wrap gap-2">
                {comparisonResult.overlapping_indications.map((ind, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg text-xs font-medium text-brand-yellow capitalize"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Unique Indications */}
          {Object.keys(comparisonResult.unique_indications).length > 0 && (
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-4">
                Unique Indications
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Therapeutic areas unique to each drug
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comparisonResult.drugs.map((drug, i) => {
                  const unique = comparisonResult.unique_indications[drug.drugName] || [];
                  const color = i === 0 ? '#FFE600' : i === 1 ? '#00D4AA' : '#00B4D8';
                  return (
                    <div key={i} className="p-4 rounded-xl bg-brand-darker border border-brand-border/30">
                      <p className="text-sm font-semibold mb-3" style={{ color }}>
                        {drug.name} <span className="text-text-muted font-normal">({unique.length})</span>
                      </p>
                      {unique.length === 0 ? (
                        <p className="text-xs text-text-muted">No unique indications</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {unique.slice(0, 10).map((ind, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs text-text-secondary">
                              <Minus className="w-3 h-3 flex-shrink-0" style={{ color }} />
                              <span className="truncate">{ind}</span>
                            </div>
                          ))}
                          {unique.length > 10 && (
                            <p className="text-xs text-text-muted mt-2">
                              +{unique.length - 10} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Comparison Summary */}
          {comparisonResult.comparison_summary && (
            <Card className="p-4 bg-brand-teal/5 border-brand-teal/20">
              <p className="text-xs text-brand-teal">
                {comparisonResult.comparison_summary}
              </p>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            {comparisonResult.drugs.map((drug, i) => (
              <button
                key={i}
                onClick={() => navigate(`${ROUTES.RESULTS}/${encodeURIComponent(drug.drugName)}`)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-darker border border-brand-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-brand-yellow/50 transition-colors"
              >
                View {drug.name} Results <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!canCompare && !isLoading && (
        <Card className="p-12 text-center">
          <GitCompare className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Select Drugs to Compare</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto">
            Choose 2 or 3 drugs from your search history to see a side-by-side comparison of their repurposing potential across all 4 scoring dimensions.
          </p>
          {(!searchHistory || searchHistory.length < 2) && (
            <button
              onClick={() => navigate(ROUTES.SEARCH)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-yellow/10 text-brand-yellow rounded-lg text-sm font-medium hover:bg-brand-yellow/20 transition-colors"
            >
              <Search className="w-4 h-4" /> Analyze drugs first
            </button>
          )}
        </Card>
      )}
    </div>
  );
};

export default Compare;
