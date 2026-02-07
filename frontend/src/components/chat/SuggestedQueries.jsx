import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const SuggestedQueries = ({ suggestions, onSelect, compact = false }) => {
  if (!suggestions || suggestions.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(suggestion)}
            className="text-xs px-3 py-1.5 rounded-full bg-brand-darker border border-brand-border text-text-secondary hover:text-brand-yellow hover:border-brand-yellow/30 transition-colors"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand-yellow" />
        <span className="text-sm font-medium text-text-muted">Try asking...</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.map((suggestion, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => onSelect(suggestion)}
            className="text-left text-sm px-4 py-3 rounded-xl bg-brand-slate border border-brand-border text-text-secondary hover:text-text-primary hover:border-brand-yellow/30 hover:bg-brand-yellow/5 transition-all"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQueries;
