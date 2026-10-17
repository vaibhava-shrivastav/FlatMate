import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@services/api';
import { resolveApiError } from '@utils/authHelpers';
import { MOCK_LISTINGS } from '@data/mockListings';

const DEFAULT_FILTERS = {
  search: '',
  roomType: '',
  budgetRange: '',
  sector: '',
  availability: '',
  sortBy: 'newest',
};

export function useListings() {
  const [baseListings, setBaseListings] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const fetchListings = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError('');

    try {
      const { data } = await api.get('/listings', {
        signal: abortRef.current.signal,
      });
      const serverListings = data?.listings ?? data;
      if (Array.isArray(serverListings) && serverListings.length > 0) {
        setBaseListings(serverListings);
      } else {
        setBaseListings(MOCK_LISTINGS);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(resolveApiError(err));
        setBaseListings(MOCK_LISTINGS);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
    return () => abortRef.current?.abort();
  }, [fetchListings]);

  const addListing = useCallback((newListing) => {
    setBaseListings((prev) => [newListing, ...prev]);
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const retry = useCallback(() => {
    fetchListings();
  }, [fetchListings]);

  // Real-time client-side filter and sort applied instantaneously
  const listings = useMemo(() => {
    let result = [...baseListings];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter((item) => {
        return (
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.location?.city?.toLowerCase().includes(q) ||
          item.location?.area?.toLowerCase().includes(q) ||
          item.location?.address?.toLowerCase().includes(q) ||
          item.owner?.name?.toLowerCase().includes(q) ||
          item.amenities?.some((a) => a.toLowerCase().includes(q))
        );
      });
    }

    if (filters.roomType) {
      result = result.filter((item) => item.roomType === filters.roomType);
    }

    if (filters.budgetRange) {
      if (filters.budgetRange === 'under_7k') result = result.filter((i) => i.rent < 7000);
      else if (filters.budgetRange === '7k_10k') result = result.filter((i) => i.rent >= 7000 && i.rent <= 10000);
      else if (filters.budgetRange === '10k_15k') result = result.filter((i) => i.rent >= 10000 && i.rent <= 15000);
      else if (filters.budgetRange === 'above_15k') result = result.filter((i) => i.rent > 15000);
    }

    if (filters.sector) {
      result = result.filter((i) =>
        i.location?.area?.toLowerCase().includes(filters.sector.toLowerCase())
      );
    }

    if (filters.availability === 'now') {
      const now = new Date();
      result = result.filter((i) => !i.availableFrom || new Date(i.availableFrom) <= now);
    }

    if (filters.sortBy === 'price_asc') {
      result.sort((a, b) => (a.rent || 0) - (b.rent || 0));
    } else if (filters.sortBy === 'price_desc') {
      result.sort((a, b) => (b.rent || 0) - (a.rent || 0));
    } else if (filters.sortBy === 'compatibility') {
      result.sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0));
    } else {
      // 'newest' default
      result.sort((a, b) => new Date(b.createdAt || b.availableFrom || 0) - new Date(a.createdAt || a.availableFrom || 0));
    }

    return result;
  }, [baseListings, filters]);

  return {
    listings,
    baseListings,
    filters,
    isLoading,
    error,
    updateFilter,
    resetFilters,
    addListing,
    retry,
  };
}
