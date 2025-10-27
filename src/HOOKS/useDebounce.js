
// hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Debounce Hook
 * Delays updating a value until after a specified delay
 */

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};