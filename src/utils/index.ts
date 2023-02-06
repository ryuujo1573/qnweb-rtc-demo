import { useMemo } from "react"

export function debounce(fn: Function, interval: number) {
  let timeout = -1
  return (...args: any[]) => {
    if (timeout !== -1) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(fn, interval, ...args)
  }
}

// export function useDebounce<T>(value: T, interval: number): T;

export const useDebounce = (fn: Function, interval: number) => useMemo(() => debounce(fn, interval), [interval])