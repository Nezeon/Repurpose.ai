import React from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck, Clock, Shield, Zap, Award, AlertCircle,
  CheckCircle, ChevronRight, BookOpen,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import Card from '../common/Card';

/**
 * Regulatory Pathway Advisor — suggests FDA pathways for an opportunity.
 * Props:
 *   indication: string
 *   drugName: string
 *   score: number (composite)
 *   evidenceCount: number
 *   scientificScore: number
 *   feasibilityScore: number
 *   marketData: object (from enhanced_opportunities)
 */
const RegulatoryPathway = ({
  indication = '',
  drugName = '',
  score = 0,
  evidenceCount = 0,
  scientificScore = 0,
  feasibilityScore = 0,
  marketData = {},
}) => {
  // Determine pathway recommendation
  const pathways = analyzePathways({ indication, score, evidenceCount, scientificScore, feasibilityScore, marketData });

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-brand-border bg-gradient-to-r from-purple-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-500/15 rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Regulatory Pathway Advisor</h3>
            <p className="text-xs text-text-muted">{indication}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Recommended Pathway */}
        <div className={`p-4 rounded-xl border ${pathways.recommended.bg} ${pathways.recommended.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className={`w-4 h-4 ${pathways.recommended.color}`} />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recommended Pathway</span>
          </div>
          <p className={`text-base font-bold ${pathways.recommended.color}`}>{pathways.recommended.name}</p>
          <p className="text-sm text-text-secondary mt-1">{pathways.recommended.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pathways.recommended.timeline}</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {pathways.recommended.cost}</span>
          </div>
        </div>

        {/* Designations */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-3">
            Special Designations Eligibility
          </h4>
          <div className="space-y-2">
            {pathways.designations.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-brand-darker border border-brand-border/30">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  d.eligible ? 'bg-success/15' : 'bg-brand-darker'
                }`}>
                  {d.eligible ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-text-muted/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${d.eligible ? 'text-text-primary' : 'text-text-muted'}`}>
                    {d.name}
                  </p>
                  <p className="text-xs text-text-muted">{d.rationale}</p>
                </div>
                {d.eligible && (
                  <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    Eligible
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-3">
            Estimated Development Timeline
          </h4>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {pathways.timeline.map((phase, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center flex-shrink-0 min-w-[90px]">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    i === 0 ? 'bg-brand-yellow/20 text-brand-yellow' :
                    i === pathways.timeline.length - 1 ? 'bg-success/20 text-success' :
                    'bg-info/20 text-info'
                  )}>
                    {i + 1}
                  </div>
                  <p className="text-xs font-medium text-text-primary mt-1.5 text-center">{phase.name}</p>
                  <p className="text-[10px] text-text-muted text-center">{phase.duration}</p>
                </div>
                {i < pathways.timeline.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-text-muted/30 flex-shrink-0 mt-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Key References */}
        <div className="pt-2 border-t border-brand-border/50">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[10px] font-semibold text-text-muted tracking-wider uppercase">Key FDA Guidance</span>
          </div>
          <div className="space-y-1">
            {pathways.references.map((ref, i) => (
              <p key={i} className="text-xs text-text-muted">• {ref}</p>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Rules-based pathway analysis
function analyzePathways({ indication, score, evidenceCount, scientificScore, feasibilityScore, marketData }) {
  const ind = indication.toLowerCase();

  // Determine recommended pathway
  let recommended;
  if (feasibilityScore >= 60 || score >= 55) {
    recommended = {
      name: '505(b)(2) — Modified New Drug Application',
      description: 'Leverages existing safety and efficacy data from the approved drug. Most efficient pathway for repurposing since the drug already has established safety profile.',
      timeline: '2–4 years',
      cost: '$20M–$80M',
      color: 'text-success',
      bg: 'bg-success/5',
      border: 'border-success/20',
    };
  } else if (scientificScore >= 50) {
    recommended = {
      name: '505(b)(1) — Full NDA (New Drug Application)',
      description: 'Complete clinical development program required. Necessary when the repurposed indication significantly differs from the original approval.',
      timeline: '5–8 years',
      cost: '$100M–$300M',
      color: 'text-info',
      bg: 'bg-info/5',
      border: 'border-info/20',
    };
  } else {
    recommended = {
      name: 'Investigational New Drug (IND) — Exploratory',
      description: 'Further pre-clinical and early clinical investigation needed before committing to a full regulatory pathway.',
      timeline: '1–3 years (exploratory)',
      cost: '$5M–$20M',
      color: 'text-brand-yellow',
      bg: 'bg-brand-yellow/5',
      border: 'border-brand-yellow/20',
    };
  }

  // Rare disease / orphan drug check
  const rareIndicators = ['rare', 'orphan', 'als', 'huntington', 'cystic fibrosis', 'duchenne', 'sma', 'gaucher', 'fabry'];
  const isRare = rareIndicators.some(r => ind.includes(r));

  // Serious condition check
  const seriousIndicators = ['cancer', 'tumor', 'leukemia', 'lymphoma', 'carcinoma', 'als', 'alzheimer', 'parkinson', 'meningitis', 'sepsis', 'heart failure'];
  const isSerious = seriousIndicators.some(s => ind.includes(s));

  // High unmet need
  const highUnmetNeed = score >= 55 && evidenceCount <= 15;

  const designations = [
    {
      name: 'Orphan Drug Designation',
      eligible: isRare,
      rationale: isRare
        ? 'Indication may affect fewer than 200,000 US patients, qualifying for 7-year market exclusivity'
        : 'Indication does not appear to meet the rare disease threshold (<200,000 US patients)',
    },
    {
      name: 'Fast Track Designation',
      eligible: isSerious && highUnmetNeed,
      rationale: (isSerious && highUnmetNeed)
        ? 'Serious condition with evidence of unmet medical need — eligible for rolling review'
        : 'Requires evidence of serious condition AND unmet need for qualification',
    },
    {
      name: 'Breakthrough Therapy',
      eligible: isSerious && scientificScore >= 65,
      rationale: (isSerious && scientificScore >= 65)
        ? 'Strong preliminary evidence of substantial improvement over existing therapies'
        : 'Requires preliminary clinical evidence of substantial improvement over available therapy',
    },
    {
      name: 'Accelerated Approval',
      eligible: isSerious && score >= 60,
      rationale: (isSerious && score >= 60)
        ? 'Surrogate endpoint data may support accelerated approval with post-marketing confirmatory trial'
        : 'Requires surrogate endpoints reasonably likely to predict clinical benefit',
    },
  ];

  const timeline = [
    { name: 'Pre-IND', duration: '6–12 mo' },
    { name: 'Phase I', duration: '12–18 mo' },
    { name: 'Phase II', duration: '18–24 mo' },
    { name: 'Phase III', duration: '24–36 mo' },
    { name: 'NDA/Filing', duration: '12 mo' },
    { name: 'Approval', duration: '—' },
  ];

  const references = [
    'FDA Guidance: 505(b)(2) Applications (2023)',
    'FDA Drug Repurposing Pathway Guidelines',
    'ICH E8(R1): General Considerations for Clinical Studies',
    isRare ? 'FDA Orphan Drug Act — 21 CFR Part 316' : 'FDA Guidance: Expedited Programs for Serious Conditions',
  ];

  return { recommended, designations, timeline, references };
}

export default RegulatoryPathway;
