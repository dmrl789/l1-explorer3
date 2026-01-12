'use client';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { listRounds, getRound, type RoundsListResponse, type RoundDetail } from '../api';

const ROUNDS_REFRESH_INTERVAL = 5000; // 5 seconds

export function useRounds(limit: number = 20) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<RoundsListResponse>(
    ['rounds', limit],
    () => listRounds({ limit }),
    {
      refreshInterval: ROUNDS_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    rounds: data?.rounds ?? [],
    hasMore: data?.has_more ?? false,
    total: data?.total,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}

export function useRoundsInfinite(limit: number = 20) {
  const getKey = (pageIndex: number, previousPageData: RoundsListResponse | null) => {
    if (previousPageData && !previousPageData.has_more) return null;
    if (pageIndex === 0) return ['rounds-infinite', limit, null];
    return ['rounds-infinite', limit, previousPageData?.cursor];
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    getKey,
    ([, lim, cursor]) => listRounds({ limit: lim as number, cursor: cursor as string | undefined }),
    {
      revalidateFirstPage: true,
      dedupingInterval: 2000,
    }
  );

  const rounds = data ? data.flatMap(page => page.rounds) : [];
  const hasMore = data ? data[data.length - 1]?.has_more ?? false : false;

  return {
    rounds,
    hasMore,
    isLoading,
    isValidating,
    error,
    loadMore: () => setSize(size + 1),
    refresh: () => mutate(),
    page: size,
  };
}

export function useRound(roundId: string | number | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<RoundDetail | null>(
    roundId ? ['round', roundId] : null,
    () => getRound(roundId!),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    round: data,
    isLoading,
    isValidating,
    error,
    notFound: !isLoading && !data,
    refresh: () => mutate(),
  };
}
