import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { AGENTS } from '../../utils/constants';
import { formatDuration } from '../../utils/formatters';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import AgentStatus from './AgentStatus';

const SearchProgress = ({
  drugName,
  agentProgress = {},
  workflowStatus,
  elapsedTime = 0,
  className,
}) => {
  // Calculate overall progress
  const { completedCount, totalAgents, percentage } = useMemo(() => {
    const total = AGENTS.length;
    const completed = Object.values(agentProgress).filter(
      (agent) => agent.status === 'success' || agent.status === 'error'
    ).length;
    const pct = Math.round((completed / total) * 100);
    return { completedCount: completed, totalAgents: total, percentage: pct };
  }, [agentProgress]);

  // Get current stage message
  const stageMessage = workflowStatus?.message || 'Initializing analysis...';

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-yellow/20 rounded-xl flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Analyzing: <span className="text-brand-yellow">{drugName}</span>
            </h2>
            <p className="text-sm text-text-secondary">{stageMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-text-muted">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatDuration(elapsedTime)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Overall Progress</span>
          <span className="text-sm font-medium text-text-primary">
            {completedCount}/{totalAgents} agents
            <span className="text-text-muted ml-1">({percentage}%)</span>
          </span>
        </div>
        <ProgressBar
          value={completedCount}
          max={totalAgents}
          size="lg"
          color="#FFE600"
          animated
        />
      </div>

      {/* Agent grid */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Data Sources
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {AGENTS.map((agent, index) => {
            const status = agentProgress[agent.id] || { status: 'pending' };
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <AgentStatus
                  agent={agent}
                  status={status.status}
                  evidenceCount={status.evidenceCount}
                  message={status.message}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Workflow stages (optional) */}
      {workflowStatus?.stage && (
        <div className="mt-6 pt-4 border-t border-brand-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Stage:</span>
            <span className="text-xs text-text-secondary capitalize">
              {workflowStatus.stage.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SearchProgress;
