import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import useAppStore from '../store';
import { clearCache } from '../services/api';
import { ROUTES } from '../utils/constants';

const settingsSections = [
  {
    id: 'account',
    title: 'Account',
    description: 'Manage your account settings and profile',
    icon: User,
    items: [
      { label: 'Profile Information', description: 'Update your name and email' },
      { label: 'Password', description: 'Change your password' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure how you receive updates',
    icon: Bell,
    items: [
      { label: 'Email Notifications', description: 'Analysis complete alerts' },
      { label: 'Browser Notifications', description: 'Desktop push notifications' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    description: 'Manage your data and security settings',
    icon: Shield,
    items: [
      { label: 'Data Export', description: 'Download your data' },
      { label: 'Delete Account', description: 'Permanently delete your account' },
    ],
  },
  {
    id: 'data',
    title: 'Data & Storage',
    description: 'Manage cached data and storage',
    icon: Database,
    items: [
      { label: 'Clear Cache', description: 'Remove cached search results' },
      { label: 'Search History', description: 'Manage your search history' },
    ],
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, sidebarCollapsed, toggleSidebar, clearHistory } = useAppStore();
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [cacheError, setCacheError] = useState(null);

  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheError(null);
    try {
      await clearCache();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setCacheError('Failed to clear cache. Please try again.');
      setTimeout(() => setCacheError(null), 5000);
    } finally {
      setClearingCache(false);
    }
  };

  const handleSearchHistory = () => {
    navigate(ROUTES.HISTORY);
  };

  const handleSettingAction = (sectionId, itemLabel) => {
    if (sectionId === 'data') {
      if (itemLabel === 'Clear Cache') {
        handleClearCache();
      } else if (itemLabel === 'Search History') {
        handleSearchHistory();
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-slate rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-text-muted" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-text-secondary">
              Manage your preferences and account
            </p>
          </div>
        </div>
      </div>

      {/* User info card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-yellow/20 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-brand-yellow" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">
              {user?.full_name || 'Guest User'}
            </h3>
            <p className="text-sm text-text-muted">
              {user?.email || 'Sign in to save your preferences'}
            </p>
          </div>
          <Button variant="secondary" size="sm">
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Quick settings */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-text-primary mb-4">Quick Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Compact Sidebar</p>
              <p className="text-sm text-text-muted">Show collapsed sidebar by default</p>
            </div>
            <button
              onClick={toggleSidebar}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                sidebarCollapsed ? 'bg-brand-yellow' : 'bg-brand-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Settings sections */}
      <div className="space-y-4">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-brand-darker rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-text-muted" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{section.title}</h3>
                    <p className="text-sm text-text-muted">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {section.items.map((item) => {
                    const isClearCache = section.id === 'data' && item.label === 'Clear Cache';
                    const isLoading = isClearCache && clearingCache;
                    const isSuccess = isClearCache && cacheCleared;
                    const hasError = isClearCache && cacheError;

                    return (
                      <button
                        key={item.label}
                        onClick={() => handleSettingAction(section.id, item.label)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-brand-darker transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-left">
                          <p className="font-medium text-text-primary">{item.label}</p>
                          <p className="text-sm text-text-muted">
                            {hasError ? (
                              <span className="text-error">{cacheError}</span>
                            ) : isSuccess ? (
                              <span className="text-success">Cache cleared successfully!</span>
                            ) : (
                              item.description
                            )}
                          </p>
                        </div>
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" />
                        ) : isSuccess ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : hasError ? (
                          <AlertCircle className="w-5 h-5 text-error" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Version info */}
      <div className="mt-8 text-center text-sm text-text-muted">
        <p>Repurpose.AI v2.0.0</p>
        <p className="mt-1">
          &copy; {new Date().getFullYear()} All rights reserved
        </p>
      </div>
    </div>
  );
};

export default Settings;
