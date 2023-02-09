import { useMemo } from "react"
import { getPassedTimeDesc } from './datetime'

export {
  getPassedTimeDesc
}

export const checkNickname = (v: string) => /^\w{1,24}$/.test(v)

export const checkRoomId = (v: string) => /^[0-9a-zA-Z_-]{3,64}$/.test(v)

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