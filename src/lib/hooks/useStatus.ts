'use client';

import useSWR from 'swr';
import { getStatus, type Status } from '../api';

const STATUS_REFRESH_INTERVAL = 3000; // 3 seconds

export function useStatus() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Status>(
    'status',
    () => getStatus(),
    {
      refreshInterval: STATUS_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 1000,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
    }
  );

  return {
    status: data,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}
