import React from 'react';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Bookmark, Database, Sparkles } from 'lucide-react';
import useAppStore from '../store';
import { StatsCard, RecentSearches, TrendingOpportunities, QuickActions } from '../components/dashboard';
import { SearchBox } from '../components/search';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, searchHistory, savedOpportunities } = useAppStore();
  const [searchValue, setSearchValue] = React.useState('');

  // Calculate stats
  const totalSearches = searchHistory?.length || 0;
  const totalOpportunities = searchHistory?.reduce(
    (acc, s) => acc + (s.opportunityCount || 0),
    0
  ) || 0;
  const savedCount = savedOpportunities?.length || 0;

  // Get top opportunities from saved
  const topOpportunities = savedOpportunities?.slice(0, 3) || [];

  const handleSearch = (drugName) => {
    navigate(`${ROUTES.SEARCH}?drug=${encodeURIComponent(drugName)}`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
        </h1>
        <p className="text-text-secondary">
          Here's your drug repurposing intelligence overview
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Searches Today"
          value={totalSearches}
          icon={Search}
          iconColor="#FFE600"
          changeLabel="this week"
        />
        <StatsCard
          title="Opportunities Found"
          value={totalOpportunities}
          icon={Lightbulb}
          iconColor="#00D4AA"
          changeLabel="total"
        />
        <StatsCard
          title="Saved Items"
          value={savedCount}
          icon={Bookmark}
          iconColor="#00B4D8"
          changeLabel="bookmarked"
        />
        <StatsCard
          title="Data Sources"
          value={15}
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

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent searches - spans 2 columns */}
        <div className="lg:col-span-2">
          <RecentSearches searches={searchHistory} maxItems={5} />
        </div>

        {/* Quick actions */}
        <QuickActions />
      </div>

      {/* Bottom section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <TrendingOpportunities opportunities={topOpportunities} />
      </div>
    </div>
  );
};

export default Dashboard;
