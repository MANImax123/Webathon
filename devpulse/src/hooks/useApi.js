import { useState, useEffect } from 'react';

/**
 * Generic data-fetching hook with loading/error states.
 * Falls back to `fallback` if the API call fails (shows empty state).
 *
 * @param {Function} apiFn  – async function that returns data
 * @param {*} fallback      – fallback data when API fails (empty arrays/objects)
 * @param {Array} deps      – dependency array for re-fetch
 */
export default function useApi(apiFn, fallback = null, deps = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        console.warn('[useApi] API call failed:', err.message);
        if (!cancelled) {
          setError(err.message);
          // Keep fallback data so UI shows empty state
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
