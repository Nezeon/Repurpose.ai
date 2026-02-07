/**
 * Application Constants
 */

// Confidence level thresholds and styling
export const CONFIDENCE_LEVELS = {
  veryHigh: { min: 80, color: '#00D4AA', bgColor: 'bg-confidence-veryHigh', label: 'Very High' },
  high: { min: 65, color: '#4ADE80', bgColor: 'bg-confidence-high', label: 'High' },
  moderate: { min: 50, color: '#FFE600', bgColor: 'bg-confidence-moderate', label: 'Moderate' },
  low: { min: 35, color: '#FFB800', bgColor: 'bg-confidence-low', label: 'Low' },
  veryLow: { min: 0, color: '#FF4757', bgColor: 'bg-confidence-veryLow', label: 'Very Low' },
};

// Scoring dimension weights and metadata
export const DIMENSION_CONFIG = {
  scientific_evidence: {
    weight: 0.4,
    label: 'Scientific Evidence',
    shortLabel: 'Scientific',
    icon: 'FlaskConical',
    color: '#00B4D8',
    description: 'Quality and quantity of scientific evidence supporting the indication',
  },
  market_opportunity: {
    weight: 0.25,
    label: 'Market Opportunity',
    shortLabel: 'Market',
    icon: 'TrendingUp',
    color: '#00D4AA',
    description: 'Market size, growth potential, and commercial viability',
  },
  competitive_landscape: {
    weight: 0.2,
    label: 'Competitive Position',
    shortLabel: 'Competition',
    icon: 'Users',
    color: '#FFE600',
    description: 'Level of competition and differentiation potential',
  },
  development_feasibility: {
    weight: 0.15,
    label: 'Development Feasibility',
    shortLabel: 'Feasibility',
    icon: 'Settings',
    color: '#A78BFA',
    description: 'Technical and regulatory feasibility of development',
  },
};

// Agent configuration (all 15 internal agents for pipeline progress tracking)
export const AGENTS = [
  { id: 'LiteratureAgent', name: 'PubMed', icon: 'BookOpen', description: 'PubMed & scientific literature', eyGroup: 'web_intelligence' },
  { id: 'ClinicalTrialsAgent', name: 'Clinical Trials', icon: 'Stethoscope', description: 'ClinicalTrials.gov pipeline', eyGroup: 'clinical_trials' },
  { id: 'BioactivityAgent', name: 'ChEMBL', icon: 'Dna', description: 'ChEMBL bioactivity assays', eyGroup: 'web_intelligence' },
  { id: 'PatentAgent', name: 'USPTO Patents', icon: 'FileText', description: 'USPTO PatentsView landscape', eyGroup: 'patent_landscape' },
  { id: 'InternalAgent', name: 'Internal KB', icon: 'Database', description: 'Internal knowledge base', eyGroup: 'internal_knowledge' },
  { id: 'OpenFDAAgent', name: 'OpenFDA', icon: 'Shield', description: 'FDA adverse events & labeling', eyGroup: 'clinical_trials' },
  { id: 'OpenTargetsAgent', name: 'OpenTargets', icon: 'Target', description: 'Target-disease associations', eyGroup: 'web_intelligence' },
  { id: 'SemanticScholarAgent', name: 'Semantic Scholar', icon: 'GraduationCap', description: 'Academic citation network', eyGroup: 'web_intelligence' },
  { id: 'DailyMedAgent', name: 'DailyMed', icon: 'Pill', description: 'Drug labeling & SPL data', eyGroup: 'clinical_trials' },
  { id: 'KEGGAgent', name: 'KEGG Pathways', icon: 'GitBranch', description: 'Biological pathway data', eyGroup: 'web_intelligence' },
  { id: 'UniProtAgent', name: 'UniProt', icon: 'Atom', description: 'Protein & function data', eyGroup: 'web_intelligence' },
  { id: 'OrangeBookAgent', name: 'Orange Book', icon: 'Book', description: 'FDA patent/exclusivity data', eyGroup: 'patent_landscape' },
  { id: 'RxNormAgent', name: 'RxNorm', icon: 'Layers', description: 'Drug nomenclature mapping', eyGroup: 'clinical_trials' },
  { id: 'WHOAgent', name: 'WHO', icon: 'Globe', description: 'WHO essential medicines list', eyGroup: 'web_intelligence' },
  { id: 'DrugBankAgent', name: 'DrugBank', icon: 'Boxes', description: 'Comprehensive drug database', eyGroup: 'web_intelligence' },
];

// EY Techathon agent groupings (7 logical agents shown to evaluators)
export const EY_AGENT_GROUPS = {
  iqvia_insights: {
    name: 'IQVIA Insights Agent',
    icon: 'TrendingUp',
    description: 'Market size, CAGR, competitor analysis, and commercial viability',
    agents: ['MarketDataAgent', 'MarketAnalyzer'],
  },
  exim_trade: {
    name: 'EXIM Trade Agent',
    icon: 'Globe',
    description: 'Import-export trade data, supply chain analysis, geographic arbitrage',
    agents: ['EXIMAgent'],
  },
  patent_landscape: {
    name: 'Patent Landscape Agent',
    icon: 'FileText',
    description: 'USPTO patent filings, expiry timelines, FTO risk, biosimilar windows',
    agents: ['PatentAgent', 'OrangeBookAgent'],
  },
  clinical_trials: {
    name: 'Clinical Trials Agent',
    icon: 'Stethoscope',
    description: 'ClinicalTrials.gov pipeline, FDA data, drug labeling, nomenclature',
    agents: ['ClinicalTrialsAgent', 'OpenFDAAgent', 'DailyMedAgent', 'RxNormAgent'],
  },
  internal_knowledge: {
    name: 'Internal Knowledge Agent',
    icon: 'Database',
    description: 'Internal documents, uploaded PDFs, proprietary knowledge base',
    agents: ['InternalAgent'],
  },
  web_intelligence: {
    name: 'Web Intelligence Agent',
    icon: 'BookOpen',
    description: 'Literature, targets, pathways, proteins, guidelines, and publications',
    agents: ['LiteratureAgent', 'SemanticScholarAgent', 'OpenTargetsAgent', 'BioactivityAgent', 'KEGGAgent', 'UniProtAgent', 'WHOAgent', 'DrugBankAgent'],
  },
  report_generator: {
    name: 'Report Generator Agent',
    icon: 'FileText',
    description: 'Generates comprehensive PDF reports with scoring and analysis',
    agents: ['ReportGenerator'],
  },
};

// Agent status types
export const AGENT_STATUS = {
  pending: { label: 'Pending', color: 'text-text-muted', bgColor: 'bg-text-muted/20' },
  running: { label: 'Running', color: 'text-info', bgColor: 'bg-info/20' },
  success: { label: 'Complete', color: 'text-success', bgColor: 'bg-success/20' },
  error: { label: 'Error', color: 'text-error', bgColor: 'bg-error/20' },
};

// Navigation routes
export const ROUTES = {
  CHAT: '/chat',
  DASHBOARD: '/dashboard',
  SEARCH: '/search',
  RESULTS: '/results',
  HISTORY: '/history',
  SAVED: '/saved',
  INTEGRATIONS: '/integrations',
  SETTINGS: '/settings',
  LOGIN: '/login',
};

// Navigation items
export const NAV_ITEMS = {
  main: [
    { path: ROUTES.CHAT, label: 'AI Assistant', icon: 'MessageSquare', badge: 'NEW' },
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: ROUTES.SEARCH, label: 'Drug Search', icon: 'Search' },
    { path: ROUTES.HISTORY, label: 'History', icon: 'Clock' },
  ],
  intelligence: [
    { path: ROUTES.SAVED, label: 'Saved Opportunities', icon: 'Bookmark' },
    { path: ROUTES.RESULTS, label: 'Market Insights', icon: 'TrendingUp' },
  ],
  configuration: [
    { path: ROUTES.INTEGRATIONS, label: 'Integrations', icon: 'Plug' },
    { path: ROUTES.SETTINGS, label: 'Settings', icon: 'Settings' },
  ],
};

// Evidence source types
export const EVIDENCE_SOURCES = {
  literature: { label: 'Literature', icon: 'BookOpen', color: '#00B4D8' },
  clinical_trials: { label: 'Clinical Trials', icon: 'Stethoscope', color: '#00D4AA' },
  bioactivity: { label: 'Bioactivity', icon: 'Dna', color: '#A78BFA' },
  patent: { label: 'Patents', icon: 'FileText', color: '#FFE600' },
  internal: { label: 'Internal', icon: 'Database', color: '#F472B6' },
  openfda: { label: 'OpenFDA', icon: 'Shield', color: '#34D399' },
  opentargets: { label: 'OpenTargets', icon: 'Target', color: '#60A5FA' },
  semantic_scholar: { label: 'Semantic Scholar', icon: 'GraduationCap', color: '#FBBF24' },
  dailymed: { label: 'DailyMed', icon: 'Pill', color: '#F87171' },
  kegg: { label: 'KEGG', icon: 'GitBranch', color: '#A3E635' },
  uniprot: { label: 'UniProt', icon: 'Atom', color: '#C084FC' },
  orange_book: { label: 'Orange Book', icon: 'Book', color: '#FB923C' },
  rxnorm: { label: 'RxNorm', icon: 'Layers', color: '#2DD4BF' },
  who: { label: 'WHO', icon: 'Globe', color: '#818CF8' },
  drugbank: { label: 'DrugBank', icon: 'Boxes', color: '#F472B6' },
};

// Insight categories
export const INSIGHT_CATEGORIES = {
  strength: { label: 'Strength', icon: 'CheckCircle', color: 'text-success', bgColor: 'bg-success/10' },
  risk: { label: 'Risk', icon: 'AlertTriangle', color: 'text-error', bgColor: 'bg-error/10' },
  opportunity: { label: 'Opportunity', icon: 'Lightbulb', color: 'text-warning', bgColor: 'bg-warning/10' },
  recommendation: { label: 'Next Step', icon: 'ArrowRight', color: 'text-info', bgColor: 'bg-info/10' },
};

// Animation variants for framer-motion
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
};

// Default export for convenience
export default {
  CONFIDENCE_LEVELS,
  DIMENSION_CONFIG,
  AGENTS,
  EY_AGENT_GROUPS,
  AGENT_STATUS,
  ROUTES,
  NAV_ITEMS,
  EVIDENCE_SOURCES,
  INSIGHT_CATEGORIES,
  ANIMATION_VARIANTS,
};
