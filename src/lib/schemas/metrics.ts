import { z } from 'zod';

/**
 * Schema for metrics time series data
 */
export const MetricPointSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
});

export const MetricsSeriesSchema = z.object({
  metric: z.string(),
  points: z.array(MetricPointSchema),
  unit: z.string().optional(),
});

export const MetricsResponseSchema = z.object({
  series: z.array(MetricsSeriesSchema),
  from: z.number().optional(),
  to: z.number().optional(),
  step: z.number().optional(),
});

export type MetricPoint = z.infer<typeof MetricPointSchema>;
export type MetricsSeries = z.infer<typeof MetricsSeriesSchema>;
export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;

/**
 * Normalize legacy metrics response
 */
export function normalizeMetrics(raw: unknown): MetricsResponse {
  const data = raw as Record<string, unknown>;
  
  // Handle different formats
  if (Array.isArray(data)) {
    // Array of series
    return {
      series: data.map(normalizeSeries),
    };
  }
  
  if (data.series && Array.isArray(data.series)) {
    return {
      series: (data.series as unknown[]).map(normalizeSeries),
      from: data.from as number | undefined,
      to: data.to as number | undefined,
      step: data.step as number | undefined,
    };
  }
  
  // Single series or key-value metrics
  if (data.points || data.values || data.data) {
    return {
      series: [normalizeSeries(data)],
    };
  }
  
  // Key-value object (convert to series)
  const series: MetricsSeries[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      series.push({
        metric: key,
        points: value.map((v, i) => ({
          timestamp: Date.now() - (value.length - i - 1) * 1000,
          value: typeof v === 'number' ? v : (v as { value: number }).value ?? 0,
        })),
      });
    }
  }
  
  return { series };
}

function normalizeSeries(raw: unknown): MetricsSeries {
  const data = raw as Record<string, unknown>;
  
  const points = (data.points ?? data.values ?? data.data ?? []) as unknown[];
  
  return {
    metric: String(data.metric ?? data.name ?? data.label ?? 'unknown'),
    points: points.map(normalizePoint),
    unit: data.unit as string | undefined,
  };
}

function normalizePoint(raw: unknown): MetricPoint {
  if (Array.isArray(raw)) {
    // [timestamp, value] format
    return {
      timestamp: Number(raw[0]),
      value: Number(raw[1]),
    };
  }
  
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return {
      timestamp: Number(obj.timestamp ?? obj.time ?? obj.t ?? Date.now()),
      value: Number(obj.value ?? obj.v ?? 0),
    };
  }
  
  return { timestamp: Date.now(), value: Number(raw) };
}
