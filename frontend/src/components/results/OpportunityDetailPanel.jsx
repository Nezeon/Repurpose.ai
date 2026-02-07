import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Download,
  Share2,
  Beaker,
  BarChart3,
  FileText,
  ThumbsUp,
  Lightbulb,
  Target,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Scale,
  Microscope,
  Loader2,
} from 'lucide-react';
import { cn, downloadFile } from '../../utils/helpers';
import { exportOpportunityPDF } from '../../services/api';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Tabs from '../common/Tabs';
import { RadarChart } from '../visualizations';
import { ScoreBreakdown, InsightCard } from '../scoring';
import { MarketDataCard, CompetitorList, MarketSegmentCard } from '../market';
import EvidenceItem from './EvidenceItem';
import ComparativePanel from './ComparativePanel';
import SciencePanel from './SciencePanel';

/**
 * OpportunityDetailPanel - Full detail view for a single opportunity
 * Shows all data: scores, evidence, market data, comparisons, science
 */
const OpportunityDetailPanel = ({
  isOpen,
  onClose,
  opportunity,
  evidenceItems = [],
  allEvidence = [],
  drugName,
  onSave,
  isSaved = false,
  enhancedOpportunity = null, // Enhanced data with comparisons, segments, science
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSource, setSelectedSource] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  if (!opportunity) return null;

  const compositeScore = opportunity.composite_score || {};
  const indication = opportunity.indication || 'Unknown Indication';
  const overallScore = compositeScore.overall_score || opportunity.confidence_score || 0;
  const confidenceLevel = compositeScore.confidence_level || 'moderate';

  // Get evidence for this indication
  const indicationEvidence = evidenceItems.length > 0 ? evidenceItems :
    allEvidence.filter((e) =>
      e.indication?.toLowerCase() === indication.toLowerCase()
    );

  // Group evidence by source
  const evidenceBySource = indicationEvidence.reduce((acc, e) => {
    const source = e.source || 'unknown';
    if (!acc[source]) acc[source] = [];
    acc[source].push(e);
    return acc;
  }, {});

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Beaker },
    { id: 'comparison', label: 'vs Standard of Care', icon: Scale },
    { id: 'evidence', label: 'Evidence', icon: FileText, badge: indicationEvidence.length },
    { id: 'market', label: 'Market Segment', icon: Target },
    { id: 'science', label: 'Science', icon: Microscope },
  ];

  // Get confidence badge variant
  const getConfidenceBadge = () => {
    const variants = {
      very_high: { variant: 'success', label: 'Very High Confidence' },
      high: { variant: 'success', label: 'High Confidence' },
      moderate: { variant: 'warning', label: 'Moderate Confidence' },
      low: { variant: 'error', label: 'Low Confidence' },
      very_low: { variant: 'error', label: 'Very Low Confidence' },
    };
    return variants[confidenceLevel] || variants.moderate;
  };

  const confidenceBadge = getConfidenceBadge();

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const blob = await exportOpportunityPDF(
        drugName,
        opportunity,
        indicationEvidence,
        enhancedOpportunity,
      );
      const safeIndication = indication.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
      downloadFile(
        blob,
        `${drugName}_${safeIndication}_report.pdf`,
        'application/pdf'
      );
    } catch (err) {
      console.error('Opportunity PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-brand-darker border-l border-brand-dark shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-brand-dark bg-gradient-to-r from-brand-teal/5 to-brand-yellow/5">
              <div className="flex items-start justify-between mb-4">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm">Back to Results</span>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSave?.(opportunity)}
                    className={cn(isSaved && 'text-brand-yellow')}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownloadPDF} disabled={isExporting}>
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  <button
                    onClick={onClose}
                    className="p-2 text-text-muted hover:text-text-primary hover:bg-brand-dark rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {indication}
                  </h2>
                  <p className="text-text-secondary">
                    {drugName ? `Analysis for ${drugName}` : 'Repurposing Opportunity'}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant={confidenceBadge.variant} size="lg">
                      {confidenceBadge.label}
                    </Badge>
                    <Badge variant="outline" size="lg">
                      {indicationEvidence.length} Evidence Items
                    </Badge>
                    <Badge variant="outline" size="lg">
                      {Object.keys(evidenceBySource).length} Sources
                    </Badge>
                  </div>
                </div>

                {/* Score Circle */}
                <div className="flex-shrink-0 relative">
                  <svg className="w-24 h-24 -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-brand-dark"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="url(#score-gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(overallScore / 100) * 264} 264`}
                      initial={{ strokeDasharray: '0 264' }}
                      animate={{ strokeDasharray: `${(overallScore / 100) * 264} 264` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                    <defs>
                      <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00D4AA" />
                        <stop offset="100%" stopColor="#FFE600" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-text-primary">
                      {Math.round(overallScore)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 px-6 pt-4 border-b border-brand-dark">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="underline"
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Dimension Scores */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      <ScoreBreakdown compositeScore={compositeScore} />
                      <RadarChart compositeScore={compositeScore} />
                    </div>

                    {/* Key Insights */}
                    <div className={cn(
                      "grid gap-6",
                      enhancedOpportunity?.key_benefits_summary?.length > 0 ? "lg:grid-cols-2" : "lg:grid-cols-1"
                    )}>
                      {compositeScore.key_strengths?.length > 0 && (
                        <InsightCard.List
                          insights={compositeScore.key_strengths}
                          title="Key Strengths"
                          icon={ThumbsUp}
                          iconColor="text-green-400"
                        />
                      )}
                      {enhancedOpportunity?.key_benefits_summary?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-brand-teal" />
                            Comparative Benefits
                          </h3>
                          <div className="space-y-3">
                            {enhancedOpportunity.key_benefits_summary.map((benefit, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 rounded-xl border border-green-500/20 bg-green-500/5"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-500/10">
                                    <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
                                  </div>
                                  <p className="text-sm text-text-secondary leading-relaxed">{benefit}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    {compositeScore.recommended_next_steps?.length > 0 && (
                      <InsightCard.List
                        insights={compositeScore.recommended_next_steps}
                        title="Recommended Next Steps"
                        icon={Lightbulb}
                        iconColor="text-brand-yellow"
                      />
                    )}
                  </motion.div>
                )}

                {/* Comparison Tab - vs Standard of Care */}
                {activeTab === 'comparison' && (
                  <motion.div
                    key="comparison"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ComparativePanel
                      comparatorDrugs={enhancedOpportunity?.comparator_drugs || []}
                      comparativeAdvantages={enhancedOpportunity?.comparative_advantages || []}
                      sideEffectComparison={enhancedOpportunity?.side_effect_comparison}
                      drugName={drugName}
                    />
                  </motion.div>
                )}

                {/* Evidence Tab */}
                {activeTab === 'evidence' && (
                  <motion.div
                    key="evidence"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Source Filter Pills */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedSource('all')}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-all',
                          selectedSource === 'all'
                            ? 'bg-brand-yellow text-black'
                            : 'bg-brand-darker text-text-secondary hover:bg-brand-dark hover:text-text-primary'
                        )}
                      >
                        All ({indicationEvidence.length})
                      </button>
                      {Object.entries(evidenceBySource)
                        .sort((a, b) => b[1].length - a[1].length)
                        .map(([source, items]) => (
                          <button
                            key={source}
                            onClick={() => setSelectedSource(source)}
                            className={cn(
                              'px-4 py-2 rounded-full text-sm font-medium transition-all',
                              selectedSource === source
                                ? 'bg-brand-yellow text-black'
                                : 'bg-brand-darker text-text-secondary hover:bg-brand-dark hover:text-text-primary'
                            )}
                          >
                            {source.replace('_', ' ')} ({items.length})
                          </button>
                        ))}
                    </div>

                    {/* Evidence List */}
                    <div className="space-y-4">
                      {(() => {
                        const displayedEvidence = selectedSource === 'all'
                          ? indicationEvidence
                          : evidenceBySource[selectedSource] || [];

                        return displayedEvidence.length > 0 ? (
                          displayedEvidence.map((evidence, index) => (
                            <motion.div
                              key={evidence.id || `${selectedSource}-${index}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <EvidenceItem evidence={evidence} />
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-text-muted text-center py-8">
                            No evidence items found for this {selectedSource === 'all' ? 'indication' : 'source'}
                          </p>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}

                {/* Market Tab */}
                {activeTab === 'market' && (
                  <motion.div
                    key="market"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Market Segment Card (NEW - Primary) */}
                    {enhancedOpportunity?.market_segment && (
                      <MarketSegmentCard
                        segment={enhancedOpportunity.market_segment}
                        parentIndication={indication}
                      />
                    )}

                    <div className="grid lg:grid-cols-2 gap-6">
                      <MarketDataCard
                        marketData={compositeScore.market_opportunity}
                        indication={indication}
                      />
                      <CompetitorList
                        competitors={compositeScore.competitive_landscape?.competitors || []}
                        score={compositeScore.competitive_landscape?.score}
                      />
                    </div>

                    {/* Market Notes */}
                    {compositeScore.market_opportunity?.notes?.length > 0 && (
                      <Card className="p-4">
                        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-brand-teal" />
                          Market Insights
                        </h3>
                        <ul className="space-y-2">
                          {compositeScore.market_opportunity.notes.map((note, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                              <span className="text-brand-teal">•</span>
                              {note}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </motion.div>
                )}

                {/* Science Tab */}
                {activeTab === 'science' && (
                  <motion.div
                    key="science"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <SciencePanel
                      scientificDetails={enhancedOpportunity?.scientific_details}
                      drugName={drugName}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OpportunityDetailPanel;
