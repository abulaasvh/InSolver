import React from 'react';

const BUREAUS = ['Approval Bureau', 'Policy Bureau', 'Anti-Ragging Cell', 'Women Cell', 'PGRC'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const STATUSES = [
  { label: 'New', color: 'bg-teal-500' },
  { label: 'Under Process', color: 'bg-slate-400' },
  { label: 'Transferred', color: 'bg-blue-500' },
  { label: 'Disposed', color: 'bg-green-500' },
  { label: 'Overdue', color: 'bg-red-500' },
];

interface FilterSidebarProps {
  filters: {
    bureaus: string[];
    region: string;
    status: string;
  };
  onChange: (filters: any) => void;
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const toggleBureau = (bureau: string) => {
    const current = filters.bureaus || [];
    if (current.includes(bureau)) {
      onChange({ ...filters, bureaus: current.filter((b) => b !== bureau) });
    } else {
      onChange({ ...filters, bureaus: [...current, bureau] });
    }
  };

  return (
    <aside className="w-56 flex-shrink-0 space-y-6">
      {/* Bureau/Cell filter */}
      <div>
        <p className="filter-label">Bureau / Cell</p>
        <div className="space-y-2">
          {BUREAUS.map((b) => (
            <label key={b} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                id={`filter-bureau-${b.replace(/\s+/g, '-').toLowerCase()}`}
                aria-label={`Filter by ${b}`}
                checked={!filters.bureaus || filters.bureaus.length === 0 || filters.bureaus.includes(b)}
                onChange={() => toggleBureau(b)}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 leading-tight">{b}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Region filter */}
      <div>
        <p className="filter-label">Region</p>
        <select
          id="filter-region"
          aria-label="Filter by region"
          value={filters.region || ''}
          onChange={(e) => onChange({ ...filters, region: e.target.value })}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="">All Regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <div>
        <p className="filter-label">Status</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status-filter"
              value=""
              checked={!filters.status}
              onChange={() => onChange({ ...filters, status: '' })}
              className="text-teal-600"
            />
            <span className="text-sm text-slate-600">All</span>
          </label>
          {STATUSES.map((s) => (
            <label key={s.label} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="status-filter"
                id={`filter-status-${s.label.replace(/\s+/g, '-').toLowerCase()}`}
                value={s.label}
                checked={filters.status === s.label}
                onChange={() => onChange({ ...filters, status: s.label })}
                className="text-teal-600"
              />
              <span className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className="text-sm text-slate-600 group-hover:text-slate-900">{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        id="filter-reset-btn"
        onClick={() => onChange({ bureaus: [], region: '', status: '' })}
        className="text-xs text-teal-600 hover:underline"
        aria-label="Reset all filters"
      >
        Reset filters
      </button>
    </aside>
  );
}
