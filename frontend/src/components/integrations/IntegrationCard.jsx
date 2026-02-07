import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Settings, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/helpers';
import Badge from '../common/Badge';
import Button from '../common/Button';

const IntegrationCard = ({
  integration,
  onConfigure,
  onToggle,
  className,
}) => {
  const { name, description, icon: Icon, status, isPremium, docsUrl } = integration;
  const isActive = status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'p-5 rounded-xl border transition-all duration-200',
        isActive
          ? 'border-success/30 bg-success/5'
          : 'border-brand-border bg-brand-slate/50 hover:border-brand-border/80',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              isActive ? 'bg-success/20' : 'bg-brand-darker'
            )}
          >
            {Icon && <Icon className={cn('w-6 h-6', isActive ? 'text-success' : 'text-text-muted')} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary">{name}</h3>
              {isPremium && (
                <Badge variant="yellow" size="sm">Premium</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {isActive ? (
                <Badge variant="success" size="sm" dot>Active</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Inactive</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4">{description}</p>

      <div className="flex items-center gap-2">
        <Button
          variant={isActive ? 'secondary' : 'primary'}
          size="sm"
          onClick={onConfigure}
          leftIcon={Settings}
          className="flex-1"
        >
          Configure
        </Button>
        {!isPremium && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
          >
            {isActive ? 'Disable' : 'Enable'}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default IntegrationCard;
