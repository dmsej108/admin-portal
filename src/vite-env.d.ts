/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MF_MANIFEST_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@dmsej108/design-system/styles'
