import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug,
  BookOpen,
  Stethoscope,
  Dna,
  Shield,
  Target,
  GraduationCap,
  Database,
  Globe,
  Zap,
  FileText,
  GitBranch,
  Atom,
  Pill,
  BookMarked,
  BarChart3,
  Search,
  TrendingUp,
  Calculator,
  Check,
  X,
  Settings,
  RefreshCw,
  AlertCircle,
  Lock,
  ExternalLink,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { IntegrationCard } from '../components/integrations';
import ConfigureModal from '../components/integrations/ConfigureModal';
import { API_BASE_URL } from '../config/api';

// Icon mapping for integrations
const ICON_MAP = {
  literature: BookOpen,
  clinical_trials: Stethoscope,
  semantic_scholar: GraduationCap,
  patent: FileText,
  internal: Database,
  openfda: Shield,
  dailymed: Pill,
  orange_book: BookMarked,
  opentargets: Target,
  kegg: GitBranch,
  uniprot: Atom,
  bioactivity: Dna,
  drugbank: Database,
  rxnorm: Pill,
  who: Globe,
  iqvia: BarChart3,
  cortellis: Search,
  informa: TrendingUp,
  evaluate: Calculator,
  clarivate: Globe,
};

// Category configuration
const CATEGORIES = {
  literature: {
    name: 'Literature & Clinical Data',
    description: 'Research papers, clinical trials, and academic sources',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  regulatory: {
    name: 'Regulatory & Safety Data',
    description: 'FDA approvals, drug labels, and safety information',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  targets: {
    name: 'Targets & Pathways',
    description: 'Protein targets, biological pathways, and mechanisms',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  drug_info: {
    name: 'Drug Information',
    description: 'Drug properties, interactions, and classifications',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  premium: {
    name: 'Premium Data Sources',
    description: 'Enterprise market intelligence and analytics',
    color: 'text-brand-yellow',
    bgColor: 'bg-brand-yellow/10',
  },
};

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Fetch integrations from backend
  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/integrations`);
      if (!response.ok) throw new Error('Failed to fetch integrations');
      const data = await response.json();
      setIntegrations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('Failed to load integrations. Using default configuration.');
      // Use fallback data
      setIntegrations(getDefaultIntegrations());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Toggle integration enabled/disabled
  const handleToggle = async (integration) => {
    if (integration.tier === 'premium') {
      // Show premium upsell
      return;
    }

    setTogglingId(integration.id);
    try {
      const endpoint = integration.enabled ? 'disable' : 'enable';
      const response = await fetch(
        `${API_BASE_URL}/api/integrations/${integration.id}/${endpoint}`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to toggle integration');

      // Update local state
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integration.id
            ? { ...i, enabled: !i.enabled, status: !i.enabled ? 'active' : 'inactive' }
            : i
        )
      );
    } catch (err) {
      console.error('Error toggling integration:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Open configure modal
  const handleConfigure = (integration) => {
    setSelectedIntegration(integration);
    setConfigureModalOpen(true);
  };

  // Handle configuration save
  const handleConfigureSave = async (config) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/integrations/${selectedIntegration.id}/configure`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        }
      );

      if (!response.ok) throw new Error('Failed to configure integration');

      const result = await response.json();

      // Update local state
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === selectedIntegration.id
            ? { ...i, configured: result.configured, api_key_set: result.api_key_set }
            : i
        )
      );

      setConfigureModalOpen(false);
    } catch (err) {
      console.error('Error configuring integration:', err);
    }
  };

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    const category = integration.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(integration);
    return acc;
  }, {});

  // Calculate stats
  const activeCount = integrations.filter((i) => i.status === 'active').length;
  const totalFree = integrations.filter((i) => i.tier !== 'premium').length;
  const premiumCount = integrations.filter((i) => i.tier === 'premium').length;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-brand-dark rounded-xl" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-brand-dark rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-yellow/10 rounded-xl flex items-center justify-center">
              <Plug className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Data Integrations</h1>
              <p className="text-text-secondary">
                Manage your data sources for comprehensive drug analysis
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchIntegrations}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success" size="lg">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            {activeCount} / {totalFree} Active
          </Badge>
          <Badge variant="yellow" size="lg">
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            {premiumCount} Premium Available
          </Badge>
          {error && (
            <Badge variant="error" size="lg">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
              {error}
            </Badge>
          )}
        </div>
      </div>

      {/* Integration Categories */}
      <div className="space-y-8">
        {Object.entries(CATEGORIES).map(([categoryKey, categoryInfo]) => {
          const categoryIntegrations = groupedIntegrations[categoryKey] || [];
          if (categoryIntegrations.length === 0) return null;

          const isPremium = categoryKey === 'premium';

          return (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 ${categoryInfo.bgColor} rounded-lg flex items-center justify-center`}>
                  <span className={`text-lg ${categoryInfo.color}`}>
                    {categoryIntegrations.length}
                  </span>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                    {categoryInfo.name}
                  </h2>
                  <p className="text-xs text-text-muted">{categoryInfo.description}</p>
                </div>
              </div>

              {/* Category Integrations Grid */}
              <div className={`grid md:grid-cols-2 ${isPremium ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4`}>
                {categoryIntegrations.map((integration, index) => {
                  const Icon = ICON_MAP[integration.id] || Database;
                  const isToggling = togglingId === integration.id;

                  return (
                    <motion.div
                      key={integration.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`p-4 h-full transition-all hover:border-brand-teal/30 ${
                          integration.enabled && integration.status === 'active'
                            ? 'border-brand-teal/20'
                            : integration.tier === 'premium'
                            ? 'border-brand-yellow/20 bg-gradient-to-br from-brand-yellow/5 to-transparent'
                            : 'opacity-75'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            integration.status === 'active' ? 'bg-brand-teal/10' :
                            integration.tier === 'premium' ? 'bg-brand-yellow/10' : 'bg-brand-dark'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              integration.status === 'active' ? 'text-brand-teal' :
                              integration.tier === 'premium' ? 'text-brand-yellow' : 'text-text-muted'
                            }`} />
                          </div>

                          {/* Status / Toggle */}
                          {integration.tier === 'premium' ? (
                            <Badge variant="yellow" size="sm">
                              <Lock className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          ) : (
                            <button
                              onClick={() => handleToggle(integration)}
                              disabled={isToggling}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                integration.enabled ? 'bg-brand-teal' : 'bg-brand-dark'
                              } ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                  integration.enabled ? 'left-7' : 'left-1'
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Content */}
                        <h3 className="font-semibold text-text-primary text-sm mb-1 line-clamp-1">
                          {integration.name}
                        </h3>
                        <p className="text-xs text-text-muted line-clamp-2 mb-3">
                          {integration.description}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-brand-dark">
                          {integration.tier === 'premium' ? (
                            <Badge variant="outline" size="sm">Contact Sales</Badge>
                          ) : (
                            <>
                              {integration.api_key_required ? (
                                <Badge
                                  variant={integration.api_key_set ? 'success' : 'warning'}
                                  size="sm"
                                >
                                  {integration.api_key_set ? 'Configured' : 'Needs API Key'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" size="sm">No Key Required</Badge>
                              )}
                              <button
                                onClick={() => handleConfigure(integration)}
                                className="text-text-muted hover:text-text-primary transition-colors"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Docs link */}
                        {integration.docs_url && (
                          <a
                            href={integration.docs_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-3 right-3 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Premium CTA */}
      <Card className="mt-8 p-6 bg-gradient-to-r from-brand-yellow/10 via-brand-teal/5 to-brand-yellow/10 border-brand-yellow/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              Unlock Premium Data Sources
            </h3>
            <p className="text-sm text-text-secondary max-w-lg">
              Get access to IQVIA, Cortellis, Informa, Evaluate, and Clarivate for comprehensive
              market intelligence, pipeline analytics, and competitive insights.
            </p>
          </div>
          <Button variant="primary" size="lg" className="flex items-center gap-2 whitespace-nowrap">
            <TrendingUp className="w-4 h-4" />
            Contact Sales
          </Button>
        </div>
      </Card>

      {/* Configure Modal */}
      <AnimatePresence>
        {configureModalOpen && selectedIntegration && (
          <ConfigureModal
            integration={selectedIntegration}
            onClose={() => setConfigureModalOpen(false)}
            onSave={handleConfigureSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Default integrations fallback
function getDefaultIntegrations() {
  return [
    { id: 'literature', name: 'PubMed / Literature', description: 'Scientific literature from NCBI PubMed database with citation analysis', category: 'literature', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 3.0, docs_url: 'https://pubmed.ncbi.nlm.nih.gov/' },
    { id: 'clinical_trials', name: 'ClinicalTrials.gov', description: 'Clinical trial registry data including phases, endpoints, and results', category: 'literature', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 1.0, docs_url: 'https://clinicaltrials.gov/' },
    { id: 'semantic_scholar', name: 'Semantic Scholar', description: 'AI-powered academic literature search with citation metrics', category: 'literature', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 0.33, docs_url: 'https://www.semanticscholar.org/' },
    { id: 'patent', name: 'Lens.org Patents', description: 'Global patent database for IP landscape analysis', category: 'literature', enabled: true, status: 'active', api_key_required: true, api_key_set: false, tier: 'free', rate_limit: 0.5, docs_url: 'https://www.lens.org/' },
    { id: 'internal', name: 'Internal R&D Database', description: 'Proprietary research data and internal drug development records', category: 'literature', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 10.0, docs_url: null },
    { id: 'openfda', name: 'OpenFDA', description: 'FDA drug approval, adverse events, recalls, and safety data', category: 'regulatory', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 4.0, docs_url: 'https://open.fda.gov/' },
    { id: 'dailymed', name: 'DailyMed Labels', description: 'FDA-approved drug labeling and structured product labels (SPL)', category: 'regulatory', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 2.0, docs_url: 'https://dailymed.nlm.nih.gov/' },
    { id: 'orange_book', name: 'FDA Orange Book', description: 'Approved drug products with therapeutic equivalence, patents, exclusivity', category: 'regulatory', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 1.0, docs_url: 'https://www.fda.gov/drugs/drug-approvals-and-databases/approved-drug-products-therapeutic-equivalence-evaluations-orange-book' },
    { id: 'opentargets', name: 'OpenTargets Platform', description: 'Target-disease associations and drug mechanisms via GraphQL API', category: 'targets', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 2.0, docs_url: 'https://platform.opentargets.org/' },
    { id: 'kegg', name: 'KEGG Pathways', description: 'Biological pathways, disease associations, and drug-target relationships', category: 'targets', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 1.0, docs_url: 'https://www.kegg.jp/' },
    { id: 'uniprot', name: 'UniProt Proteins', description: 'Protein sequences, functions, and disease associations', category: 'targets', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 3.0, docs_url: 'https://www.uniprot.org/' },
    { id: 'bioactivity', name: 'ChEMBL Bioactivity', description: 'Bioactivity data for drug-like compounds from EMBL-EBI', category: 'drug_info', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 2.0, docs_url: 'https://www.ebi.ac.uk/chembl/' },
    { id: 'drugbank', name: 'DrugBank', description: 'Comprehensive drug data including targets, interactions, and pharmacology', category: 'drug_info', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 1.0, docs_url: 'https://go.drugbank.com/' },
    { id: 'rxnorm', name: 'RxNorm', description: 'Drug normalization, related formulations, and therapeutic classes', category: 'drug_info', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 5.0, docs_url: 'https://www.nlm.nih.gov/research/umls/rxnorm/' },
    { id: 'who', name: 'WHO Essential Medicines', description: 'WHO Model List of Essential Medicines and global health priorities', category: 'drug_info', enabled: true, status: 'active', api_key_required: false, api_key_set: false, tier: 'free', rate_limit: 1.0, docs_url: 'https://list.essentialmeds.org/' },
    { id: 'iqvia', name: 'IQVIA Market Intelligence', description: 'Real-time market data, sales forecasts, competitive intelligence', category: 'premium', enabled: false, status: 'inactive', api_key_required: true, api_key_set: false, tier: 'premium', rate_limit: 1.0, docs_url: 'https://www.iqvia.com/' },
    { id: 'cortellis', name: 'Cortellis Drug Discovery', description: 'Pipeline intelligence, deal analytics, patent landscape', category: 'premium', enabled: false, status: 'inactive', api_key_required: true, api_key_set: false, tier: 'premium', rate_limit: 1.0, docs_url: 'https://www.cortellis.com/' },
    { id: 'informa', name: 'Informa Pharma Intelligence', description: 'Clinical trial analytics, regulatory intelligence, success rates', category: 'premium', enabled: false, status: 'inactive', api_key_required: true, api_key_set: false, tier: 'premium', rate_limit: 1.0, docs_url: 'https://pharmaintelligence.informa.com/' },
    { id: 'evaluate', name: 'Evaluate Pharma', description: 'Consensus forecasts, NPV calculations, market analysis', category: 'premium', enabled: false, status: 'inactive', api_key_required: true, api_key_set: false, tier: 'premium', rate_limit: 1.0, docs_url: 'https://www.evaluate.com/' },
    { id: 'clarivate', name: 'Clarivate Analytics', description: 'Patent analytics, IP landscape analysis, freedom-to-operate', category: 'premium', enabled: false, status: 'inactive', api_key_required: true, api_key_set: false, tier: 'premium', rate_limit: 1.0, docs_url: 'https://clarivate.com/' },
  ];
}

export default Integrations;
