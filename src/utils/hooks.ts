import { useMemo } from 'react'
import { debounce } from '.'

// export function useDebounce<T>(value: T, interval: number): T;
export function useDebounce<TArgs extends any[]>(
  fn: (...arg: TArgs) => void,
  interval: number
): typeof fn {
  return useMemo(() => debounce(fn, interval), [interval])
}
