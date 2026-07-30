import { useState } from 'react';
import { useListings } from '@hooks/useListings';
import { useAuth } from '@hooks/useAuth';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import ViewToggle from './ViewToggle';
import ListingCard from './ListingCard';
import MapView from './MapView';
import SkeletonGrid from './SkeletonGrid';
import EmptyState from './EmptyState';
import ErrorBanner from '@components/common/ErrorBanner';

export default function Dashboard() {
  const { user } = useAuth();
  const [view, setView] = useState('grid');

  const {
    listings,
    filters,
    isLoading,
    error,
    updateFilter,
    resetFilters,
    retry,
  } = useListings();

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => val !== '' && !(key === 'sortBy' && val === 'newest')
  );

  const greeting = user?.fullName
    ? `Good to see you, ${user.fullName.split(' ')[0]}.`
    : 'Find your next home.';

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text tracking-tight">{greeting}</h1>
        <p className="text-sm text-text-muted">
          Browse verified rooms and find your perfect roommate match.
        </p>
      </div>

      {/* Search + View toggle row */}
      <div className="flex items-center gap-3">
        <SearchBar
          value={filters.search}
          onChange={(val) => updateFilter('search', val)}
        />
        <ViewToggle activeView={view} onChange={setView} />
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        listingCount={isLoading ? undefined : listings.length}
      />

      {/* Error */}
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={retry}
        />
      )}

      {/* Content area */}
      {view === 'map' ? (
        <MapView
          listings={listings}
          isLoading={isLoading}
          hasFilters={hasActiveFilters}
          onReset={resetFilters}
        />
      ) : isLoading ? (
        <SkeletonGrid count={6} />
      ) : listings.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
