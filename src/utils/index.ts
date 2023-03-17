import { getPassedTimeDesc } from './datetime'
import { useDebounce } from './hooks'
import { stringToColor } from './avatar'
import { isAudioTrack, isVideoTrack } from './typing'

export {
  getPassedTimeDesc,
  useDebounce,
  stringToColor,
  isAudioTrack,
  isVideoTrack,
}

export const checkUserId = (v: string) => /^\w{1,24}$/.test(v)

export const checkRoomId = (v: string) => /^[0-9a-zA-Z_-]{3,64}$/.test(v)

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function debounce<TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  interval: number
): typeof fn {
  let timeout = -1
  return (...args: TArgs) => {
    if (timeout !== -1) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(fn, interval, ...args)
  }
}

export function throttle<TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  interval: number
): typeof fn {
  let idle = true
  return (...args: TArgs) => {
    if (idle) {
      idle = false
      fn(...args)
      setTimeout(() => (idle = true), interval)
    }
  }
}

export function getRandomId(): string {
  const result = Math.floor(Math.random() * 2 ** 64).toString(16)
  console.info('randomID', result)
  return result
}

export function notNull<T>(t: T): t is Exclude<T, null> {
  return t !== null
}

export function valuable<T>(t: T): t is Exclude<T, null | undefined> {
  return t !== null && t !== undefined
}

export function isMobile() {
  return window.innerWidth < 500 || /mobile|phone/i.test(navigator.userAgent)
}
