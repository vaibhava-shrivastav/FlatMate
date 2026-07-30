import { MapPin } from 'lucide-react';
import Button from '@components/common/Button';

export default function EmptyMapState({ hasFilters, onReset }) {
  return (
    <div
      className="relative w-full rounded-[var(--radius)] overflow-hidden border border-border bg-card flex items-center justify-center"
      style={{ height: 560 }}
    >
      <div className="flex flex-col items-center gap-4 text-center px-8 max-w-sm">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-background border border-border">
          <MapPin className="w-6 h-6 text-text-muted" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-text">
            {hasFilters ? 'No listings match your filters' : 'No listings on the map'}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            {hasFilters
              ? 'Try adjusting your filters to see listings on the map.'
              : 'Listings with location data will appear here once available.'}
          </p>
        </div>

        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={onReset}>
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}
