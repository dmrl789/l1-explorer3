'use client';

import useSWR from 'swr';
import { listNetworkNodes, type NetworkNodesResponse } from '../api';

const NETWORK_REFRESH_INTERVAL = 10000; // 10 seconds

export function useNetworkNodes() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<NetworkNodesResponse>(
    'network/nodes',
    () => listNetworkNodes(),
    {
      refreshInterval: NETWORK_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    nodes: data?.nodes ?? [],
    totalNodes: data?.total_nodes ?? data?.nodes?.length ?? 0,
    onlineNodes: data?.online_nodes ?? 0,
    peerCount: data?.peer_count,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}
