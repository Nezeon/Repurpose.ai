import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Lightbulb, Bookmark, Database, Sparkles,
  MessageSquare, FileText, Download, Loader2, Bot,
  ChevronRight, ArrowRight,
} from 'lucide-react';
import useAppStore from '../store';
import { StatsCard, RecentSearches, TrendingOpportunities, QuickActions } from '../components/dashboard';
import { SearchBox } from '../components/search';
import { useNavigate } from 'react-router-dom';
import { ROUTES, AGENTS, EY_AGENT_GROUPS } from '../utils/constants';
import { getConversations, getArchivedReports, downloadArchivedReport } from '../services/api';
import { formatTimeAgo, formatDrugName } from '../utils/formatters';
import { downloadFile } from '../utils/helpers';
import Card from '../components/common/Card';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, searchHistory, savedOpportunities } = useAppStore();
  const [searchValue, setSearchValue] = React.useState('');

  // API-fetched data
  const [conversations, setConversations] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // Calculate stats
  const totalSearches = searchHistory?.length || 0;
  const totalOpportunities = searchHistory?.reduce(
    (acc, s) => acc + (s.opportunityCount || 0),
    0
  ) || 0;
  const savedCount = savedOpportunities?.length || 0;
  const topOpportunities = savedOpportunities?.slice(0, 3) || [];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [convsResult, reportsResult] = await Promise.allSettled([
        getConversations(10),
        getArchivedReports(10),
      ]);
      if (convsResult.status === 'fulfilled') {
        setConversations(convsResult.value?.conversations || convsResult.value || []);
      }
      if (reportsResult.status === 'fulfilled') {
        setReports(reportsResult.value?.reports || reportsResult.value || []);
      }
    } catch (e) {
      // Silently fail - dashboard still works with local data
    } finally {
      setLoadingConvs(false);
      setLoadingReports(false);
    }
  };

  const handleSearch = (drugName) => {
    navigate(`${ROUTES.SEARCH}?drug=${encodeURIComponent(drugName)}`);
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

  const agentGroups = Object.entries(EY_AGENT_GROUPS);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
        </h1>
        <p className="text-text-secondary">
          Your drug repurposing intelligence overview
        </p>
      </motion.div>

      {/* Stats - 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Searches"
          value={totalSearches}
          icon={Search}
          iconColor="#FFE600"
          changeLabel="total"
        />
        <StatsCard
          title="Opportunities"
          value={totalOpportunities}
          icon={Lightbulb}
          iconColor="#00D4AA"
          changeLabel="found"
        />
        <StatsCard
          title="Conversations"
          value={conversations.length}
          icon={MessageSquare}
          iconColor="#00B4D8"
          changeLabel="total"
          loading={loadingConvs}
        />
        <StatsCard
          title="Reports"
          value={reports.length}
          icon={FileText}
          iconColor="#F472B6"
          changeLabel="generated"
          loading={loadingReports}
        />
        <StatsCard
          title="Saved Items"
          value={savedCount}
          icon={Bookmark}
          iconColor="#FBBF24"
          changeLabel="bookmarked"
        />
        <StatsCard
          title="Data Sources"
          value={AGENTS.length}
          icon={Database}
          iconColor="#A78BFA"
          changeLabel="active"
        />
      </div>

      {/* Quick search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-brand-yellow" />
          <h2 className="font-semibold text-text-primary">Quick Search</h2>
        </div>
        <SearchBox
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSubmit={handleSearch}
          placeholder="Enter a drug name to analyze..."
          recentSearches={searchHistory}
        />
      </motion.div>

      {/* Main content: Recent Searches + Recent Conversations + Quick Actions */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <RecentSearches searches={searchHistory} maxItems={4} />
        </div>

        {/* Recent Conversations */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-info" />
                <h3 className="font-semibold text-text-primary">Recent Conversations</h3>
              </div>
              <button
                onClick={() => navigate(ROUTES.CHAT)}
                className="text-xs text-text-muted hover:text-brand-yellow transition-colors flex items-center gap-1"
              >
                Open Chat <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {loadingConvs ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-brand-darker">
                    <div className="w-8 h-8 bg-brand-border rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-brand-border rounded w-3/4" />
                      <div className="h-2 bg-brand-border rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-sm">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No conversations yet</p>
                <button
                  onClick={() => navigate(ROUTES.CHAT)}
                  className="mt-2 text-brand-yellow hover:underline text-xs"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.slice(0, 4).map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => navigate(ROUTES.CHAT)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-brand-darker hover:bg-brand-slate transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-info" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {conv.preview || 'New conversation'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {conv.message_count} msgs &middot; {formatTimeAgo(conv.updated_at)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Bottom section: Trending Opportunities + Recent Reports */}
      <div className="grid lg:grid-cols-2 gap-6">
        <TrendingOpportunities opportunities={topOpportunities} />

        {/* Recent Reports */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-teal" />
              <h3 className="font-semibold text-text-primary">Recent Reports</h3>
            </div>
            <button
              onClick={() => navigate(ROUTES.HISTORY)}
              className="text-xs text-text-muted hover:text-brand-yellow transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {loadingReports ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-brand-darker">
                  <div className="w-8 h-8 bg-brand-border rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-brand-border rounded w-3/4" />
                    <div className="h-2 bg-brand-border rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No reports generated yet</p>
              <p className="text-xs mt-1">Export a PDF from search results or chat</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.slice(0, 4).map((report) => (
                <div
                  key={report.report_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-brand-darker group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      report.report_type === 'excel_report' ? 'bg-emerald-500/15' : 'bg-teal-500/15'
                    }`}>
                      <FileText className={`w-4 h-4 ${
                        report.report_type === 'excel_report' ? 'text-emerald-400' : 'text-teal-400'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {formatDrugName(report.drug_name)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {report.report_type === 'excel_report' ? 'Excel' : 'PDF'} &middot; {formatTimeAgo(report.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadReport(report)}
                    disabled={downloadingId === report.report_id}
                    className="p-2 text-text-muted hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-lg transition-colors flex-shrink-0"
                    title="Download report"
                  >
                    {downloadingId === report.report_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Pipeline Agent Groups */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-yellow" />
              <h3 className="font-semibold text-text-primary">Pipeline Agent Groups</h3>
            </div>
            <span className="text-xs text-text-muted">
              {AGENTS.length} agents across {agentGroups.length} groups
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {agentGroups.map(([key, group]) => (
              <div
                key={key}
                className="p-3 rounded-lg bg-brand-darker border border-brand-border/30 hover:border-brand-border/60 transition-colors"
              >
                <p className="text-sm font-medium text-text-primary truncate" title={group.name}>
                  {group.name.replace(' Agent', '')}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {group.agents.length} source{group.agents.length > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
