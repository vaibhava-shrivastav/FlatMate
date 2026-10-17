import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@services/api';
import { resolveApiError } from '@utils/authHelpers';
import { MOCK_LISTINGS } from '@data/mockListings';

const DEFAULT_FILTERS = {
  search: '',
  minBudget: '',
  maxBudget: '',
  roomType: '',
  gender: '',
  availability: '',
  sortBy: 'newest',
};

function filterMockListings(items, filters) {
  return items.filter((item) => {
    if (filters.roomType && item.roomType !== filters.roomType) return false;
    if (filters.minBudget && item.rent < Number(filters.minBudget)) return false;
    if (filters.maxBudget && item.rent > Number(filters.maxBudget)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const match =
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.location?.city?.toLowerCase().includes(q) ||
        item.location?.area?.toLowerCase().includes(q) ||
        item.location?.address?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

export function useListings() {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const fetchListings = useCallback(async (activeFilters) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError('');

    try {
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, v]) => v !== '')
      );
      const { data } = await api.get('/listings', {
        params,
        signal: abortRef.current.signal,
      });
      const serverListings = data?.listings ?? data;
      if (Array.isArray(serverListings) && serverListings.length > 0) {
        setListings(serverListings);
      } else {
        // Fallback to high quality demo listings if database is empty
        setListings(filterMockListings(MOCK_LISTINGS, activeFilters));
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(resolveApiError(err));
        setListings(filterMockListings(MOCK_LISTINGS, activeFilters));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(filters);
    return () => abortRef.current?.abort();
  }, [filters, fetchListings]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const retry = useCallback(() => {
    fetchListings(filters);
  }, [filters, fetchListings]);

  return { listings, filters, isLoading, error, updateFilter, resetFilters, retry };
}
