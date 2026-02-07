import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Stethoscope,
  Dna,
  FileText,
  Database,
  Shield,
  Target,
  GraduationCap,
  Pill,
  GitBranch,
  Atom,
  Book,
  Layers,
  Globe,
  Boxes,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { AGENT_STATUS } from '../../utils/constants';
import Tooltip from '../common/Tooltip';

// Icon mapping
const icons = {
  BookOpen,
  Stethoscope,
  Dna,
  FileText,
  Database,
  Shield,
  Target,
  GraduationCap,
  Pill,
  GitBranch,
  Atom,
  Book,
  Layers,
  Globe,
  Boxes,
};

const statusIcons = {
  pending: Clock,
  running: Loader2,
  success: CheckCircle,
  error: XCircle,
};

const AgentStatus = ({
  agent,
  status = 'pending',
  evidenceCount = 0,
  message,
  className,
}) => {
  const Icon = icons[agent.icon] || Database;
  const StatusIcon = statusIcons[status] || Clock;
  const statusConfig = AGENT_STATUS[status] || AGENT_STATUS.pending;

  const isRunning = status === 'running';
  const isComplete = status === 'success';
  const isError = status === 'error';

  return (
    <Tooltip content={message || agent.description} position="top">
      <motion.div
        animate={isComplete ? {
          scale: [1, 1.06, 1],
          transition: { duration: 0.4, ease: 'easeOut' }
        } : {}}
        className={cn(
          'relative p-3 rounded-xl border transition-all duration-300',
          isRunning && 'border-info/50 bg-info/5',
          isComplete && 'border-success/50 bg-success/10 shadow-[0_0_20px_rgba(0,212,170,0.25)]',
          isError && 'border-error/50 bg-error/5',
          !isRunning && !isComplete && !isError && 'border-brand-border bg-brand-darker',
          className
        )}
      >
        {/* Status indicator */}
        <div className="flex items-center justify-between mb-2">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300',
              isComplete && 'bg-success/20',
              isError && 'bg-error/20',
              isRunning && 'bg-info/20',
              !isComplete && !isError && !isRunning && 'bg-brand-border'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 transition-colors duration-300',
                isComplete && 'text-success',
                isError && 'text-error',
                isRunning && 'text-info',
                !isComplete && !isError && !isRunning && 'text-text-muted'
              )}
            />
          </div>

          <StatusIcon
            className={cn(
              'w-4 h-4',
              statusConfig.color,
              isRunning && 'animate-spin'
            )}
          />
        </div>

        {/* Agent name */}
        <p
          className={cn(
            'text-xs font-medium truncate transition-colors duration-300',
            isComplete ? 'text-text-primary' : 'text-text-secondary'
          )}
        >
          {agent.name}
        </p>

        {/* Evidence count (for completed agents) */}
        {isComplete && evidenceCount > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[10px] text-success mt-1 font-medium"
          >
            {evidenceCount} items
          </motion.p>
        )}

        {/* Error indicator */}
        {isError && (
          <p className="text-[10px] text-error mt-1">Failed</p>
        )}

        {/* Running pulse effect */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-xl border border-info"
          />
        )}

        {/* Success glow flash - plays once on completion */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 rounded-xl border-2 border-success"
              style={{ boxShadow: '0 0 25px rgba(0, 212, 170, 0.4)' }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Tooltip>
  );
};

export default AgentStatus;
