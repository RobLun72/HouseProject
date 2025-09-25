/// <reference types="vite/client" />

// Vite Environment Variables
interface ImportMetaEnv {
  readonly VITE_HOUSE_API_URL: string;
  readonly VITE_HOUSE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
