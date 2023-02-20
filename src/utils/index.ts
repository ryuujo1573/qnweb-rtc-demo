import { getPassedTimeDesc } from './datetime'
import { useDebounce } from './hooks'
import { stringToColor } from './avatar'

export { getPassedTimeDesc, useDebounce, stringToColor }

export const checkUserId = (v: string) => /^\w{1,24}$/.test(v)

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
