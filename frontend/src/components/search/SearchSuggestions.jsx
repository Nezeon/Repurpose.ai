import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, TrendingUp, Database } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { formatTimeAgo } from '../../utils/formatters';

const SearchSuggestions = ({
  isOpen,
  recentSearches = [],
  popularDrugs = [],
  cachedDrugs = [],
  onSelect,
  className,
}) => {
  if (!isOpen) return null;

  const hasContent = recentSearches.length > 0 || popularDrugs.length > 0 || cachedDrugs.length > 0;

  if (!hasContent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'absolute left-0 right-0 mt-2 bg-brand-slate border border-brand-border rounded-xl shadow-xl overflow-hidden z-50',
          className
        )}
      >
        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div className="p-3 border-b border-brand-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Recent
              </h4>
            </div>
            <div className="space-y-1">
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => onSelect(search.drugName)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-secondary rounded-lg hover:bg-brand-darker hover:text-text-primary transition-colors"
                >
                  <span>{search.drugName}</span>
                  <span className="text-xs text-text-muted">
                    {formatTimeAgo(search.timestamp)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cached drugs */}
        {cachedDrugs.length > 0 && (
          <div className="p-3 border-b border-brand-border">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-3.5 h-3.5 text-brand-teal" />
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Cached (Instant)
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {cachedDrugs.slice(0, 8).map((drug) => (
                <button
                  key={drug}
                  onClick={() => onSelect(drug)}
                  className="px-3 py-1.5 bg-brand-teal/10 text-sm text-brand-teal rounded-lg hover:bg-brand-teal/20 transition-colors"
                >
                  {drug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular drugs */}
        {popularDrugs.length > 0 && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-brand-yellow" />
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Popular
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularDrugs.map((drug) => (
                <button
                  key={drug}
                  onClick={() => onSelect(drug)}
                  className="px-3 py-1.5 bg-brand-darker text-sm text-text-secondary rounded-lg hover:bg-brand-yellow/10 hover:text-brand-yellow transition-colors"
                >
                  {drug}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchSuggestions;
