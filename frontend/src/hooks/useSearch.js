import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useSearch({ limit, minScore, collectionId } = {}) {
  const [query, setQuery] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query, limit, minScore, collectionId],
    queryFn: async () => {
      if (!query.trim()) return { results: [], count: 0 };
      const params = { q: query };
      if (typeof limit === 'number' && limit > 0) params.limit = limit;
      if (typeof minScore === 'number') params.min_score = minScore;
      if (collectionId) params.collection_id = collectionId;

      const { data } = await api.get('/search', { params });
      return data;
    },
    enabled: query.trim().length > 0,
    staleTime: 10000,
  });

  const search = useCallback((q) => {
    setQuery(q);
  }, []);

  return {
    query,
    search,
    results: data?.results || [],
    resultCount: data?.count || 0,
    isSearching: isLoading || isFetching,
  };
}
