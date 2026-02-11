import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, FileText, Sparkles, Layers, Shield, Share2 } from 'lucide-react';
import useAppStore from '../store';
import { searchDrug, exportPDF, exportExcel, exportJSON } from '../services/api';
import { ROUTES } from '../utils/constants';
import { downloadFile } from '../utils/helpers';
import {
  ResultsHeader,
  OpportunityList,
  EvidencePanel,
  AIInsights,
  OpportunityDetailPanel,
  StrategicBrief,
  RegulatoryPathway,
} from '../components/results';
import { ScoreBreakdown, InsightCard } from '../components/scoring';
import { MarketOverview, CompetitorList, MarketDashboard } from '../components/market';
import { SourceDistribution, RadarChart, EvidenceGraph } from '../components/visualizations';
import Tabs from '../components/common/Tabs';
import Skeleton from '../components/common/Skeleton';
import ReportPreviewModal from '../components/common/ReportPreviewModal';

const Results = () => {
  const { drugName } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('opportunities');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showEvidencePanel, setShowEvidencePanel] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [detailOpportunity, setDetailOpportunity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const {
    searchResults,
    setSearchResults,
    savedOpportunities,
    saveOpportunity,
    removeOpportunity,
  } = useAppStore();

  // Load results if not in store
  useEffect(() => {
    if (drugName && (!searchResults || searchResults.drug_name !== drugName)) {
      loadResults();
    }
  }, [drugName]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadResults = async () => {
    if (!drugName) return;
    setLoading(true);
    try {
      const results = await searchDrug(drugName, { forceRefresh: false });
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to load results:', err);
      navigate(ROUTES.SEARCH);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!drugName) return;
    setLoading(true);
    try {
      const results = await searchDrug(drugName, { forceRefresh: true });
      setSearchResults(results);
    } catch (err) {
      console.error('Re-analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!searchResults) return;
    setExportLoading(true);
    try {
      const blob = await exportPDF(searchResults);
      // Show preview instead of direct download
      setPreviewBlob(blob);
      setPreviewTitle(`${drugName} — Full Analysis Report`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handlePreviewDownload = () => {
    if (previewBlob) {
      downloadFile(previewBlob, `${drugName}_analysis.pdf`, 'application/pdf');
    }
  };

  const handleExportExcel = async () => {
    if (!searchResults) return;
    setExportLoading(true);
    try {
      const blob = await exportExcel(searchResults);
      downloadFile(blob, `${drugName}_analysis.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportJSON = async () => {
    if (!searchResults) return;
    setExportLoading(true);
    try {
      const data = await exportJSON(searchResults);
      downloadFile(
        JSON.stringify(data, null, 2),
        `${drugName}_analysis.json`,
        'application/json'
      );
    } catch (err) {
      console.error('JSON export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleSaveOpportunity = (opportunity) => {
    const opportunityId = `${drugName}-${opportunity.indication}`;
    const isSaved = savedOpportunities?.some((o) => o.id === opportunityId);

    if (isSaved) {
      removeOpportunity(opportunityId);
    } else {
      // Get evidence for this opportunity
      const opportunityEvidence = allEvidence.filter(
        (e) => e.indication?.toLowerCase() === opportunity.indication?.toLowerCase()
      );

      saveOpportunity({
        ...opportunity,
        drugName,
        savedAt: new Date().toISOString(),
        id: opportunityId,
        // Store the evidence with the opportunity
        savedEvidence: opportunityEvidence,
        // Store AI insights if available
        savedInsights: synthesis,
        // Store execution metadata
        executionTime,
        cached,
      });
    }
  };

  const handleSelectOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowEvidencePanel(true);
  };

  const handleViewDetails = (opportunity) => {
    setDetailOpportunity(opportunity);
    setShowDetailPanel(true);
  };

  // Get data
  const opportunities = searchResults?.enhanced_indications || searchResults?.ranked_indications || [];
  const allEvidence = searchResults?.all_evidence || [];
  const synthesis = searchResults?.synthesis;
  const totalEvidence = allEvidence.length;
  const executionTime = searchResults?.execution_time || 0;
  const cached = searchResults?.cached || false;

  // Get evidence for selected opportunity
  const selectedEvidence = selectedOpportunity
    ? allEvidence.filter((e) =>
        e.indication?.toLowerCase() === selectedOpportunity.indication?.toLowerCase()
      )
    : [];

  // Get evidence for detail panel opportunity
  const detailEvidence = detailOpportunity
    ? allEvidence.filter((e) =>
        e.indication?.toLowerCase() === detailOpportunity.indication?.toLowerCase()
      )
    : [];

  // Get enhanced opportunity data (with comparisons, segments, science)
  const enhancedOpportunities = searchResults?.enhanced_opportunities || {};
  const detailEnhancedOpportunity = detailOpportunity
    ? enhancedOpportunities[detailOpportunity.indication] || null
    : null;

  // Saved IDs - use the combined drugName-indication format
  const savedIds = savedOpportunities
    ?.filter((o) => o.drugName === drugName)
    ?.map((o) => o.indication) || [];

  // Tabs configuration
  const tabs = [
    { id: 'opportunities', label: 'Opportunities', icon: Layers, badge: opportunities.length },
    { id: 'market', label: 'Market Analysis', icon: BarChart3 },
    { id: 'evidence', label: 'Evidence', icon: FileText, badge: totalEvidence },
    { id: 'graph', label: 'Graph', icon: Share2 },
    { id: 'strategy', label: 'Strategy', icon: Shield },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height="4rem" />
        <Skeleton height="3rem" width="60%" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton.OpportunityCard />
            <Skeleton.OpportunityCard />
            <Skeleton.OpportunityCard />
          </div>
          <Skeleton.Card />
        </div>
      </div>
    );
  }

  if (!searchResults) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResultsHeader
        drugName={drugName}
        totalEvidence={totalEvidence}
        opportunityCount={opportunities.length}
        executionTime={executionTime}
        cached={cached}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onExportJSON={handleExportJSON}
        onReanalyze={handleReanalyze}
        exportLoading={exportLoading}
      />

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab content */}
      <div className="min-h-[500px]">
        {/* Opportunities tab */}
        {activeTab === 'opportunities' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2">
              <OpportunityList
                opportunities={opportunities}
                selectedId={selectedOpportunity?.indication}
                savedIds={savedIds}
                onSelect={handleSelectOpportunity}
                onSave={handleSaveOpportunity}
                onViewDetails={handleViewDetails}
              />
            </div>

            {/* Side panel - Score breakdown for selected */}
            <div className="space-y-4">
              {selectedOpportunity?.composite_score ? (
                <>
                  <ScoreBreakdown compositeScore={selectedOpportunity.composite_score} />
                  <RadarChart compositeScore={selectedOpportunity.composite_score} />

                  {/* Key insights */}
                  {selectedOpportunity.composite_score.key_strengths?.length > 0 && (
                    <InsightCard.List
                      insights={selectedOpportunity.composite_score.key_strengths}
                      title="Key Strengths"
                      compact
                    />
                  )}
                </>
              ) : (
                <div className="card p-6 text-center text-text-muted">
                  Select an opportunity to see detailed scoring breakdown
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Market tab */}
        {activeTab === 'market' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Aggregate Market Dashboard - always shown */}
            <MarketDashboard opportunities={opportunities} />

            {/* Per-opportunity details when selected */}
            {selectedOpportunity && (
              <div className="border-t border-brand-border pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Selected: {selectedOpportunity.indication}
                </h3>
                <div className="grid lg:grid-cols-2 gap-6">
                  <MarketOverview
                    marketData={selectedOpportunity?.composite_score?.market_opportunity}
                  />
                  <CompetitorList
                    competitors={selectedOpportunity?.composite_score?.competitive_landscape?.competitors || []}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Evidence tab */}
        {activeTab === 'evidence' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2">
              <SourceDistribution evidenceItems={allEvidence} />
            </div>
            <div>
              <div className="card p-6">
                <h3 className="font-semibold text-text-primary mb-4">Evidence Summary</h3>
                <p className="text-3xl font-bold text-brand-yellow mb-1">{totalEvidence}</p>
                <p className="text-text-muted">Total evidence items</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Graph tab */}
        {activeTab === 'graph' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <EvidenceGraph
              drugName={drugName}
              opportunities={opportunities}
              allEvidence={allEvidence}
            />
          </motion.div>
        )}

        {/* Strategy tab */}
        {activeTab === 'strategy' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Strategic Brief */}
            <StrategicBrief
              opportunities={opportunities}
              synthesis={synthesis}
              drugName={drugName}
              totalEvidence={totalEvidence}
            />

            {/* Regulatory Pathway for top opportunity */}
            {opportunities.length > 0 && (
              <div className="grid lg:grid-cols-2 gap-6">
                {opportunities.slice(0, 2).map((opp, i) => (
                  <RegulatoryPathway
                    key={i}
                    indication={opp.indication}
                    drugName={drugName}
                    score={opp.composite_score?.overall_score || 0}
                    evidenceCount={opp.evidence_count || 0}
                    scientificScore={opp.composite_score?.scientific_evidence?.score || 0}
                    feasibilityScore={opp.composite_score?.development_feasibility?.score || 0}
                    marketData={opp.composite_score?.market_opportunity || {}}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* AI Insights tab */}
        {activeTab === 'insights' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AIInsights synthesis={synthesis} drugName={drugName} />
          </motion.div>
        )}
      </div>

      {/* Evidence panel */}
      <EvidencePanel
        isOpen={showEvidencePanel}
        onClose={() => setShowEvidencePanel(false)}
        indication={selectedOpportunity?.indication}
        evidenceItems={selectedEvidence}
      />

      {/* Opportunity detail panel */}
      <OpportunityDetailPanel
        isOpen={showDetailPanel}
        onClose={() => setShowDetailPanel(false)}
        opportunity={detailOpportunity}
        evidenceItems={detailEvidence}
        drugName={drugName}
        onSave={handleSaveOpportunity}
        isSaved={detailOpportunity ? savedIds.includes(detailOpportunity.indication) : false}
        enhancedOpportunity={detailEnhancedOpportunity}
      />

      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={!!previewBlob}
        onClose={() => setPreviewBlob(null)}
        pdfBlob={previewBlob}
        title={previewTitle}
        onDownload={handlePreviewDownload}
      />
    </div>
  );
};

export default Results;
