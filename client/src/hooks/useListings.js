import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@services/api';
import { resolveApiError } from '@utils/authHelpers';

const DEFAULT_FILTERS = {
  search: '',
  minBudget: '',
  maxBudget: '',
  roomType: '',
  gender: '',
  availability: '',
  sortBy: 'newest',
};

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
      setListings(data.listings ?? data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(resolveApiError(err));
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
