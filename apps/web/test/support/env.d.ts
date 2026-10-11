// Minimal typing for Vite's import.meta.glob, which Vitest provides at runtime.
// Declared here so tests need neither Node types nor extra dependencies.
interface ImportMetaGlobOptions {
  eager?: boolean;
  query?: string;
  import?: string;
}

interface ImportMeta {
  glob<T = unknown>(pattern: string | string[], options?: ImportMetaGlobOptions): Record<string, T>;
}
