import { useMemo } from 'react'
import { debounce, throttle } from '.'
import { useAppSelector } from '../store'

// export function useDebounce<T>(value: T, interval: number): T;
export function useDebounce<TArgs extends any[]>(
  fn: (...arg: TArgs) => void,
  interval: number,
): typeof fn {
  return useMemo(() => debounce(fn, interval), [interval])
}

export function useThrottle<TArgs extends any[]>(
  fn: (...arg: TArgs) => void,
  interval: number,
): typeof fn {
  return useMemo(() => throttle(fn, interval), [interval])
}

export const useSettings = () => useAppSelector((state) => state.settings)
export const useRoomState = () => useAppSelector((state) => state.room)
export const useIdentityState = () => useAppSelector((state) => state.identity)
export const useLiveRoomState = () => useAppSelector((state) => state.stream)
