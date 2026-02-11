import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search, Copy, Download,
  ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import { cn } from '../../utils/helpers';

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Enterprise-grade interactive data table with sort, filter, pagination.
 *
 * Props:
 *   columns: [{ key, label, sortable, width, render, align }]
 *   data: [{ ... }]
 *   pageSize: number (default 10)
 *   searchable: bool
 *   exportable: bool
 *   title: string
 *   onRowClick: (row) => void
 *   selectedRow: any (row[idKey])
 *   idKey: string (default 'id')
 *   compact: bool
 */
const DataTable = ({
  columns = [],
  data = [],
  pageSize: initialPageSize = 10,
  searchable = true,
  exportable = false,
  title = '',
  onRowClick,
  selectedRow,
  idKey = 'id',
  compact = false,
  className,
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(0);
  };

  const handleCopyRow = (row, e) => {
    e.stopPropagation();
    const text = columns.map(c => `${c.label}: ${row[c.key] ?? ''}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleExportCSV = () => {
    const header = columns.map(c => c.label).join(',');
    const rows = sortedData.map(row =>
      columns.map(c => {
        const v = row[c.key];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? '';
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cellPadding = compact ? 'px-3 py-1.5' : 'px-4 py-3';

  return (
    <div className={cn('rounded-xl border border-brand-border overflow-hidden', className)}>
      {/* Toolbar */}
      {(title || searchable || exportable) && (
        <div className="flex items-center justify-between px-4 py-3 bg-brand-darker border-b border-brand-border gap-3">
          {title && (
            <h3 className="text-sm font-semibold text-text-primary whitespace-nowrap">{title}</h3>
          )}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {searchable && (
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                  placeholder="Filter..."
                  className="w-full pl-8 pr-3 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-brand-yellow/50"
                />
              </div>
            )}
            {exportable && (
              <button
                onClick={handleExportCSV}
                className="p-1.5 text-text-muted hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-lg transition-colors"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <span className="text-[10px] text-text-muted whitespace-nowrap">
              {sortedData.length} row{sortedData.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-darker/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    cellPadding,
                    'text-[10px] font-semibold text-text-muted tracking-wider uppercase text-left border-b border-brand-border whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable !== false && 'cursor-pointer select-none hover:text-text-primary transition-colors group'
                  )}
                  style={col.width ? { width: col.width } : {}}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )
                    )}
                  </span>
                </th>
              ))}
              <th className={cn(cellPadding, 'w-8 border-b border-brand-border')} />
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-text-muted">
                  {searchQuery ? `No results matching "${searchQuery}"` : 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, ri) => {
                const isSelected = selectedRow !== undefined && row[idKey] === selectedRow;
                return (
                  <motion.tr
                    key={row[idKey] || ri}
                    initial={false}
                    className={cn(
                      'border-b border-brand-border/30 transition-colors',
                      onRowClick && 'cursor-pointer',
                      isSelected ? 'bg-brand-yellow/10' : 'hover:bg-white/[0.02]'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          cellPadding,
                          'text-sm text-text-secondary',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.mono && 'font-mono text-xs'
                        )}
                      >
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                    <td className={cn(cellPadding, 'text-right')}>
                      <button
                        onClick={(e) => handleCopyRow(row, e)}
                        className="p-1 text-text-muted/0 hover:text-text-muted rounded opacity-0 group-hover:opacity-100"
                        style={{ opacity: undefined }}
                        title="Copy row"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-brand-darker border-t border-brand-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
              className="bg-brand-dark border border-brand-border rounded text-[10px] text-text-secondary px-1.5 py-0.5 outline-none"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted">
              {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
