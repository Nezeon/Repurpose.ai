/**
 * AgentProgress Component
 * Displays real-time progress of all 5 AI agents
 * EY Healthcare Theme
 */

import React from 'react';
import AgentCard from './AgentCard';
import { Activity, Zap } from 'lucide-react';

const AGENT_NAMES = [
  'LiteratureAgent',
  'ClinicalTrialsAgent',
  'BioactivityAgent',
  'PatentAgent',
  'InternalAgent',
];

const AgentProgress = ({ agentProgress = {}, show = false }) => {
  if (!show) return null;

  // Calculate overall progress
  const totalAgents = AGENT_NAMES.length;
  const completedAgents = Object.values(agentProgress).filter(
    (agent) => agent.status === 'success' || agent.status === 'error'
  ).length;
  const progressPercentage = (completedAgents / totalAgents) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto my-8 animate-slide-up">
      <div className="bg-brand-charcoal rounded-2xl border border-white/10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-yellow/20 rounded-xl blur-lg" />
              <div className="relative p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl">
                <Activity className="w-6 h-6 text-brand-yellow" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                AI Agents Working
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-yellow"></span>
                </span>
              </h2>
              <p className="text-sm text-gray-400">
                {completedAgents} of {totalAgents} agents completed
              </p>
            </div>
          </div>

          {/* Progress percentage */}
          <div className="text-right">
            <div className="text-3xl font-bold text-gradient">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-6 h-2 bg-brand-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-yellow to-brand-gold transition-all duration-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENT_NAMES.map((agentName) => {
            const agentData = agentProgress[agentName] || {};
            return (
              <AgentCard
                key={agentName}
                agentName={agentName}
                status={agentData.status || 'pending'}
                evidenceCount={agentData.evidenceCount || 0}
                message={agentData.message}
              />
            );
          })}
        </div>

        {/* Status message */}
        {progressPercentage === 100 && (
          <div className="mt-6 p-4 bg-health-green/10 border border-health-green/30 rounded-xl">
            <p className="text-center text-health-green font-medium flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              All agents completed successfully! Analyzing results...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentProgress;
