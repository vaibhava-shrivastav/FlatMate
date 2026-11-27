import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useListings } from '@hooks/useListings';
import { useAuth } from '@hooks/useAuth';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import ViewToggle from './ViewToggle';
import ListingCard from './ListingCard';
import MapView from './MapView';
import SkeletonGrid from './SkeletonGrid';
import EmptyState from './EmptyState';
import AddListingModal from './AddListingModal';
import Button from '@components/common/Button';
import ErrorBanner from '@components/common/ErrorBanner';

export default function Dashboard() {
  const { user } = useAuth();
  const [view, setView] = useState('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const {
    listings,
    filters,
    isLoading,
    error,
    updateFilter,
    resetFilters,
    addListing,
    retry,
  } = useListings();

  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      updateFilter('search', searchFromUrl);
    }
  }, [searchParams, updateFilter]);

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => val !== '' && !(key === 'sortBy' && val === 'newest')
  );

  const greeting = user?.fullName || user?.name
    ? `Good to see you, ${(user.fullName || user.name).split(' ')[0]}.`
    : 'Your listings';

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text tracking-tight">{greeting}</h1>
          <p className="text-sm text-text-muted">
            Browse available rooms in Greater Noida or list your open space.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post a Room</span>
        </Button>
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

      {/* Add Listing Modal */}
      <AddListingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={(created) => {
          addListing(created);
        }}
      />
    </div>
  );
}
