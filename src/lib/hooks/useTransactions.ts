'use client';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { listTx, getTx, type TxListResponse, type TxDetail } from '../api';

const TX_REFRESH_INTERVAL = 5000; // 5 seconds

export function useTransactions(limit: number = 20) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TxListResponse>(
    ['transactions', limit],
    () => listTx({ limit }),
    {
      refreshInterval: TX_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    transactions: data?.transactions ?? [],
    hasMore: data?.has_more ?? false,
    total: data?.total,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}

export function useTransactionsInfinite(limit: number = 20) {
  const getKey = (pageIndex: number, previousPageData: TxListResponse | null) => {
    if (previousPageData && !previousPageData.has_more) return null;
    if (pageIndex === 0) return ['transactions-infinite', limit, null];
    return ['transactions-infinite', limit, previousPageData?.cursor];
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    getKey,
    ([, lim, cursor]) => listTx({ limit: lim as number, cursor: cursor as string | undefined }),
    {
      revalidateFirstPage: true,
      dedupingInterval: 2000,
    }
  );

  const transactions = data ? data.flatMap(page => page.transactions) : [];
  const hasMore = data ? data[data.length - 1]?.has_more ?? false : false;

  return {
    transactions,
    hasMore,
    isLoading,
    isValidating,
    error,
    loadMore: () => setSize(size + 1),
    refresh: () => mutate(),
    page: size,
  };
}

export function useTransaction(txId: string | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TxDetail | null>(
    txId ? ['transaction', txId] : null,
    () => getTx(txId!),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    transaction: data,
    isLoading,
    isValidating,
    error,
    notFound: !isLoading && !data,
    refresh: () => mutate(),
  };
}
