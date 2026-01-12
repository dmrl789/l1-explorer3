'use client';

import useSWR from 'swr';
import { getMetricsSeries, type MetricsResponse } from '../api';

const SERIES_REFRESH_INTERVAL = 5000; // 5 seconds

type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h';

function getTimeRangeParams(range: TimeRange): { from: number; to: number; step: number } {
  const now = Date.now();
  const rangeMs: Record<TimeRange, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
  };
  
  const steps: Record<TimeRange, number> = {
    '5m': 5000,       // 5s intervals
    '15m': 15000,     // 15s intervals
    '1h': 60000,      // 1m intervals
    '6h': 5 * 60000,  // 5m intervals
    '24h': 15 * 60000, // 15m intervals
  };
  
  return {
    from: now - rangeMs[range],
    to: now,
    step: steps[range],
  };
}

export function useSeries(range: TimeRange = '5m') {
  const params = getTimeRangeParams(range);
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<MetricsResponse>(
    ['metrics/series', range],
    () => getMetricsSeries(params),
    {
      refreshInterval: SERIES_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
      errorRetryCount: 2,
    }
  );

  return {
    metrics: data,
    series: data?.series ?? [],
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  };
}

export function useMetricSeries(metricName: string, range: TimeRange = '5m') {
  const { series, isLoading, isValidating, error, refresh } = useSeries(range);
  
  const metricSeries = series.find(s => 
    s.metric.toLowerCase().includes(metricName.toLowerCase())
  );
  
  return {
    series: metricSeries,
    points: metricSeries?.points ?? [],
    isLoading,
    isValidating,
    error,
    refresh,
  };
}
