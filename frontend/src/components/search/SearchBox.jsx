import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, ChevronDown, X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import Button from '../common/Button';

const popularDrugs = [
  'Metformin',
  'Aspirin',
  'Ibuprofen',
  'Atorvastatin',
  'Omeprazole',
  'Lisinopril',
  'Amlodipine',
  'Gabapentin',
];

const SearchBox = ({
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder = 'Enter drug name...',
  recentSearches = [],
  className,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (value.trim() && !loading) {
      onSubmit(value.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (drug) => {
    onChange({ target: { value: drug } });
    setShowSuggestions(false);
    inputRef.current?.focus();
    // Auto-submit after short delay
    setTimeout(() => onSubmit(drug), 100);
  };

  const handleClear = () => {
    onChange({ target: { value: '' } });
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Main search container */}
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'relative flex items-center bg-brand-darker border-2 rounded-2xl transition-all duration-300',
            isFocused
              ? 'border-brand-yellow/50 shadow-glow-md'
              : 'border-brand-border hover:border-brand-border/80'
          )}
        >
          {/* Search icon */}
          <div className="pl-5 pr-3">
            {loading ? (
              <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-text-muted" />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={onChange}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 py-5 bg-transparent text-xl text-text-primary placeholder-text-muted focus:outline-none"
          />

          {/* Clear button */}
          {value && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Submit button */}
          <div className="pr-3">
            <Button
              type="submit"
              disabled={!value.trim() || loading}
              loading={loading}
              leftIcon={Sparkles}
              className="px-6"
            >
              Analyze
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && !loading && (recentSearches.length > 0 || popularDrugs.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 bg-brand-slate border border-brand-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="p-3 border-b border-brand-border">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Recent Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(search.drugName || search)}
                      className="px-3 py-1.5 bg-brand-darker text-sm text-text-secondary rounded-lg hover:bg-brand-border hover:text-text-primary transition-colors"
                    >
                      {search.drugName || search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular drugs */}
            <div className="p-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Popular Drugs
              </h4>
              <div className="flex flex-wrap gap-2">
                {popularDrugs.map((drug) => (
                  <button
                    key={drug}
                    onClick={() => handleSuggestionClick(drug)}
                    className="px-3 py-1.5 bg-brand-darker text-sm text-text-secondary rounded-lg hover:bg-brand-yellow/10 hover:text-brand-yellow transition-colors"
                  >
                    {drug}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBox;
