import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { AGENTS, EY_AGENT_GROUPS } from '../../utils/constants';
import { formatDuration } from '../../utils/formatters';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import AgentStatus from './AgentStatus';

// Build grouped agent view from EY_AGENT_GROUPS
const GROUPED_AGENTS = Object.entries(EY_AGENT_GROUPS)
  .filter(([key]) => key !== 'report_generator') // Report runs after pipeline
  .map(([key, group]) => ({
    id: key,
    name: group.name.replace(' Agent', ''),
    icon: group.icon,
    description: group.description,
    childAgentIds: AGENTS.filter((a) => a.eyGroup === key).map((a) => a.id),
  }));

const SearchProgress = ({
  drugName,
  agentProgress = {},
  workflowStatus,
  elapsedTime = 0,
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate grouped agent progress
  const groupedProgress = useMemo(() => {
    return GROUPED_AGENTS.map((group) => {
      const children = group.childAgentIds.map((id) => ({
        id,
        ...(agentProgress[id] || { status: 'pending' }),
      }));
      const totalEvidence = children.reduce(
        (sum, c) => sum + (c.evidenceCount || 0),
        0
      );
      const allDone = children.length > 0 && children.every(
        (c) => c.status === 'success' || c.status === 'error'
      );
      const anyRunning = children.some((c) => c.status === 'running');
      const anyError = children.some((c) => c.status === 'error');
      const allSuccess = children.length > 0 && children.every((c) => c.status === 'success');

      let status = 'pending';
      if (allSuccess) status = 'success';
      else if (allDone && anyError) status = 'success'; // partial success
      else if (anyRunning) status = 'running';

      return {
        ...group,
        status,
        evidenceCount: totalEvidence,
        children,
        message: anyRunning
          ? `Querying ${children.filter((c) => c.status === 'running').length} sources...`
          : allDone
            ? `${totalEvidence} evidence items`
            : group.description,
      };
    });
  }, [agentProgress]);

  // Overall progress based on grouped agents
  const { completedCount, totalAgents, percentage } = useMemo(() => {
    const total = GROUPED_AGENTS.length;
    const completed = groupedProgress.filter(
      (g) => g.status === 'success'
    ).length;
    const pct = Math.round((completed / total) * 100);
    return { completedCount: completed, totalAgents: total, percentage: pct };
  }, [groupedProgress]);

  // Get current stage message
  const stageMessage = workflowStatus?.message || 'Master Agent orchestrating worker agents...';

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

      {/* Grouped agent grid (7 worker agents) */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Worker Agents
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
          {groupedProgress.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <AgentStatus
                agent={group}
                status={group.status}
                evidenceCount={group.evidenceCount}
                message={group.message}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expandable details: individual data sources */}
      <div className="mt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showDetails ? 'Hide' : 'Show'} {AGENTS.length} individual data sources
        </button>
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3 pt-3 border-t border-brand-border">
                {AGENTS.map((agent) => {
                  const status = agentProgress[agent.id] || { status: 'pending' };
                  return (
                    <AgentStatus
                      key={agent.id}
                      agent={agent}
                      status={status.status}
                      evidenceCount={status.evidenceCount}
                      message={status.message}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Workflow stages (optional) */}
      {workflowStatus?.stage && (
        <div className="mt-4 pt-4 border-t border-brand-border">
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
