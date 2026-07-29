import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@utils/cn';

export default function SearchBar({ value, onChange, placeholder = 'Search by location, college, or city…' }) {
  const inputRef = useRef(null);

  return (
    <div className="relative flex-1 min-w-0">
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search listings"
        className={cn(
          'w-full bg-card border border-border rounded-[var(--radius)]',
          'pl-10 pr-10 py-2.5 text-sm text-text placeholder:text-text-muted',
          'transition-colors duration-200',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors duration-150 cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
