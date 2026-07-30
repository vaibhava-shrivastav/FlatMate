import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@utils/cn';

const FILTER_CONFIGS = [
  {
    key: 'roomType',
    label: 'Room type',
    options: [
      { value: '', label: 'Any type' },
      { value: 'private', label: 'Private room' },
      { value: 'shared', label: 'Shared room' },
      { value: 'studio', label: 'Studio' },
      { value: 'entire', label: 'Entire place' },
    ],
  },
  {
    key: 'gender',
    label: 'Gender pref.',
    options: [
      { value: '', label: 'Any' },
      { value: 'male', label: 'Male only' },
      { value: 'female', label: 'Female only' },
      { value: 'mixed', label: 'Mixed' },
    ],
  },
  {
    key: 'availability',
    label: 'Available',
    options: [
      { value: '', label: 'Any time' },
      { value: 'now', label: 'Available now' },
      { value: 'month', label: 'This month' },
      { value: 'next_month', label: 'Next month' },
    ],
  },
  {
    key: 'sortBy',
    label: 'Sort by',
    options: [
      { value: 'newest', label: 'Newest first' },
      { value: 'oldest', label: 'Oldest first' },
      { value: 'price_asc', label: 'Price: low to high' },
      { value: 'price_desc', label: 'Price: high to low' },
      { value: 'compatibility', label: 'Best match' },
    ],
  },
];

function FilterSelect({ config, value, onChange }) {
  const isActive = value !== '' && value !== 'newest';

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(config.key, e.target.value)}
        aria-label={config.label}
        className={cn(
          'appearance-none bg-card border rounded-[var(--radius)]',
          'pl-3 pr-8 py-2 text-sm cursor-pointer',
          'transition-colors duration-200',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          isActive
            ? 'border-primary text-text'
            : 'border-border text-text-muted hover:border-border/80 hover:text-text',
        )}
      >
        {config.options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-text">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isActive ? 'text-primary' : 'text-text-muted'} />
        </svg>
      </div>
    </div>
  );
}

export default function FilterBar({ filters, onFilterChange, onReset, listingCount }) {
  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => val !== '' && !(key === 'sortBy' && val === 'newest') && key !== 'search'
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-text-muted mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
        </div>

        {FILTER_CONFIGS.map((config) => (
          <FilterSelect
            key={config.key}
            config={config}
            value={filters[config.key]}
            onChange={onFilterChange}
          />
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text border border-border hover:border-border/80 rounded-[var(--radius)] transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      {listingCount !== undefined && (
        <p className="text-xs text-text-muted shrink-0">
          {listingCount} {listingCount === 1 ? 'listing' : 'listings'}
        </p>
      )}
    </div>
  );
}
