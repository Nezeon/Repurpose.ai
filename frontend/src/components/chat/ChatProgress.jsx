import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2 } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import AgentStatus from '../search/AgentStatus';
import { AGENTS, EY_AGENT_GROUPS } from '../../utils/constants';

// Build grouped agent view for pipeline queries (same logic as SearchProgress)
const GROUPED_AGENTS = Object.entries(EY_AGENT_GROUPS)
  .filter(([key]) => key !== 'report_generator')
  .map(([key, group]) => ({
    id: key,
    name: group.name.replace(' Agent', ''),
    icon: group.icon,
    description: group.description,
    childAgentIds: AGENTS.filter((a) => a.eyGroup === key).map((a) => a.id),
  }));

// Config for non-pipeline chat agents
const CHAT_AGENT_CONFIG = {
  market:          { name: 'IQVIA Insights', icon: 'TrendingUp', description: 'Market data & analysis' },
  exim:            { name: 'EXIM Trade', icon: 'Globe', description: 'Trade data' },
  patent:          { name: 'Patent Landscape', icon: 'FileText', description: 'Patent search' },
  clinical_trials: { name: 'Clinical Trials', icon: 'Stethoscope', description: 'Trial pipeline' },
  internal:        { name: 'Internal Knowledge', icon: 'Database', description: 'Internal docs' },
  web:             { name: 'Web Intelligence', icon: 'BookOpen', description: 'Web search' },
  report:          { name: 'Report Generator', icon: 'FileText', description: 'Generating report' },
};

const ChatProgress = ({ agentsNeeded = [], agentNames = {}, agentProgress = {} }) => {
  const isPipeline = agentsNeeded.includes('pipeline');

  const hasReport = agentsNeeded.includes('report');

  // Build agent list based on query type
  const agents = useMemo(() => {
    if (isPipeline) {
      // Pipeline: group 18 individual agents into 6 EY groups
      const grouped = GROUPED_AGENTS.map((group) => {
        const children = group.childAgentIds.map((id) => ({
          id,
          ...(agentProgress[id] || { status: 'pending' }),
        }));
        const totalEvidence = children.reduce((sum, c) => sum + (c.evidenceCount || 0), 0);
        const allDone = children.length > 0 && children.every(
          (c) => c.status === 'success' || c.status === 'error'
        );
        const anyRunning = children.some((c) => c.status === 'running');
        const allSuccess = children.length > 0 && children.every((c) => c.status === 'success');

        let status = 'pending';
        if (allSuccess) status = 'success';
        else if (allDone) status = 'success';
        else if (anyRunning) status = 'running';

        return { ...group, status, evidenceCount: totalEvidence };
      });

      // If report agent is also requested, add it as a separate card
      if (hasReport) {
        const reportProgress = agentProgress['report'] || {};
        grouped.push({
          id: 'report',
          name: 'Report Generator',
          icon: 'FileText',
          description: 'Generating PDF report',
          status: reportProgress.status || 'pending',
          evidenceCount: 0,
        });
      }

      return grouped;
    }

    // Non-pipeline: show individual chat agents
    return agentsNeeded
      .filter((key) => key !== 'pipeline')
      .map((key) => {
        const config = CHAT_AGENT_CONFIG[key] || { name: key, icon: 'Database', description: '' };
        const progress = agentProgress[key] || {};
        return {
          id: key,
          name: agentNames[key] || config.name,
          icon: config.icon,
          description: config.description,
          status: progress.status || 'running',
          evidenceCount: progress.evidenceCount || 0,
        };
      });
  }, [isPipeline, hasReport, agentsNeeded, agentNames, agentProgress]);

  const completedCount = agents.filter((a) => a.status === 'success' || a.status === 'error').length;
  const totalCount = agents.length;

  // If no agents info received yet, show simple analyzing state
  if (totalCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-3"
      >
        <div className="w-8 h-8 bg-brand-yellow/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-brand-yellow" />
        </div>
        <div className="bg-brand-slate border border-brand-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />
            <span className="text-sm">Analyzing your query...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Determine grid columns based on agent count
  const gridCols = totalCount <= 2
    ? `grid-cols-${totalCount}`
    : totalCount <= 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 bg-brand-yellow/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-brand-yellow" />
      </div>
      <div className="flex-1 bg-brand-slate border border-brand-border rounded-xl px-4 py-3 space-y-3 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />
            <span className="text-sm font-medium">
              {isPipeline ? 'Running full analysis pipeline...' : 'Agents are working...'}
            </span>
          </div>
          <span className="text-xs text-text-muted font-mono">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={completedCount}
          max={totalCount}
          size="sm"
          color="#FFE600"
          animated
        />

        {/* Agent cards */}
        <div className={`grid ${gridCols} gap-2`}>
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <AgentStatus
                agent={agent}
                status={agent.status}
                evidenceCount={agent.evidenceCount}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatProgress;
