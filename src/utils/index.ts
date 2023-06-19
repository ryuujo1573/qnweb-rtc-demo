export * from './datetime'
export * from './hooks'
export * from './avatar'
export * from './typing'
import type { PointerEvent } from 'react'

export const checkUserId = (v: string) => /^\w{1,24}$/.test(v)

export const checkRoomId = (v: string) => /^[0-9a-zA-Z_-]{3,64}$/.test(v)

export const checkAppId = (v: string) => /^[0-9a-zA-Z]{8,12}$/.test(v) // informal

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function debounce<TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  interval: number,
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
  interval: number,
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

let firstTouch = true
let lastPosition = [0, 0]
const maxInterval = 300
const maxDelta = 10
export function doubleClickHelper<T>(fn: (e: PointerEvent<T>) => void) {
  return {
    onPointerDown: function (e: PointerEvent<T>) {
      if (firstTouch) {
        console.log('first')
        firstTouch = false

        lastPosition = [e.screenX, e.screenY]
        setTimeout(() => (firstTouch = true), maxInterval)
      } else {
        const [x0, y0] = lastPosition
        if (
          Math.abs(e.screenX - x0) < maxDelta &&
          Math.abs(e.screenY - y0) < maxDelta
        ) {
          fn(e)
        }
      }
    },
  }
}
