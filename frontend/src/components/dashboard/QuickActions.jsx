import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Clock,
  Download,
  Settings,
  Bookmark,
  Plug,
  Sparkles,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';
import Card from '../common/Card';

const actions = [
  {
    id: 'chat',
    label: 'AI Assistant',
    description: 'Chat with agents',
    icon: MessageSquare,
    color: '#FFE600',
    route: ROUTES.CHAT,
    primary: true,
  },
  {
    id: 'search',
    label: 'Drug Search',
    description: 'Full pipeline',
    icon: Search,
    color: '#00D4AA',
    route: ROUTES.SEARCH,
  },
  {
    id: 'history',
    label: 'History',
    description: 'Searches & reports',
    icon: Clock,
    color: '#00B4D8',
    route: ROUTES.HISTORY,
  },
  {
    id: 'saved',
    label: 'Saved',
    description: 'Bookmarked items',
    icon: Bookmark,
    color: '#A78BFA',
    route: ROUTES.SAVED,
  },
];

const QuickActions = ({ className }) => {
  const navigate = useNavigate();

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-brand-yellow" />
        <h3 className="font-semibold text-text-primary">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(action.route)}
              className={cn(
                'p-4 rounded-xl text-left transition-all duration-200 group',
                action.primary
                  ? 'bg-brand-yellow/10 border border-brand-yellow/30 hover:bg-brand-yellow/20'
                  : 'bg-brand-darker hover:bg-brand-slate border border-transparent'
              )}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <p className={cn(
                'font-medium',
                action.primary ? 'text-brand-yellow' : 'text-text-primary'
              )}>
                {action.label}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {action.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickActions;
