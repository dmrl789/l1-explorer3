'use client';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { listBlocks, getBlock, type BlocksListResponse, type BlockDetail } from '../api';

const BLOCKS_REFRESH_INTERVAL = 5000; // 5 seconds

export function useBlocks(limit: number = 20) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<BlocksListResponse & { _empty_warning?: boolean }>(
    ['blocks', limit],
    () => listBlocks({ limit }),
    {
      refreshInterval: BLOCKS_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    blocks: data?.blocks ?? [],
    hasMore: data?.has_more ?? false,
    total: data?.total,
    emptyWarning: data?._empty_warning ?? false,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}

export function useBlocksInfinite(limit: number = 20) {
  const getKey = (pageIndex: number, previousPageData: BlocksListResponse | null) => {
    if (previousPageData && !previousPageData.has_more) return null;
    if (pageIndex === 0) return ['blocks-infinite', limit, null];
    return ['blocks-infinite', limit, previousPageData?.cursor];
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    getKey,
    ([, lim, cursor]) => listBlocks({ limit: lim as number, cursor: cursor as string | undefined }),
    {
      revalidateFirstPage: true,
      dedupingInterval: 2000,
    }
  );

  const blocks = data ? data.flatMap(page => page.blocks) : [];
  const hasMore = data ? data[data.length - 1]?.has_more ?? false : false;

  return {
    blocks,
    hasMore,
    isLoading,
    isValidating,
    error,
    loadMore: () => setSize(size + 1),
    // For SWRInfinite, reset to first page and revalidate
    refresh: () => {
      setSize(1);
      return mutate();
    },
    page: size,
  };
}

export function useBlock(blockId: string | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<BlockDetail | null>(
    blockId ? ['block', blockId] : null,
    () => getBlock(blockId!),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    block: data,
    isLoading,
    isValidating,
    error,
    notFound: !isLoading && !data,
    refresh: () => mutate(),
  };
}
