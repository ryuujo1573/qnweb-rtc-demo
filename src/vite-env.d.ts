/// <reference types="vite/client" />
declare global {
  interface Map<K, V> {
    toArray(): V[]
  }

  interface Array<T> {
    groupBy(
      by: (item: T, index: number, array: T[]) => string | number | symbol
    ): Record<ReturnType<typeof by>, T[]>
    groupBy(by: keyof T): Record<ReturnType<typeof by>, T[]>
  }
}

export {}
