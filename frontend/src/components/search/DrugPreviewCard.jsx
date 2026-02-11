import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Database, Clock, Sparkles, CheckCircle, AlertCircle,
  FileText, TrendingUp, Beaker,
} from 'lucide-react';
import { formatDrugName, formatTimeAgo } from '../../utils/formatters';
import useAppStore from '../../store';
import Card from '../common/Card';

/**
 * Drug Intelligence Preview Card — shows quick info before running pipeline.
 * Displayed below search box when a drug name is typed.
 */
const DrugPreviewCard = ({ drugName }) => {
  const { searchHistory, savedOpportunities } = useAppStore();

  if (!drugName || drugName.trim().length < 2) return null;

  const name = drugName.trim();
  const formattedName = formatDrugName(name);

  // Check if we have past data for this drug
  const pastSearch = searchHistory?.find(
    s => s.drugName.toLowerCase() === name.toLowerCase()
  );
  const savedCount = savedOpportunities?.filter(
    s => (s.drugName || '').toLowerCase() === name.toLowerCase()
  ).length || 0;

  // Well-known drug classes (simple lookup for demo)
  const drugInfo = getDrugInfo(name.toLowerCase());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -5, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -5, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="mt-3 overflow-hidden border-brand-yellow/20">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-brand-yellow" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">{formattedName}</h3>
                {drugInfo && (
                  <p className="text-xs text-text-muted">{drugInfo.class}</p>
                )}
              </div>
              {pastSearch && (
                <span className="ml-auto text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Previously Analyzed
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Drug Info */}
              {drugInfo && (
                <div className="p-2.5 rounded-lg bg-brand-darker">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Beaker className="w-3 h-3 text-info" />
                    <span className="text-[10px] text-text-muted font-medium">Mechanism</span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{drugInfo.mechanism}</p>
                </div>
              )}

              {drugInfo && (
                <div className="p-2.5 rounded-lg bg-brand-darker">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-3 h-3 text-brand-teal" />
                    <span className="text-[10px] text-text-muted font-medium">Approved For</span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{drugInfo.indication}</p>
                </div>
              )}

              {/* Past analysis info */}
              {pastSearch && (
                <div className="p-2.5 rounded-lg bg-brand-darker">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3 h-3 text-brand-yellow" />
                    <span className="text-[10px] text-text-muted font-medium">Last Analysis</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {pastSearch.opportunityCount || 0} opportunities
                  </p>
                  <p className="text-[10px] text-text-muted">{formatTimeAgo(pastSearch.timestamp)}</p>
                </div>
              )}

              {/* Saved count */}
              <div className="p-2.5 rounded-lg bg-brand-darker">
                <div className="flex items-center gap-1.5 mb-1">
                  <Database className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-text-muted font-medium">Data Sources</span>
                </div>
                <p className="text-xs text-text-secondary">18 agents will search</p>
                <p className="text-[10px] text-text-muted">~20-30s pipeline</p>
              </div>
            </div>

            {pastSearch && (
              <p className="mt-3 text-[10px] text-text-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Cached results available — search will be faster
              </p>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

// Simple lookup for common drugs
function getDrugInfo(name) {
  const drugs = {
    'metformin': { class: 'Biguanide (Antidiabetic)', mechanism: 'AMPK activation, hepatic glucose production inhibition', indication: 'Type 2 Diabetes Mellitus' },
    'aspirin': { class: 'NSAID / Antiplatelet', mechanism: 'COX-1/COX-2 inhibition, platelet aggregation blockade', indication: 'Pain, inflammation, cardiovascular prophylaxis' },
    'sildenafil': { class: 'PDE5 Inhibitor', mechanism: 'Phosphodiesterase-5 inhibition, cGMP pathway', indication: 'Erectile dysfunction, pulmonary hypertension' },
    'ciprofloxacin': { class: 'Fluoroquinolone (Antibiotic)', mechanism: 'DNA gyrase and topoisomerase IV inhibition', indication: 'Bacterial infections (UTI, respiratory, GI)' },
    'atorvastatin': { class: 'HMG-CoA Reductase Inhibitor (Statin)', mechanism: 'HMG-CoA reductase inhibition, LDL reduction', indication: 'Hyperlipidemia, cardiovascular risk reduction' },
    'adalimumab': { class: 'Anti-TNF Monoclonal Antibody', mechanism: 'TNF-alpha neutralization', indication: 'Rheumatoid arthritis, Crohn\'s disease, psoriasis' },
    'pembrolizumab': { class: 'Anti-PD-1 Checkpoint Inhibitor', mechanism: 'PD-1 receptor blockade, T-cell activation', indication: 'Multiple cancer types (NSCLC, melanoma)' },
    'semaglutide': { class: 'GLP-1 Receptor Agonist', mechanism: 'GLP-1 receptor activation, insulin secretion enhancement', indication: 'Type 2 diabetes, obesity' },
    'rituximab': { class: 'Anti-CD20 Monoclonal Antibody', mechanism: 'CD20+ B-cell depletion', indication: 'Non-Hodgkin lymphoma, rheumatoid arthritis' },
    'ibuprofen': { class: 'NSAID', mechanism: 'Non-selective COX inhibition', indication: 'Pain, inflammation, fever' },
    'doxycycline': { class: 'Tetracycline Antibiotic', mechanism: '30S ribosomal subunit binding, protein synthesis inhibition', indication: 'Bacterial infections, acne, malaria prophylaxis' },
    'thalidomide': { class: 'Immunomodulator', mechanism: 'TNF-alpha inhibition, angiogenesis modulation', indication: 'Multiple myeloma, ENL' },
    'minoxidil': { class: 'Vasodilator', mechanism: 'K+ channel opening, vasodilation', indication: 'Hypertension (oral), alopecia (topical)' },
    'rapamycin': { class: 'mTOR Inhibitor', mechanism: 'mTOR complex 1 inhibition', indication: 'Immunosuppression (transplant)' },
    'losartan': { class: 'ARB (Angiotensin II Receptor Blocker)', mechanism: 'AT1 receptor antagonism', indication: 'Hypertension, diabetic nephropathy' },
  };
  return drugs[name] || null;
}

export default DrugPreviewCard;
