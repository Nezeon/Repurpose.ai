import React, { useState } from 'react';
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
} from 'lucide-react';
import useAppStore from '../store';
import { ROUTES } from '../utils/constants';
import { formatTimeAgo, formatDate, formatDrugName } from '../utils/formatters';
import { groupBy } from '../utils/helpers';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';

const History = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { searchHistory, clearHistory, deleteFromHistory } = useAppStore();

  // Filter by search query
  const filteredHistory = searchQuery
    ? searchHistory.filter((item) =>
        item.drugName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchHistory;

  // Group by date
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

  if (searchHistory.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-brand-slate rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            No Search History
          </h2>
          <p className="text-text-secondary mb-6">
            Your previous searches will appear here
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.SEARCH)}
            leftIcon={Search}
          >
            Start a Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Search History</h1>
          <p className="text-text-secondary">
            {searchHistory.length} previous searches
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleClearAll}
          leftIcon={Trash2}
          className="text-error hover:bg-error/10"
        >
          Clear All
        </Button>
      </div>

      {/* Search filter */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter history..."
          size="sm"
        />
      </div>

      {/* History list */}
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
      </div>

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
