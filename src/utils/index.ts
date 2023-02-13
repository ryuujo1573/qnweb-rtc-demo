import { getPassedTimeDesc } from './datetime'
import { useDebounce } from './hooks'
export { getPassedTimeDesc, useDebounce }

export const checkNickname = (v: string) => /^\w{1,24}$/.test(v)

export const checkRoomId = (v: string) => /^[0-9a-zA-Z_-]{3,64}$/.test(v)

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function debounce(fn: Function, interval: number) {
  let timeout = -1
  return (...args: any[]) => {
    if (timeout !== -1) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(fn, interval, ...args)
  }
}
