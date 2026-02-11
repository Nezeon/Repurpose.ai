import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Clock,
  Bookmark,
  TrendingUp,
  GitCompareArrows,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  Dna,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { NAV_ITEMS, ROUTES } from '../../utils/constants';
import Badge from '../common/Badge';
import Tooltip from '../common/Tooltip';
import useAppStore from '../../store';

// Icon mapping
const icons = {
  LayoutDashboard,
  Search,
  Clock,
  Bookmark,
  TrendingUp,
  GitCompareArrows,
  Plug,
  Settings,
  MessageSquare,
};

const Sidebar = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, savedOpportunities } = useAppStore();

  const navSections = [
    { title: 'MAIN', items: NAV_ITEMS.main },
    { title: 'INTELLIGENCE', items: NAV_ITEMS.intelligence },
    { title: 'CONFIGURATION', items: NAV_ITEMS.configuration },
  ];

  const isActive = (path) => {
    if (path === ROUTES.RESULTS) {
      return location.pathname.startsWith('/results');
    }
    return location.pathname === path;
  };

  const NavItem = ({ item }) => {
    const Icon = icons[item.icon] || LayoutDashboard;
    const active = isActive(item.path);
    const savedCount = item.path === ROUTES.SAVED ? savedOpportunities?.length : null;

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative group',
          active
            ? 'bg-brand-yellow/10 text-text-primary'
            : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
        )}
      >
        {/* Active indicator */}
        {active && (
          <motion.div
            layoutId="sidebar-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-yellow rounded-r"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}

        <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-brand-yellow')} />

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {!sidebarCollapsed && item.badge && (
          <Badge
            variant={item.badge === 'NEW' ? 'teal' : 'yellow'}
            size="sm"
            className="ml-auto"
          >
            {item.badge}
          </Badge>
        )}

        {/* Saved count badge */}
        {!sidebarCollapsed && savedCount > 0 && (
          <Badge variant="teal" size="sm" className="ml-auto">
            {savedCount}
          </Badge>
        )}
      </NavLink>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip content={item.label} position="right">
          {content}
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 280 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-brand-darker border-r border-brand-border flex flex-col flex-shrink-0"
    >
      {/* Logo */}
      <div className="p-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-yellow/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Dna className="w-6 h-6 text-brand-yellow" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-bold text-text-primary whitespace-nowrap">
                  Repurpose<span className="text-brand-yellow">.AI</span>
                </h1>
                <p className="text-xs text-text-muted whitespace-nowrap">Drug Intelligence Platform</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!sidebarCollapsed && (
          <div className="mt-3 h-0.5 bg-gradient-to-r from-brand-yellow via-brand-yellow/50 to-transparent rounded-full" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title}>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 mb-2 text-xs font-semibold text-text-muted tracking-wider"
                >
                  {section.title}
                </motion.h2>
              )}
            </AnimatePresence>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section and collapse toggle */}
      <div className="p-3 border-t border-brand-border space-y-2">
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2 rounded-lg',
            'text-text-secondary hover:text-text-primary hover:bg-white/5',
            'transition-all duration-200'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
