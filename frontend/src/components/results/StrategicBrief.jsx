import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, TrendingUp, Clock, Users,
  DollarSign, Target, ArrowRight, Shield, Zap, FileText,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { formatDrugName } from '../../utils/formatters';
import Card from '../common/Card';

/**
 * AI Strategic Brief — Executive investment summary.
 * Props:
 *   drugName: string
 *   opportunities: array of top opportunities (pre-sorted by score)
 *   synthesis: string (AI-generated synthesis text)
 */
const StrategicBrief = ({ drugName, opportunities = [], synthesis = '' }) => {
  const top3 = opportunities.slice(0, 3);
  const topScore = top3[0]?.composite_score?.overall_score || top3[0]?.score || 0;

  // Derive recommendation from top score
  const recommendation = topScore >= 70
    ? { label: 'GO', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', icon: CheckCircle, desc: 'Strong evidence supports pursuing this opportunity' }
    : topScore >= 50
    ? { label: 'INVESTIGATE', color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', border: 'border-brand-yellow/30', icon: Target, desc: 'Promising signal — additional validation recommended' }
    : { label: 'NO-GO', color: 'text-error', bg: 'bg-error/10', border: 'border-error/30', icon: AlertTriangle, desc: 'Insufficient evidence for investment at this stage' };

  // Derive timeline based on evidence type and score
  const getTimeline = () => {
    if (topScore >= 70) return { phase: 'Phase II–III', years: '3–5 years', cost: '$50M–$200M' };
    if (topScore >= 55) return { phase: 'Phase I–II', years: '4–7 years', cost: '$20M–$100M' };
    return { phase: 'Pre-clinical', years: '6–10 years', cost: '$10M–$50M' };
  };
  const timeline = getTimeline();

  // Extract key risk from synthesis
  const extractRisk = () => {
    const riskPatterns = [
      /(?:key risk|main risk|primary concern|biggest challenge)[:\s]+([^.]+)/i,
      /(?:however|limitation|challenge|risk)[,\s]+([^.]+)/i,
    ];
    for (const pattern of riskPatterns) {
      const match = synthesis.match(pattern);
      if (match) return match[1].trim();
    }
    return 'Competition from established therapies and limited clinical evidence for repurposed indication';
  };

  if (top3.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="overflow-hidden">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-brand-yellow/10 via-brand-yellow/5 to-transparent px-6 py-4 border-b border-brand-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-yellow/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-yellow" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Strategic Investment Brief</h2>
                <p className="text-xs text-text-muted">{formatDrugName(drugName)} — Repurposing Assessment</p>
              </div>
            </div>

            {/* Recommendation badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${recommendation.bg} ${recommendation.border}`}>
              <recommendation.icon className={`w-5 h-5 ${recommendation.color}`} />
              <div>
                <p className={`text-sm font-bold ${recommendation.color}`}>{recommendation.label}</p>
                <p className="text-[10px] text-text-muted">{recommendation.desc}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Top 3 Opportunities */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-3">
              Top Opportunities
            </h3>
            <div className="space-y-3">
              {top3.map((opp, i) => {
                const score = opp.composite_score?.overall_score || opp.score || 0;
                const sci = opp.composite_score?.scientific_evidence?.score || opp.scientific || 0;
                const mkt = opp.composite_score?.market_opportunity?.score || opp.market || 0;
                const indication = opp.indication || opp.name;
                const evidenceCount = opp.evidence_count || opp.evidenceCount || 0;

                return (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-brand-darker border border-brand-border/30">
                    {/* Rank */}
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0',
                      i === 0 ? 'bg-brand-yellow/20 text-brand-yellow' :
                      i === 1 ? 'bg-brand-teal/20 text-brand-teal' :
                      'bg-info/20 text-info'
                    )}>
                      {i + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{indication}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {evidenceCount} evidence items • Scientific: {Math.round(sci)} • Market: {Math.round(mkt)}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p className={cn(
                        'text-lg font-bold font-mono',
                        score >= 70 ? 'text-success' : score >= 50 ? 'text-brand-yellow' : 'text-text-muted'
                      )}>
                        {score.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-text-muted">Composite</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-brand-darker border border-brand-border/30 text-center">
              <Clock className="w-5 h-5 text-info mx-auto mb-2" />
              <p className="text-sm font-bold text-text-primary">{timeline.years}</p>
              <p className="text-[10px] text-text-muted">Est. Timeline</p>
              <p className="text-[10px] text-text-muted mt-0.5">{timeline.phase}</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-darker border border-brand-border/30 text-center">
              <DollarSign className="w-5 h-5 text-success mx-auto mb-2" />
              <p className="text-sm font-bold text-text-primary">{timeline.cost}</p>
              <p className="text-[10px] text-text-muted">Est. Investment</p>
              <p className="text-[10px] text-text-muted mt-0.5">Development cost</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-darker border border-brand-border/30 text-center">
              <Users className="w-5 h-5 text-brand-yellow mx-auto mb-2" />
              <p className="text-sm font-bold text-text-primary">{opportunities.length}</p>
              <p className="text-[10px] text-text-muted">Opportunities</p>
              <p className="text-[10px] text-text-muted mt-0.5">Across indications</p>
            </div>
          </div>

          {/* Key Risk */}
          <div className="p-4 rounded-xl bg-error/5 border border-error/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-error uppercase tracking-wider mb-1">Key Risk</p>
                <p className="text-sm text-text-secondary">{extractRisk()}</p>
              </div>
            </div>
          </div>

          {/* Recommended Next Steps */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-3">
              Recommended Next Steps
            </h3>
            <div className="space-y-2">
              {[
                { icon: Zap, text: `Conduct deep-dive feasibility study on ${top3[0]?.indication || 'top indication'}` },
                { icon: Shield, text: 'Commission detailed safety and IP landscape review' },
                { icon: TrendingUp, text: 'Validate market assumptions with KOL advisory board' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-brand-darker/50">
                  <div className="w-6 h-6 rounded bg-brand-yellow/10 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-3.5 h-3.5 text-brand-yellow" />
                  </div>
                  <p className="text-sm text-text-secondary">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StrategicBrief;
