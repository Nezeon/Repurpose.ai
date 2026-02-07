import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Clock,
  Bookmark,
  Settings,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

const navItems = [
  { path: ROUTES.DASHBOARD, label: 'Home', icon: LayoutDashboard },
  { path: ROUTES.SEARCH, label: 'Search', icon: Search },
  { path: ROUTES.HISTORY, label: 'History', icon: Clock },
  { path: ROUTES.SAVED, label: 'Saved', icon: Bookmark },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
];

const MobileNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === ROUTES.RESULTS) {
      return location.pathname.startsWith('/results');
    }
    return location.pathname === path;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-darker border-t border-brand-border z-50 safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center py-2 px-4 min-w-[60px]"
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-yellow rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 mb-1 transition-colors',
                  active ? 'text-brand-yellow' : 'text-text-muted'
                )}
              />
              <span
                className={cn(
                  'text-xs transition-colors',
                  active ? 'text-brand-yellow font-medium' : 'text-text-muted'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
