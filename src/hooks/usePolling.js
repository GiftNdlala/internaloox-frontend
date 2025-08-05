import { useEffect, useRef, useState } from 'react';

export const usePolling = (fetchFunction, interval = 30000, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef();
  const mountedRef = useRef(true);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        console.error('Polling error:', err);
      }
    } finally {
      if (mountedRef.current && !silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    fetchData(); // Initial fetch

    // Set up polling interval
    if (interval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(true); // Silent refresh
      }, interval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refresh = () => {
    fetchData();
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startPolling = () => {
    if (!intervalRef.current && interval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, interval);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refresh, 
    stopPolling, 
    startPolling 
  };
};