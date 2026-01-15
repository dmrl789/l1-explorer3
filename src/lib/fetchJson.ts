/**
 * Robust JSON fetcher with timeout, fallback support, and error normalization
 */

import { getApiBases } from './env';

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface FetchOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  baseOverride?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT_MS = 10000;

export class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.status = error.status;
  }
}

async function fetchWithTimeout<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, method = 'GET', body, headers = {} } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine external signal with timeout signal
  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const response = await fetch(url, {
      method,
      signal: combinedSignal,
      // Always fetch "live" data for explorer dashboards.
      // In the browser this avoids HTTP cache reuse; in Next.js it also prevents
      // request memoization/caching behaviors from making the UI look "stuck".
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: { message?: string; error?: string } = {};
      try {
        errorBody = await response.json();
      } catch {
        // Ignore JSON parse errors for error responses
      }

      throw new ApiRequestError({
        code: `HTTP_${response.status}`,
        message: errorBody.message || errorBody.error || response.statusText || 'Request failed',
        status: response.status,
      });
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiRequestError({
          code: 'TIMEOUT',
          message: 'Request timed out',
          status: 408,
        });
      }

      throw new ApiRequestError({
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error',
        status: 0,
      });
    }

    throw new ApiRequestError({
      code: 'UNKNOWN',
      message: 'An unknown error occurred',
      status: 0,
    });
  }
}

function combineAbortSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
  const controller = new AbortController();

  const abort = () => controller.abort();

  if (signal1.aborted || signal2.aborted) {
    controller.abort();
  } else {
    signal1.addEventListener('abort', abort);
    signal2.addEventListener('abort', abort);
  }

  return controller.signal;
}

/**
 * Fetch JSON from API with automatic fallback to alternative base URLs
 */
export async function fetchJson<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { baseOverride, ...restOptions } = options;

  const bases = baseOverride ? [baseOverride] : getApiBases();
  let lastError: ApiRequestError | null = null;

  for (const base of bases) {
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      return await fetchWithTimeout<T>(url, restOptions);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        lastError = error;

        // Don't retry on 4xx errors (except 404 for compatibility)
        if (error.status >= 400 && error.status < 500 && error.status !== 404) {
          throw error;
        }

        // Continue to next base URL
        continue;
      }

      throw error;
    }
  }

  // All bases failed
  throw lastError || new ApiRequestError({
    code: 'ALL_BASES_FAILED',
    message: 'All API base URLs failed',
    status: 0,
  });
}

/**
 * Try fetching from v1 endpoint first, then fallback to legacy endpoint
 */
export async function fetchWithCompatibility<T>(
  v1Path: string,
  legacyPath: string,
  options: FetchOptions = {}
): Promise<{ data: T; source: 'v1' | 'legacy' }> {
  try {
    const data = await fetchJson<T>(v1Path, options);
    return { data, source: 'v1' };
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 404 || error.status === 501)) {
      // Try legacy endpoint
      const data = await fetchJson<T>(legacyPath, options);
      return { data, source: 'legacy' };
    }
    throw error;
  }
}
