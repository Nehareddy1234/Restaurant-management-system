import { useQuery } from '@tanstack/react-query';

const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
const API_BASE = isCapacitor ? 'https://nehaskitchen.vercel.app' : '';

/**
 * Generic hook to fetch paginated data from a given API resource.
 * Expects the backend to accept `page` (1‑based) and `limit` query parameters.
 * The backend should return the total count via the `X-Total-Count` header; if absent,
 * the hook falls back to the length of the returned array.
 *
 * @param {string} resource - API resource name, e.g., 'expenses'.
 * @param {number} page - Current page number (1‑based).
 * @param {number} limit - Number of items per page.
 * @returns {{ data: any[], totalCount: number, isLoading: boolean, error: Error|null }}
 */
export function usePaginatedFetch(resource, page = 1, limit = 20) {
  const fetchPage = async () => {
    const url = `${API_BASE}/api/${resource}?page=${page}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch ${resource} (status ${response.status})`);
    }
    const data = await response.json();
    const totalHeader = response.headers.get('X-Total-Count');
    const totalCount = totalHeader ? parseInt(totalHeader, 10) : Array.isArray(data) ? data.length : 0;
    return { data, totalCount };
  };

  const query = useQuery([resource, page, limit], fetchPage, {
    keepPreviousData: true,
    staleTime: 1000 * 60, // 1 minute – reduces redundant egress
  });

  return {
    data: query.data?.data,
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
