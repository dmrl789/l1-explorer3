'use client';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { 
  getAuditReplayStatus, 
  listAuditCheckpoints,
  type AuditReplayStatus, 
  type CheckpointsListResponse 
} from '../api';

const AUDIT_REFRESH_INTERVAL = 10000; // 10 seconds

export function useAuditReplayStatus() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<AuditReplayStatus>(
    'audit/replay',
    () => getAuditReplayStatus(),
    {
      refreshInterval: AUDIT_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    replayStatus: data,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}

export function useCheckpoints(limit: number = 20) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<CheckpointsListResponse>(
    ['audit/checkpoints', limit],
    () => listAuditCheckpoints({ limit }),
    {
      refreshInterval: AUDIT_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    checkpoints: data?.checkpoints ?? [],
    hasMore: data?.has_more ?? false,
    total: data?.total,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}

export function useCheckpointsInfinite(limit: number = 20) {
  const getKey = (pageIndex: number, previousPageData: CheckpointsListResponse | null) => {
    if (previousPageData && !previousPageData.has_more) return null;
    if (pageIndex === 0) return ['checkpoints-infinite', limit, null];
    return ['checkpoints-infinite', limit, previousPageData?.cursor];
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    getKey,
    ([, lim, cursor]) => listAuditCheckpoints({ limit: lim as number, cursor: cursor as string | undefined }),
    {
      revalidateFirstPage: true,
      dedupingInterval: 5000,
    }
  );

  const checkpoints = data ? data.flatMap(page => page.checkpoints) : [];
  const hasMore = data ? data[data.length - 1]?.has_more ?? false : false;

  return {
    checkpoints,
    hasMore,
    isLoading,
    isValidating,
    error,
    loadMore: () => setSize(size + 1),
    refresh: () => mutate(),
    page: size,
  };
}
