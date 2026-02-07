import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Microscope,
  Target,
  GitBranch,
  BookOpen,
  Activity,
  Dna,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { cn } from '../../utils/helpers';

/**
 * SciencePanel - Displays detailed scientific data for researchers
 * Shows: mechanism, target, pathways, binding affinity, publications, biomarkers
 */
const SciencePanel = ({ scientificDetails, drugName }) => {
  const [expandedPubs, setExpandedPubs] = useState(false);

  if (!scientificDetails) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Microscope className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Scientific Details Pending
          </h3>
          <p className="text-text-secondary text-sm">
            Detailed scientific analysis is being compiled from available evidence sources.
          </p>
        </div>
      </Card>
    );
  }

  const {
    mechanism_of_action,
    target_protein,
    target_gene,
    target_class,
    pathways = [],
    binding_affinity_nm,
    selectivity_profile,
    key_publications = [],
    preclinical_models = [],
    biomarkers = [],
    clinical_evidence_summary,
    mechanistic_rationale,
  } = scientificDetails;

  return (
    <div className="space-y-6">
      {/* Mechanism of Action */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-brand-teal" />
          Mechanism of Action
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed">
          {mechanism_of_action || 'Mechanism under investigation'}
        </p>

        {mechanistic_rationale && (
          <div className="mt-4 p-4 bg-brand-teal/5 rounded-lg border border-brand-teal/20">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-brand-teal mb-1">Mechanistic Rationale</h4>
                <p className="text-xs text-text-secondary">{mechanistic_rationale}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Target Information */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Target Information
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Primary Target */}
          <div className="p-4 bg-brand-darker rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Dna className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-text-primary">Primary Target</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Protein</span>
                <span className="text-xs text-text-primary font-medium">
                  {target_protein || 'Not determined'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Gene</span>
                <span className="text-xs text-text-primary font-mono">
                  {target_gene || 'N/A'}
                </span>
              </div>
              {target_class && (
                <div className="flex justify-between">
                  <span className="text-xs text-text-muted">Class</span>
                  <Badge variant="outline" size="sm">
                    {target_class}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Binding & Selectivity */}
          <div className="p-4 bg-brand-darker rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-text-primary">Binding Profile</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Binding Affinity</span>
                {binding_affinity_nm ? (
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded',
                      binding_affinity_nm < 10
                        ? 'bg-green-500/20 text-green-400'
                        : binding_affinity_nm < 100
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-orange-500/20 text-orange-400'
                    )}
                  >
                    {binding_affinity_nm} nM
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">Not determined</span>
                )}
              </div>

              {binding_affinity_nm && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Potency</span>
                    <span>
                      {binding_affinity_nm < 10
                        ? 'Highly Potent'
                        : binding_affinity_nm < 100
                        ? 'Potent'
                        : binding_affinity_nm < 1000
                        ? 'Moderate'
                        : 'Low'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-brand-dark rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full',
                        binding_affinity_nm < 10
                          ? 'bg-green-500'
                          : binding_affinity_nm < 100
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                      )}
                      style={{
                        width: `${Math.max(10, 100 - Math.log10(binding_affinity_nm) * 25)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {selectivity_profile && (
                <div className="mt-3 pt-3 border-t border-brand-dark">
                  <span className="text-xs text-text-muted">Selectivity: </span>
                  <span className="text-xs text-text-secondary">{selectivity_profile}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Pathway Involvement */}
      {pathways.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-green-400" />
            Pathway Involvement
          </h3>

          <div className="flex flex-wrap gap-2">
            {pathways.map((pathway, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm border border-green-500/20"
              >
                {pathway}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Publications */}
      {key_publications.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Key Research Publications
              <Badge variant="outline" size="sm">
                {key_publications.length}
              </Badge>
            </h3>
            {key_publications.length > 3 && (
              <button
                onClick={() => setExpandedPubs(!expandedPubs)}
                className="text-xs text-brand-teal flex items-center gap-1 hover:underline"
              >
                {expandedPubs ? (
                  <>
                    Show less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Show all <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(expandedPubs ? key_publications : key_publications.slice(0, 3)).map((pub, index) => (
              <motion.div
                key={pub.pmid || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-brand-darker rounded-lg border border-brand-dark hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-text-primary mb-1 line-clamp-2">
                      {pub.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                      {pub.authors && <span>{pub.authors}</span>}
                      {pub.journal && (
                        <>
                          <span>•</span>
                          <span className="italic">{pub.journal}</span>
                        </>
                      )}
                      {pub.year && (
                        <>
                          <span>•</span>
                          <span>{pub.year}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">{pub.key_finding}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {pub.citation_count && (
                      <Badge
                        variant={pub.citation_count > 100 ? 'success' : 'outline'}
                        size="sm"
                      >
                        {pub.citation_count} citations
                      </Badge>
                    )}
                    {pub.url && (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-teal hover:text-brand-teal/80 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Biomarkers & Clinical Evidence */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Biomarkers */}
        {biomarkers.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              Relevant Biomarkers
            </h3>

            <div className="space-y-2">
              {biomarkers.map((biomarker, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-brand-darker rounded"
                >
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-sm text-text-primary">{biomarker}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Preclinical Models */}
        {preclinical_models.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Microscope className="w-5 h-5 text-pink-400" />
              Preclinical Models
            </h3>

            <div className="space-y-2">
              {preclinical_models.map((model, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-brand-darker rounded"
                >
                  <div className="w-2 h-2 rounded-full bg-pink-400" />
                  <span className="text-sm text-text-primary">{model}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Clinical Evidence Summary */}
      {clinical_evidence_summary && (
        <Card className="p-5">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-yellow" />
            Clinical Evidence Summary
          </h3>
          <p className="text-text-secondary text-sm">{clinical_evidence_summary}</p>
        </Card>
      )}
    </div>
  );
};

export default SciencePanel;
