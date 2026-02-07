import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Download,
  RefreshCw,
  FileText,
  FileJson,
  Clock,
  Database,
  CheckCircle,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { formatDuration, formatNumber, formatDrugName } from '../../utils/formatters';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Tooltip from '../common/Tooltip';

const ResultsHeader = ({
  drugName,
  totalEvidence,
  opportunityCount,
  executionTime,
  cached = false,
  onExportPDF,
  onExportJSON,
  onReanalyze,
  exportLoading = false,
  className,
}) => {
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4', className)}>
      {/* Left section - Drug info */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              {formatDrugName(drugName)}
            </h1>
            {cached && (
              <Tooltip content="Loaded from cache">
                <Badge variant="info" icon={Database}>
                  Cached
                </Badge>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" />
              {formatNumber(totalEvidence)} evidence items
            </span>
            <span className="text-text-muted">•</span>
            <span>{opportunityCount} opportunities</span>
            <span className="text-text-muted">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-text-muted" />
              {formatDuration(executionTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        {/* Re-analyze button */}
        <Tooltip content="Force refresh analysis">
          <Button
            variant="secondary"
            onClick={onReanalyze}
            leftIcon={RefreshCw}
          >
            Re-analyze
          </Button>
        </Tooltip>

        {/* Share button */}
        <Tooltip content="Share results">
          <Button variant="ghost" className="p-2.5">
            <Share2 className="w-5 h-5" />
          </Button>
        </Tooltip>

        {/* Export dropdown */}
        <div className="relative">
          <Button
            variant="primary"
            onClick={() => setShowExportMenu(!showExportMenu)}
            leftIcon={Download}
            loading={exportLoading}
          >
            Export
          </Button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-brand-slate border border-brand-border rounded-xl shadow-lg overflow-hidden z-50"
              >
                <button
                  onClick={() => {
                    onExportPDF?.();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export as PDF</span>
                </button>
                <button
                  onClick={() => {
                    onExportJSON?.();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <FileJson className="w-4 h-4" />
                  <span>Export as JSON</span>
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;
