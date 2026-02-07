import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Filter } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { groupBy } from '../../utils/helpers';
import { EVIDENCE_SOURCES } from '../../utils/constants';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import EvidenceItem from './EvidenceItem';

const EvidencePanel = ({
  isOpen,
  onClose,
  indication,
  evidenceItems = [],
  className,
}) => {
  const [selectedSource, setSelectedSource] = useState('all');

  // Group evidence by source
  const groupedEvidence = useMemo(() => {
    return groupBy(evidenceItems, 'source');
  }, [evidenceItems]);

  // Get unique sources
  const sources = useMemo(() => {
    const sourceList = Object.keys(groupedEvidence);
    return sourceList.sort((a, b) => {
      return (groupedEvidence[b]?.length || 0) - (groupedEvidence[a]?.length || 0);
    });
  }, [groupedEvidence]);

  // Filter evidence
  const filteredEvidence = useMemo(() => {
    if (selectedSource === 'all') {
      return evidenceItems;
    }
    return groupedEvidence[selectedSource] || [];
  }, [evidenceItems, groupedEvidence, selectedSource]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className={cn(
              'fixed lg:relative right-0 top-0 bottom-0 w-full max-w-md lg:max-w-none',
              'bg-brand-darker border-l border-brand-border overflow-hidden z-50',
              'flex flex-col',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <div>
                <h3 className="font-semibold text-text-primary">{indication}</h3>
                <p className="text-sm text-text-muted">
                  {evidenceItems.length} evidence items
                </p>
              </div>
              <Button variant="ghost" onClick={onClose} className="p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Source filters */}
            <div className="p-4 border-b border-brand-border">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary">Filter by source</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSource('all')}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    selectedSource === 'all'
                      ? 'bg-brand-yellow/20 text-brand-yellow'
                      : 'bg-brand-slate text-text-secondary hover:text-text-primary'
                  )}
                >
                  All ({evidenceItems.length})
                </button>
                {sources.map((source) => {
                  const config = EVIDENCE_SOURCES[source];
                  const count = groupedEvidence[source]?.length || 0;
                  return (
                    <button
                      key={source}
                      onClick={() => setSelectedSource(source)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                        selectedSource === source
                          ? 'bg-brand-yellow/20 text-brand-yellow'
                          : 'bg-brand-slate text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {config?.label || source} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Evidence list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredEvidence.map((item, index) => (
                <motion.div
                  key={`${item.source}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <EvidenceItem evidence={item} />
                </motion.div>
              ))}

              {filteredEvidence.length === 0 && (
                <div className="text-center py-8 text-text-muted">
                  No evidence items found
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EvidencePanel;
