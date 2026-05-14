import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { ITEMS_PER_PAGE } from '../lib/constants';

export function useBookmarks({
  page = 1,
  type,
  tags = [],
  domain,
  favorite,
  collectionId,
  includeAll = false,
} = {}) {
  const params = new URLSearchParams();
  if (includeAll) {
    params.set('all', 'true');
  } else {
    params.set('page', page);
    params.set('limit', ITEMS_PER_PAGE);
  }
  if (type && type !== 'all') params.set('type', type);
  if (tags && tags.length > 0) params.set('tags', tags.join(','));
  if (domain) params.set('domain', domain);
  if (favorite) params.set('favorite', 'true');
  if (collectionId) params.set('collection_id', collectionId);

  return useQuery({
    queryKey: ['bookmarks', { page, type, tags, domain, favorite, collectionId, includeAll }],
    queryFn: async () => {
      const { data } = await api.get(`/bookmarks?${params.toString()}`);
      return data;
    },
    staleTime: 30000,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasProcessing = data?.bookmarks?.some(b => b.status === 'processing');
      return hasProcessing ? 3000 : false;
    },
  });
}

export function useBookmark(id) {
  return useQuery({
    queryKey: ['bookmark', id],
    queryFn: async () => {
      const { data } = await api.get(`/bookmarks/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookmark) => {
      const { data } = await api.post('/bookmarks', bookmark);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data } = await api.put(`/bookmarks/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await api.get('/search/tags');
      return data.tags || [];
    },
    staleTime: 60000,
  });
}
