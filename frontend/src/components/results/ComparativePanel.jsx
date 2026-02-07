import React from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  Pill,
  Clock,
  Syringe,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { cn } from '../../utils/helpers';

/**
 * ComparativePanel - Shows comparison with standard of care treatments
 * Displays: comparator drugs, advantages, and side effect comparison
 */
const ComparativePanel = ({
  comparatorDrugs = [],
  comparativeAdvantages = [],
  sideEffectComparison,
  drugName,
}) => {
  // Get icon for advantage category
  const getCategoryIcon = (category) => {
    const icons = {
      administration: Syringe,
      dosing: Clock,
      safety: Shield,
      access: DollarSign,
      efficacy: TrendingUp,
      convenience: Users,
    };
    return icons[category?.toLowerCase()] || Scale;
  };

  // Get impact badge variant
  const getImpactVariant = (impact) => {
    const variants = {
      high: 'success',
      medium: 'warning',
      low: 'outline',
    };
    return variants[impact?.toLowerCase()] || 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Current Standard of Care */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-brand-teal" />
          Current Standard of Care
        </h3>

        {comparatorDrugs.length > 0 ? (
          <div className="space-y-4">
            {comparatorDrugs.map((drug, index) => (
              <motion.div
                key={drug.drug_name || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-brand-darker rounded-lg border border-brand-dark"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-text-primary">{drug.drug_name}</h4>
                    <p className="text-sm text-text-secondary mt-1">{drug.mechanism}</p>
                  </div>
                  {drug.market_share_percent && (
                    <Badge variant="outline" size="sm">
                      {drug.market_share_percent}% market share
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-text-muted" />
                    <span className="text-xs text-text-secondary">
                      {drug.administration_route || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <span className="text-xs text-text-secondary">
                      {drug.dosing_frequency || 'N/A'}
                    </span>
                  </div>
                  {drug.age_restrictions && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-text-muted" />
                      <span className="text-xs text-text-secondary">{drug.age_restrictions}</span>
                    </div>
                  )}
                  {drug.average_monthly_cost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-text-muted" />
                      <span className="text-xs text-text-secondary">
                        ${drug.average_monthly_cost.toLocaleString()}/mo
                      </span>
                    </div>
                  )}
                </div>

                {drug.key_side_effects && drug.key_side_effects.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brand-dark">
                    <p className="text-xs text-text-muted mb-2">Common Side Effects:</p>
                    <div className="flex flex-wrap gap-1">
                      {drug.key_side_effects.slice(0, 5).map((effect, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-orange-500/10 text-orange-400 rounded"
                        >
                          {effect}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-center py-6">
            No standard of care treatments identified for comparison
          </p>
        )}
      </Card>

      {/* Key Advantages */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Key Advantages of {drugName}
        </h3>

        {comparativeAdvantages.length > 0 ? (
          <div className="space-y-3">
            {comparativeAdvantages.map((adv, index) => {
              const CategoryIcon = getCategoryIcon(adv.category);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-4 rounded-lg border-l-4',
                    adv.impact === 'high'
                      ? 'bg-green-500/10 border-green-500'
                      : adv.impact === 'medium'
                      ? 'bg-yellow-500/10 border-yellow-500'
                      : 'bg-brand-darker border-brand-dark'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        adv.impact === 'high'
                          ? 'bg-green-500/20'
                          : adv.impact === 'medium'
                          ? 'bg-yellow-500/20'
                          : 'bg-brand-dark'
                      )}
                    >
                      <CategoryIcon
                        className={cn(
                          'w-4 h-4',
                          adv.impact === 'high'
                            ? 'text-green-400'
                            : adv.impact === 'medium'
                            ? 'text-yellow-400'
                            : 'text-text-muted'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-text-primary text-sm">
                          {adv.advantage_type}
                        </h4>
                        <Badge variant={getImpactVariant(adv.impact)} size="sm">
                          {adv.impact} impact
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{adv.description}</p>

                      {/* Comparison chips */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded">
                          Current: {adv.comparator_value}
                        </span>
                        <span className="text-text-muted">→</span>
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded">
                          {drugName}: {adv.candidate_value}
                        </span>
                      </div>

                      {adv.patient_benefit && (
                        <p className="text-xs text-brand-teal mt-2 italic">
                          Patient Benefit: {adv.patient_benefit}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-muted text-center py-6">
            Comparative advantage analysis in progress
          </p>
        )}
      </Card>

      {/* Side Effect Comparison */}
      {sideEffectComparison && (
        <Card className="p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Safety Profile Comparison
            {sideEffectComparison.comparator_drug && (
              <span className="text-sm font-normal text-text-muted">
                vs {sideEffectComparison.comparator_drug}
              </span>
            )}
          </h3>

          {/* Safety Advantage Score */}
          <div className="mb-6 p-4 bg-brand-darker rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Safety Advantage Score</span>
              <span
                className={cn(
                  'font-semibold',
                  sideEffectComparison.safety_advantage_score > 0.3
                    ? 'text-green-400'
                    : sideEffectComparison.safety_advantage_score < -0.3
                    ? 'text-red-400'
                    : 'text-yellow-400'
                )}
              >
                {sideEffectComparison.safety_advantage_score > 0 ? '+' : ''}
                {(sideEffectComparison.safety_advantage_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-brand-dark rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  sideEffectComparison.safety_advantage_score > 0
                    ? 'bg-green-500'
                    : sideEffectComparison.safety_advantage_score < 0
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                )}
                style={{
                  width: `${Math.abs(sideEffectComparison.safety_advantage_score) * 50 + 50}%`,
                  marginLeft:
                    sideEffectComparison.safety_advantage_score < 0
                      ? `${50 - Math.abs(sideEffectComparison.safety_advantage_score) * 50}%`
                      : '50%',
                }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {sideEffectComparison.safety_summary || 'Safety comparison based on available data'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Eliminated Side Effects */}
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Potentially Avoided
              </h4>
              {sideEffectComparison.eliminated_effects?.length > 0 ? (
                <div className="space-y-2">
                  {sideEffectComparison.eliminated_effects.map((effect, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-green-500/10 rounded text-xs"
                    >
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span className="text-text-primary">{effect.effect_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No side effects identified as avoided</p>
              )}
            </div>

            {/* Shared Effects */}
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                <MinusCircle className="w-4 h-4" />
                Shared with Current
              </h4>
              {sideEffectComparison.shared_effects?.length > 0 ? (
                <div className="space-y-2">
                  {sideEffectComparison.shared_effects.slice(0, 5).map((effect, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded text-xs"
                    >
                      <MinusCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      <span className="text-text-primary">{effect}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No shared side effects</p>
              )}
            </div>

            {/* New Concerns */}
            <div>
              <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                New Considerations
              </h4>
              {sideEffectComparison.new_concerns?.length > 0 ? (
                <div className="space-y-2">
                  {sideEffectComparison.new_concerns.map((effect, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-orange-500/10 rounded text-xs"
                    >
                      <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
                      <span className="text-text-primary">{effect.effect_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No new concerns identified</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {comparatorDrugs.length === 0 &&
        comparativeAdvantages.length === 0 &&
        !sideEffectComparison && (
          <Card className="p-8">
            <div className="text-center">
              <Scale className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Comparative Analysis Pending
              </h3>
              <p className="text-text-secondary text-sm">
                Comparative data against standard of care treatments is being analyzed.
                This information helps identify specific advantages for drug repurposing.
              </p>
            </div>
          </Card>
        )}
    </div>
  );
};

export default ComparativePanel;
