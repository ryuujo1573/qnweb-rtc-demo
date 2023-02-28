/// <reference types="vite/client" />
declare global {
  interface Map<K, V> {
    toArray(): V[]
  }
}

export {}
