import { useMemo } from 'react'
import { debounce, throttle } from '.'

// export function useDebounce<T>(value: T, interval: number): T;
export function useDebounce<TArgs extends any[]>(
  fn: (...arg: TArgs) => void,
  interval: number
): typeof fn {
  return useMemo(() => debounce(fn, interval), [interval])
}

export function useThrottle<TArgs extends any[]>(
  fn: (...arg: TArgs) => void,
  interval: number
): typeof fn {
  return useMemo(() => throttle(fn, interval), [interval])
}
