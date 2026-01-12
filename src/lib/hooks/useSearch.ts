'use client';

import useSWR from 'swr';
import { search, type SearchResponse } from '../api';

export function useSearch(query: string | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<SearchResponse>(
    query && query.trim().length > 0 ? ['search', query] : null,
    () => search(query!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 1,
    }
  );

  return {
    results: data,
    hits: data?.hits ?? [],
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}
