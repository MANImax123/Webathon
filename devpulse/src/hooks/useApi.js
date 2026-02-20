import { useState, useEffect } from 'react';

/**
 * Generic data-fetching hook with loading/error states.
 * Falls back to `fallback` if the API call fails (keeps UI working with demo data).
 *
 * @param {Function} apiFn  – async function that returns data
 * @param {*} fallback      – fallback data when API fails
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
        console.warn('[useApi] Falling back to demo data:', err.message);
        if (!cancelled) {
          setError(err.message);
          // Keep fallback data so UI never breaks
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
