import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Search,
  Trash2,
  ChevronRight,
  Calendar,
  Database,
  X,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import useAppStore from '../store';
import { ROUTES } from '../utils/constants';
import { formatTimeAgo, formatDate, formatDrugName } from '../utils/formatters';
import { groupBy, downloadFile } from '../utils/helpers';
import { getArchivedReports, downloadArchivedReport, deleteArchivedReport } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';

const History = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('searches');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const { searchHistory, clearHistory, deleteFromHistory } = useAppStore();

  // Load reports when switching to reports tab
  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab]);

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const data = await getArchivedReports(50);
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleDownloadReport = async (report) => {
    setDownloadingId(report.report_id);
    try {
      const blob = await downloadArchivedReport(report.report_id);
      const ext = report.report_type === 'excel_report' ? 'xlsx' : 'pdf';
      const mime = report.report_type === 'excel_report'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const name = `${report.drug_name.replace(/ /g, '_')}_report.${ext}`;
      downloadFile(blob, name, mime);
    } catch (error) {
      console.error('Failed to download report:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteReport = async (report) => {
    try {
      await deleteArchivedReport(report.report_id);
      setReports((prev) => prev.filter((r) => r.report_id !== report.report_id));
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  // Filter search history
  const filteredHistory = searchQuery
    ? searchHistory.filter((item) =>
        item.drugName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchHistory;

  // Filter reports
  const filteredReports = searchQuery
    ? reports.filter((r) =>
        r.drug_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;

  // Group search history by date
  const groupedHistory = groupBy(filteredHistory, (item) => {
    const date = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return formatDate(item.timestamp, { month: 'long', day: 'numeric' });
  });

  const handleViewResult = (item) => {
    navigate(`${ROUTES.RESULTS}/${encodeURIComponent(item.drugName)}`);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete && deleteFromHistory) {
      deleteFromHistory(itemToDelete.drugName, itemToDelete.timestamp);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleClearAll = () => {
    if (clearHistory) {
      clearHistory();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getReportTypeBadge = (type) => {
    switch (type) {
      case 'full_report':
        return <Badge variant="info" size="sm">Full Report</Badge>;
      case 'opportunity_report':
        return <Badge variant="success" size="sm">Opportunity</Badge>;
      case 'excel_report':
        return <Badge variant="warning" size="sm">Excel</Badge>;
      default:
        return <Badge variant="default" size="sm">{type}</Badge>;
    }
  };

  const isEmpty = searchHistory.length === 0 && reports.length === 0;

  if (isEmpty && activeTab === 'searches') {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          variant="history"
          title="No History Yet"
          description="Your previous searches and generated reports will appear here."
          actionLabel="Start a Search"
          onAction={() => navigate(ROUTES.SEARCH)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">History</h1>
          <p className="text-text-secondary">
            {searchHistory.length} searches, {reports.length} reports
          </p>
        </div>
        {activeTab === 'searches' && searchHistory.length > 0 && (
          <Button
            variant="ghost"
            onClick={handleClearAll}
            leftIcon={Trash2}
            className="text-error hover:bg-error/10"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-6 mb-6 border-b border-brand-border">
        <button
          onClick={() => setActiveTab('searches')}
          className={`pb-3 px-1 font-medium transition-colors relative ${
            activeTab === 'searches'
              ? 'text-brand-yellow'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search History
          </span>
          {activeTab === 'searches' && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-1 font-medium transition-colors relative ${
            activeTab === 'reports'
              ? 'text-brand-yellow'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Archived Reports
            {reports.length > 0 && (
              <span className="text-xs bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5 rounded-full">
                {reports.length}
              </span>
            )}
          </span>
          {activeTab === 'reports' && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow"
            />
          )}
        </button>
      </div>

      {/* Search filter */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'searches' ? 'Filter history...' : 'Filter reports...'}
          size="sm"
        />
      </div>

      {/* SEARCH HISTORY TAB */}
      {activeTab === 'searches' && (
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {date}
              </h3>

              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.drugName}-${item.timestamp}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card
                        hover
                        padding="none"
                        onClick={() => handleViewResult(item)}
                        className="group"
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center">
                              <Search className="w-5 h-5 text-brand-yellow" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">
                                {formatDrugName(item.drugName)}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-text-muted">
                                <span>{item.opportunityCount || 0} opportunities</span>
                                <span>•</span>
                                <span>{formatTimeAgo(item.timestamp)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.cached && (
                              <Badge variant="info" size="sm" icon={Database}>
                                Cached
                              </Badge>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item);
                              }}
                              className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && searchQuery && (
            <div className="text-center py-8 text-text-muted">
              No results match "{searchQuery}"
            </div>
          )}

          {searchHistory.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No searches yet. Start by searching for a drug.</p>
            </div>
          )}
        </div>
      )}

      {/* ARCHIVED REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-2">
          {reportsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-yellow" />
              <p className="text-text-muted">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? `No reports match "${searchQuery}"` : 'No reports generated yet. Export a PDF from search results.'}</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report.report_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card hover padding="none" className="group">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {formatDrugName(report.drug_name)}
                            {report.indication && (
                              <span className="text-text-muted font-normal ml-2">
                                — {report.indication}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-text-muted">
                            <span>{formatFileSize(report.file_size)}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(report.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getReportTypeBadge(report.report_type)}
                        <button
                          onClick={() => handleDownloadReport(report)}
                          disabled={downloadingId === report.report_id}
                          className="p-2 text-text-muted hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-lg transition-colors"
                          title="Download report"
                        >
                          {downloadingId === report.report_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report)}
                          className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete report"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Search"
        description={`Remove "${itemToDelete?.drugName}" from history?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-text-secondary">
          This action cannot be undone. The search results will still be available
          if you search for this drug again.
        </p>
      </Modal>
    </div>
  );
};

export default History;
