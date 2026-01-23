/**
 * SearchBar Component
 * Drug name search input with autocomplete suggestions
 * EY Healthcare Theme
 */

import React, { useState } from 'react';
import { Search, Sparkles, RotateCcw, Zap } from 'lucide-react';

const DEMO_DRUGS = [
  'Metformin',
  'Aspirin',
  'Ibuprofen',
  'Sildenafil',
  'Thalidomide',
  'Rapamycin',
  'Hydroxychloroquine',
  'Tamoxifen',
  'Valproic Acid',
  'Ketoconazole',
];

const SearchBar = ({ onSearch, isSearching = false }) => {
  const [drugName, setDrugName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = DEMO_DRUGS.filter((drug) =>
    drug.toLowerCase().includes(drugName.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (drugName.trim()) {
      onSearch(drugName.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setDrugName(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleReset = () => {
    setDrugName('');
    setShowSuggestions(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Input Container */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-yellow/20 via-health-teal/20 to-brand-yellow/20 rounded-2xl blur-xl opacity-50" />

          <div className="relative flex items-center bg-brand-charcoal border-2 border-white/10 rounded-2xl
                        focus-within:border-brand-yellow/50 focus-within:shadow-glow-yellow transition-all duration-300">
            {/* Search Icon */}
            <div className="pl-5 text-gray-500">
              <Search className="w-6 h-6" />
            </div>

            {/* Input */}
            <input
              type="text"
              value={drugName}
              onChange={(e) => {
                setDrugName(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(drugName.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Enter molecule name (e.g., Metformin, Aspirin, Sildenafil...)"
              className="flex-1 px-4 py-5 text-lg bg-transparent text-white placeholder-gray-500
                       focus:outline-none"
              disabled={isSearching}
            />

            {/* Right side buttons */}
            <div className="pr-3 flex items-center space-x-2">
              {drugName && !isSearching && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Clear"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              <button
                type="submit"
                disabled={!drugName.trim() || isSearching}
                className="btn-primary px-6 py-3 flex items-center space-x-2 rounded-xl"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-brand-charcoal border border-white/10 rounded-2xl shadow-2xl z-10 overflow-hidden animate-slide-up">
            <div className="py-2">
              <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                Quick Access - Pre-cached Molecules
              </div>
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center space-x-3 group"
                >
                  <Search className="w-4 h-4 text-gray-500 group-hover:text-brand-yellow transition-colors" />
                  <span className="text-white font-medium">{suggestion}</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-health-green font-medium bg-health-green/10 px-2 py-1 rounded-full">
                    <Zap className="w-3 h-3" />
                    Instant
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Quick access pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-gray-500 mr-2">Try:</span>
        {DEMO_DRUGS.slice(0, 5).map((drug) => (
          <button
            key={drug}
            onClick={() => handleSuggestionClick(drug)}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10
                     rounded-full hover:bg-brand-yellow/10 hover:border-brand-yellow/30 hover:text-brand-yellow
                     transition-all duration-200"
          >
            {drug}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
