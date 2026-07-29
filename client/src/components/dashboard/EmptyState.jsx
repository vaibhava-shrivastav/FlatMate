import { SearchX } from 'lucide-react';
import Button from '@components/common/Button';

export default function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-card border border-border">
        <SearchX className="w-6 h-6 text-text-muted" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="text-base font-semibold text-text">
          {hasFilters ? 'No listings match your filters' : 'No listings yet'}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">
          {hasFilters
            ? 'Try adjusting your search or removing some filters to see more results.'
            : 'Be the first to post a room or check back soon — new listings are added daily.'}
        </p>
      </div>

      {hasFilters && (
        <Button variant="secondary" size="sm" onClick={onReset}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
