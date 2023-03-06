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

export function getRtmpUrl(path: string, serialNum?: string | number): string {
  const base = `rtmp://pili-publish.qnsdk.com/sdk-live/${path}`
  if (serialNum) {
    return base + `?serialnum=${serialNum}`
  }
  return base
}

export const checkUserId = (v: string) => /^\w{1,24}$/.test(v)

export const checkRoomId = (v: string) => /^[0-9a-zA-Z_-]{3,64}$/.test(v)

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function debounce<TArgs extends any[]>(
  fn: (...arg: TArgs) => void,
  interval: number
): typeof fn {
  let timeout = -1
  return (...args: any[]) => {
    if (timeout !== -1) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(fn, interval, ...args)
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
