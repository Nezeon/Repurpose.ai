/**
 * ResultsDashboard Component
 * Main container for displaying search results
 * EY Healthcare Theme
 */

import React, { useState } from 'react';
import { FileText, BarChart3, Download, Clock, Database, Zap, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import IndicationList from './IndicationList';
import EvidenceChart from '../visualizations/EvidenceChart';
import AIAnalysisCard from './AIAnalysisCard';
import { exportPDF } from '../../services/api';

const ResultsDashboard = ({ results, onReanalyze, isReanalyzing }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [exportingPDF, setExportingPDF] = useState(false);

  if (!results) return null;

  const {
    drug_name,
    ranked_indications = [],
    all_evidence = [],
    synthesis = '',
    execution_time = 0,
    cached = false,
    cache_age = 0,
    timestamp = '',
  } = results;

  // Format cache age for display
  const formatCacheAge = (seconds) => {
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      const pdfBlob = await exportPDF(results);

      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${drug_name.replace(/\s+/g, '_')}_repurposing_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-brand-charcoal rounded-2xl border border-white/10 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h2 className="text-3xl font-bold text-white">
                {drug_name}
              </h2>
              {cached && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-sm font-medium text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Cached ({formatCacheAge(cache_age)})
                  </span>
                  {onReanalyze && (
                    <button
                      onClick={() => onReanalyze(drug_name)}
                      disabled={isReanalyzing}
                      className="flex items-center gap-1 px-3 py-1 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full text-sm font-medium text-brand-yellow hover:bg-brand-yellow/20 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                      {isReanalyzing ? 'Re-analyzing...' : 'Re-analyze'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-gray-300">
                <TrendingUp className="w-4 h-4 text-brand-yellow" />
                <span>{ranked_indications.length} opportunities</span>
              </span>

              <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-gray-300">
                <Database className="w-4 h-4 text-health-teal" />
                <span>{all_evidence.length} evidence items</span>
              </span>

              <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-gray-300">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{execution_time?.toFixed(2)}s</span>
              </span>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="btn-secondary flex items-center space-x-2"
          >
            {exportingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Synthesis */}
      {synthesis && (
        <AIAnalysisCard synthesis={synthesis} drugName={drug_name} />
      )}

      {/* Tabs */}
      <div className="bg-brand-charcoal rounded-2xl border border-white/10 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
              activeTab === 'list'
                ? 'text-brand-yellow border-b-2 border-brand-yellow bg-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Detailed List</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
              activeTab === 'chart'
                ? 'text-brand-yellow border-b-2 border-brand-yellow bg-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Visualization</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'list' && (
            <IndicationList indications={ranked_indications} />
          )}

          {activeTab === 'chart' && (
            <EvidenceChart indications={ranked_indications} maxItems={10} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
