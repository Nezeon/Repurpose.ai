/**
 * AgentCard Component
 * Displays status of a single AI agent
 * EY Healthcare Theme
 */

import React from 'react';
import { BookOpen, Stethoscope, FlaskConical, FileText, Database, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

const AGENT_CONFIG = {
  LiteratureAgent: {
    icon: BookOpen,
    name: 'Literature Search',
    description: 'PubMed & Scientific Papers',
    color: 'blue',
  },
  ClinicalTrialsAgent: {
    icon: Stethoscope,
    name: 'Clinical Trials',
    description: 'ClinicalTrials.gov Registry',
    color: 'teal',
  },
  BioactivityAgent: {
    icon: FlaskConical,
    name: 'Bioactivity Data',
    description: 'ChEMBL Molecular Data',
    color: 'purple',
  },
  PatentAgent: {
    icon: FileText,
    name: 'Patent Analysis',
    description: 'Lens.org Patent Database',
    color: 'yellow',
  },
  InternalAgent: {
    icon: Database,
    name: 'Internal Database',
    description: 'Proprietary R&D Data',
    color: 'green',
  },
};

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: 'text-blue-400',
  },
  teal: {
    bg: 'bg-health-teal/10',
    border: 'border-health-teal/30',
    text: 'text-health-teal',
    icon: 'text-health-teal',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    icon: 'text-purple-400',
  },
  yellow: {
    bg: 'bg-brand-yellow/10',
    border: 'border-brand-yellow/30',
    text: 'text-brand-yellow',
    icon: 'text-brand-yellow',
  },
  green: {
    bg: 'bg-health-green/10',
    border: 'border-health-green/30',
    text: 'text-health-green',
    icon: 'text-health-green',
  },
};

const AgentCard = ({ agentName, status = 'pending', evidenceCount = 0, message = '' }) => {
  const config = AGENT_CONFIG[agentName] || {
    icon: Database,
    name: agentName,
    description: '',
    color: 'blue',
  };
  const Icon = config.icon;
  const colors = COLOR_MAP[config.color];

  // Get status-specific styling
  const getStatusStyle = () => {
    switch (status) {
      case 'success':
        return 'border-health-green/30 bg-health-green/5';
      case 'running':
        return 'border-brand-yellow/30 bg-brand-yellow/5';
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-health-green" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return `Found ${evidenceCount} items`;
      case 'running':
        return message || 'Searching...';
      case 'error':
        return message || 'Search failed';
      default:
        return 'Waiting...';
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-300 ${getStatusStyle()}`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white truncate">
              {config.name}
            </h3>
            {getStatusIcon()}
          </div>

          <p className="text-sm text-gray-500 mb-2">
            {config.description}
          </p>

          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              status === 'success' ? 'bg-health-green/20 text-health-green' :
              status === 'running' ? 'bg-brand-yellow/20 text-brand-yellow' :
              status === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {getStatusText()}
            </span>

            {status === 'success' && evidenceCount > 0 && (
              <span className="text-sm font-bold text-health-green">
                +{evidenceCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar for running state */}
      {status === 'running' && (
        <div className="mt-3 h-1 bg-brand-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-yellow to-brand-gold rounded-full animate-pulse"
            style={{ width: '60%' }}
          />
        </div>
      )}
    </div>
  );
};

export default AgentCard;
