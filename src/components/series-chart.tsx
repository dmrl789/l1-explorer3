'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { MetricPoint } from '@/lib/schemas';

interface SeriesChartProps {
  title: string;
  description?: string;
  data: MetricPoint[];
  dataKey?: string;
  color?: string;
  loading?: boolean;
  className?: string;
  height?: number;
  showGrid?: boolean;
  areaFill?: boolean;
  unit?: string;
  formatValue?: (value: number) => string;
}

export function SeriesChart({
  title,
  description,
  data,
  dataKey = 'value',
  color = 'hsl(var(--primary))',
  loading = false,
  className,
  height = 200,
  showGrid = true,
  areaFill = true,
  unit,
  formatValue = (v) => v.toLocaleString(),
}: SeriesChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      time: point.timestamp,
      [dataKey]: point.value,
    }));
  }, [data, dataKey]);

  const formatXAxis = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const formatTooltipLabel = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div 
            className="flex items-center justify-center text-muted-foreground text-sm"
            style={{ height }}
          >
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {areaFill ? (
              <AreaChart data={chartData}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
                <XAxis
                  dataKey="time"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={formatValue}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  width={50}
                />
                <Tooltip
                  labelFormatter={formatTooltipLabel}
                  formatter={(value) => [
                    `${formatValue(Number(value) || 0)}${unit ? ` ${unit}` : ''}`,
                    title,
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
                <XAxis
                  dataKey="time"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={formatValue}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <Tooltip
                  labelFormatter={formatTooltipLabel}
                  formatter={(value) => [
                    `${formatValue(Number(value) || 0)}${unit ? ` ${unit}` : ''}`,
                    title,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface MultiSeriesChartProps {
  title: string;
  description?: string;
  series: Array<{
    name: string;
    data: MetricPoint[];
    color: string;
  }>;
  loading?: boolean;
  className?: string;
  height?: number;
  unit?: string;
  formatValue?: (value: number) => string;
}

export function MultiSeriesChart({
  title,
  description,
  series,
  loading = false,
  className,
  height = 200,
  unit,
  formatValue = (v) => v.toLocaleString(),
}: MultiSeriesChartProps) {
  const chartData = useMemo(() => {
    // Merge all series data by timestamp
    const timeMap = new Map<number, Record<string, number>>();
    
    series.forEach((s) => {
      s.data.forEach((point) => {
        const existing = timeMap.get(point.timestamp) || { time: point.timestamp };
        existing[s.name] = point.value;
        timeMap.set(point.timestamp, existing);
      });
    });

    return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  }, [series]);

  const formatXAxis = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div 
            className="flex items-center justify-center text-muted-foreground text-sm"
            style={{ height }}
          >
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickFormatter={formatValue}
                tick={{ fontSize: 11 }}
                width={50}
              />
              <Tooltip
                labelFormatter={(ts) => format(new Date(Number(ts)), 'HH:mm:ss')}
                formatter={(value, name) => [
                  `${formatValue(Number(value) || 0)}${unit ? ` ${unit}` : ''}`,
                  String(name),
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              {series.map((s) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
