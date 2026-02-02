import { useEffect, useRef } from 'react';

/**
 * usePrevious Hook
 * Returns the previous value of a state or prop
 *
 * Usage:
 * ```tsx
 * const prevCount = usePrevious(count);
 * ```
 *
 * @param value - Current value to track
 * @returns Previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
