import React from 'react';

const TableRenderer = ({ table }) => {
  const rawColumns = table.columns || [];
  const rows = table.rows || [];

  if (!rawColumns.length || !rows.length) return null;

  // Normalize columns: support both string ("Score") and object ({key, label}) formats
  const columns = rawColumns.map((col) => {
    if (typeof col === 'string') {
      return { key: col, label: col };
    }
    return col;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-brand-border">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider bg-brand-darker"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-t border-brand-border/50 hover:bg-white/[0.02] transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={`${rowIdx}-${col.key || colIdx}`}
                  className="px-4 py-2.5 text-text-secondary whitespace-nowrap"
                >
                  {formatCellValue(row[col.key], col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function formatCellValue(value, key) {
  if (value === undefined || value === null) return '—';

  const keyLower = (key || '').toLowerCase();

  // Highlight overall scores
  if (keyLower === 'score' || keyLower === 'relevance') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const color = num >= 75 ? 'text-green-400' :
                    num >= 50 ? 'text-brand-yellow' :
                    num >= 25 ? 'text-orange-400' : 'text-red-400';
      return <span className={`font-mono font-semibold ${color}`}>{value}</span>;
    }
  }

  // Highlight dimension scores (Scientific, Market, Competition, Feasibility)
  if (['scientific', 'market', 'competition', 'feasibility'].includes(keyLower)) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const color = num >= 70 ? 'text-green-400' :
                    num >= 50 ? 'text-cyan-400' :
                    num >= 30 ? 'text-brand-yellow' : 'text-orange-400';
      return <span className={`font-mono text-xs ${color}`}>{value}</span>;
    }
  }

  // Highlight confidence
  if (keyLower === 'confidence') {
    const conf = String(value).toLowerCase();
    const color = conf.includes('very high') || conf.includes('veryhigh') ? 'text-green-400' :
                  conf.includes('high') ? 'text-green-300' :
                  conf.includes('moderate') ? 'text-brand-yellow' :
                  conf.includes('low') ? 'text-orange-400' : 'text-text-secondary';
    return <span className={`font-semibold ${color}`}>{value}</span>;
  }

  // FTO Risk highlighting
  if (keyLower === 'fto risk') {
    const risk = String(value).toLowerCase();
    const color = risk === 'high' ? 'text-red-400' :
                  risk === 'medium' ? 'text-orange-400' :
                  risk === 'low' ? 'text-brand-yellow' :
                  risk === 'clear' ? 'text-green-400' : 'text-text-secondary';
    return <span className={`font-semibold ${color}`}>{value}</span>;
  }

  // Patent status highlighting
  if (keyLower === 'status') {
    const status = String(value).toLowerCase();
    const color = status.includes('expired') ? 'text-green-400' :
                  status.includes('expiring') ? 'text-orange-400' :
                  status.includes('active') ? 'text-red-300' : 'text-text-secondary';
    return <span className={`text-xs ${color}`}>{value}</span>;
  }

  // Highlight growth rates
  if (keyLower === 'yoy_growth' || keyLower === 'cagr') {
    const str = String(value);
    if (str.startsWith('+') || (parseFloat(str) > 0)) {
      return <span className="text-green-400 font-mono">{value}</span>;
    } else if (str.startsWith('-') || (parseFloat(str) < 0)) {
      return <span className="text-red-400 font-mono">{value}</span>;
    }
  }

  // Rank column
  if (keyLower === 'rank' || key === '#') {
    return <span className="font-mono text-brand-yellow font-semibold">{value}</span>;
  }

  return String(value);
}

export default TableRenderer;
