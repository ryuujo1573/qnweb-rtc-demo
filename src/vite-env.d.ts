/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  VITE_APP_VERSION: string
  VITE_APP_LATEST_COMMIT_HASH: string
  VITE_APP_BUILD_TIME: string
  [key: string]: string | boolean | undefined
}
