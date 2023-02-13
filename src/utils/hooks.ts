import { useMemo } from 'react'
import { debounce } from '.'

// export function useDebounce<T>(value: T, interval: number): T;
export const useDebounce = (fn: Function, interval: number) =>
  useMemo(() => debounce(fn, interval), [interval])
