import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { formatDrugName } from '../../utils/formatters';

const routeLabels = {
  chat: 'AI Assistant',
  dashboard: 'Dashboard',
  search: 'Drug Search',
  results: 'Results',
  history: 'History',
  saved: 'Saved Opportunities',
  integrations: 'Integrations',
  settings: 'Settings',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    // Check if this segment is a drug name param (results/:drugName)
    const isParam = params.drugName && seg === params.drugName;
    const label = isParam ? formatDrugName(decodeURIComponent(seg)) : (routeLabels[seg] || seg);
    const isLast = i === segments.length - 1;

    return { label, path, isLast };
  });

  return (
    <nav className="flex items-center gap-1.5 text-xs">
      <Link
        to="/dashboard"
        className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
      >
        <Home className="w-3 h-3" />
      </Link>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-3 h-3 text-text-muted/50" />
          {crumb.isLast ? (
            <span className="text-text-secondary font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
