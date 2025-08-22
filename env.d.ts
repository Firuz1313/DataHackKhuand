/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_LEGACY_DB_HOST: string
  readonly VITE_LEGACY_DB_PORT: string
  readonly VITE_LEGACY_DB_NAME: string
  readonly VITE_LEGACY_DB_USER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
