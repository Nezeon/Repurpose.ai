import React, { forwardRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

const SearchInput = forwardRef(
  (
    {
      value,
      onChange,
      onClear,
      onSubmit,
      placeholder = 'Search...',
      loading = false,
      size = 'md',
      className,
      autoFocus = false,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: {
        input: 'py-2 pl-9 pr-9 text-sm',
        icon: 'left-2.5 w-4 h-4',
        clear: 'right-2.5 w-4 h-4',
      },
      md: {
        input: 'py-3 pl-11 pr-11 text-base',
        icon: 'left-3.5 w-5 h-5',
        clear: 'right-3.5 w-5 h-5',
      },
      lg: {
        input: 'py-4 pl-14 pr-14 text-lg',
        icon: 'left-4 w-6 h-6',
        clear: 'right-4 w-6 h-6',
      },
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && onSubmit) {
        onSubmit(value);
      }
    };

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange({ target: { value: '' } });
      }
    };

    return (
      <div className={cn('relative', className)}>
        {/* Search icon */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-text-muted pointer-events-none',
            sizes[size].icon
          )}
        >
          {loading ? (
            <Loader2 className="w-full h-full animate-spin" />
          ) : (
            <Search className="w-full h-full" />
          )}
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full bg-brand-darker border border-brand-border rounded-lg',
            'text-text-primary placeholder-text-muted',
            'focus:outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/20',
            'transition-all duration-200',
            sizes[size].input
          )}
          {...props}
        />

        {/* Clear button */}
        {value && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary',
              'transition-colors duration-200',
              sizes[size].clear
            )}
          >
            <X className="w-full h-full" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
