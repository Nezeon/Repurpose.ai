/**
 * IndicationList Component
 * Displays ranked list of drug repurposing opportunities
 * EY Healthcare Theme
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, FileText, Trophy, ExternalLink } from 'lucide-react';
import ConfidenceScore from './ConfidenceScore';

const IndicationItem = ({ indication, rank }) => {
  const [expanded, setExpanded] = useState(false);

  // Get medal styling for top 3
  const getMedalStyle = () => {
    if (rank === 1) return { color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', border: 'border-brand-yellow/30' };
    if (rank === 2) return { color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/30' };
    if (rank === 3) return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return null;
  };

  const medalStyle = getMedalStyle();

  // Get URL from evidence item (either from url field or metadata)
  const getEvidenceUrl = (evidence) => {
    if (evidence.url) return evidence.url;
    if (evidence.metadata?.url) return evidence.metadata.url;

    // Build URL from metadata if not directly available
    if (evidence.source === 'literature' && evidence.metadata?.pmid) {
      return `https://pubmed.ncbi.nlm.nih.gov/${evidence.metadata.pmid}/`;
    }
    if (evidence.source === 'clinical_trials' && evidence.metadata?.nct_id) {
      return `https://clinicaltrials.gov/study/${evidence.metadata.nct_id}`;
    }
    if (evidence.source === 'bioactivity' && evidence.metadata?.target_chembl_id) {
      return `https://www.ebi.ac.uk/chembl/target_report_card/${evidence.metadata.target_chembl_id}/`;
    }
    if (evidence.source === 'patent' && evidence.metadata?.lens_id) {
      return `https://www.lens.org/lens/patent/${evidence.metadata.lens_id}`;
    }
    return null;
  };

  // Get title from evidence
  const getEvidenceTitle = (evidence) => {
    if (evidence.title) return evidence.title;
    if (evidence.metadata?.title) return evidence.metadata.title;
    return null;
  };

  // Get evidence ID display
  const getEvidenceId = (evidence) => {
    if (evidence.metadata?.pmid) return `PMID: ${evidence.metadata.pmid}`;
    if (evidence.metadata?.nct_id) return evidence.metadata.nct_id;
    if (evidence.metadata?.target_chembl_id) return evidence.metadata.target_chembl_id;
    if (evidence.metadata?.lens_id) return evidence.metadata.lens_id;
    if (evidence.metadata?.record_id) return evidence.metadata.record_id;
    return null;
  };

  return (
    <div className="bg-brand-dark/50 rounded-xl border border-white/10 hover:border-brand-yellow/30 transition-all duration-300 mb-4 overflow-hidden">
      {/* Main content */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start space-x-4">
              {/* Rank */}
              <div className="flex-shrink-0">
                {medalStyle ? (
                  <div className={`w-10 h-10 rounded-xl ${medalStyle.bg} border ${medalStyle.border} flex items-center justify-center`}>
                    <Trophy className={`w-5 h-5 ${medalStyle.color}`} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold text-gray-400">
                    {rank}
                  </div>
                )}
              </div>

              {/* Indication name and details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {indication.indication}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span>{indication.evidence_count} evidence</span>
                  </span>

                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Database className="w-4 h-4" />
                    <span>{indication.supporting_sources.length} sources</span>
                  </span>
                </div>

                {/* Source badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {indication.supporting_sources.map((source) => (
                    <span
                      key={source}
                      className="badge-info text-xs"
                    >
                      {source.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Confidence score */}
          <div className="flex-shrink-0 ml-4 flex items-center space-x-4">
            <ConfidenceScore
              score={indication.confidence_score}
              size="sm"
              showLabel={false}
            />

            {/* Expand button */}
            <button
              className="p-2 text-gray-500 hover:text-brand-yellow hover:bg-white/5 rounded-lg transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded evidence details */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-white/10 animate-slide-up">
          <h4 className="font-semibold text-gray-300 text-sm mb-3 mt-4">Evidence Details:</h4>

          <div className="space-y-3">
            {indication.evidence_items?.slice(0, 5).map((evidence, idx) => {
              const url = getEvidenceUrl(evidence);
              const title = getEvidenceTitle(evidence);
              const evidenceId = getEvidenceId(evidence);

              return (
                <div key={idx} className="p-4 bg-brand-charcoal rounded-xl border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge-info text-xs">
                        {evidence.source.replace('_', ' ')}
                      </span>
                      {evidenceId && (
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                          {evidenceId}
                        </span>
                      )}
                    </div>
                    {evidence.date && (
                      <span className="text-xs text-gray-500">
                        {evidence.date}
                      </span>
                    )}
                  </div>

                  {/* Title with link */}
                  {title && (
                    <div className="mb-2">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-health-teal hover:text-brand-yellow transition-colors inline-flex items-start gap-1 group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="flex-1">{title}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 mt-1 opacity-50 group-hover:opacity-100" />
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-gray-300">
                          {title}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-gray-300 leading-relaxed">
                    {evidence.summary}
                  </p>

                  {evidence.metadata && Object.keys(evidence.metadata).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(evidence.metadata)
                        .filter(([key]) => !['title', 'url', 'claims', 'conditions'].includes(key))
                        .slice(0, 4)
                        .map(([key, value]) => {
                          // Format the value appropriately
                          let displayValue = value;
                          if (Array.isArray(value)) {
                            displayValue = value.length > 0 ? value.join(', ') : '-';
                          } else if (typeof value === 'object' && value !== null) {
                            displayValue = JSON.stringify(value).slice(0, 30);
                          } else if (typeof value === 'number') {
                            displayValue = value.toLocaleString();
                          } else {
                            displayValue = String(value);
                          }

                          // Truncate long values
                          if (displayValue.length > 50) {
                            displayValue = displayValue.slice(0, 50) + '...';
                          }

                          return (
                            <span key={key} className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                              <span className="font-medium text-gray-400">{key.replace(/_/g, ' ')}:</span>{' '}
                              {displayValue}
                            </span>
                          );
                        })}
                    </div>
                  )}

                  {/* View source button */}
                  {url && (
                    <div className="mt-3 pt-2 border-t border-white/5">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-brand-yellow hover:text-brand-gold transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Original Source
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {indication.evidence_items?.length > 5 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              + {indication.evidence_items.length - 5} more evidence items
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const IndicationList = ({ indications = [] }) => {
  if (!indications || indications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No repurposing opportunities found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Top Repurposing Opportunities
        </h2>
        <span className="badge-success">
          {indications.length} found
        </span>
      </div>

      {indications.map((indication, idx) => (
        <IndicationItem
          key={indication.indication}
          indication={indication}
          rank={idx + 1}
        />
      ))}
    </div>
  );
};

export default IndicationList;
