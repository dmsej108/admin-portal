/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MF_MARKETING_MANIFEST_URL?: string
  readonly VITE_MF_PERSONAL_MANIFEST_URL?: string
  readonly VITE_MF_COMMON_MANIFEST_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@dmsej108/design-system/styles'
