import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Users, Home } from 'lucide-react';
import { useListings } from '@hooks/useListings';
import { useAuth } from '@hooks/useAuth';
import api from '@services/api';
import { cn } from '@utils/cn';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import ViewToggle from './ViewToggle';
import ListingCard from './ListingCard';
import RoommateCard from './RoommateCard';
import MapView from './MapView';
import SkeletonGrid from './SkeletonGrid';
import EmptyState from './EmptyState';
import AddListingModal from './AddListingModal';
import MatchInsightModal from '@components/common/MatchInsightModal';
import Button from '@components/common/Button';
import ErrorBanner from '@components/common/ErrorBanner';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'roommates'
  const [view, setView] = useState('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  // Roommates AI matching state
  const [roommates, setRoommates] = useState([]);
  const [isRoommatesLoading, setIsRoommatesLoading] = useState(false);
  const [roommatesError, setRoommatesError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);

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

  const fetchRoommates = useCallback(async () => {
    setIsRoommatesLoading(true);
    setRoommatesError('');
    try {
      const { data } = await api.get('/matches');
      setRoommates(data.matches || []);
    } catch (err) {
      setRoommatesError(err.response?.data?.message || 'Could not load roommate matches.');
    } finally {
      setIsRoommatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'roommates' && roommates.length === 0) {
      fetchRoommates();
    }
  }, [activeTab, roommates.length, fetchRoommates]);

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
            Browse available rooms in Greater Noida or connect with lifestyle-compatible roommates.
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

      {/* Tab Navigation: Available Rooms vs. Roommate Seekers */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 cursor-pointer',
            activeTab === 'rooms'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          <Home className="w-4 h-4" />
          <span>Available Rooms ({isLoading ? '…' : listings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roommates')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 cursor-pointer',
            activeTab === 'roommates'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          <Users className="w-4 h-4" />
          <span>Roommate Matches</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold tracking-wider">
            AI
          </span>
        </button>
      </div>

      {activeTab === 'rooms' ? (
        <>
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
          {error && <ErrorBanner message={error} onDismiss={retry} />}

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
        </>
      ) : (
        /* Roommates AI tab */
        <div className="flex flex-col gap-4">
          {roommatesError && (
            <ErrorBanner message={roommatesError} onDismiss={fetchRoommates} />
          )}

          {isRoommatesLoading ? (
            <SkeletonGrid count={6} />
          ) : roommates.length === 0 ? (
            <div className="bg-card border border-border rounded-[var(--radius)] p-8 text-center flex flex-col items-center justify-center gap-3">
              <Users className="w-10 h-10 text-text-muted" />
              <h3 className="font-semibold text-text text-base">No roommate candidates found</h3>
              <p className="text-xs text-text-muted max-w-sm">
                Complete your onboarding questionnaire or adjust your preferences to discover lifestyle-compatible roommates in Greater Noida.
              </p>
              <Button size="sm" onClick={fetchRoommates}>
                Refresh Matches
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roommates.map((candidate, idx) => (
                <RoommateCard
                  key={candidate.user?._id || candidate._id || idx}
                  candidate={candidate}
                  onExplainMatch={setSelectedMatch}
                />
              ))}
            </div>
          )}
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

      {/* Gemini AI Match Insight Modal */}
      <MatchInsightModal
        isOpen={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
        user={selectedMatch?.user}
        matchData={selectedMatch?.matchData}
      />
    </div>
  );
}
