// Minimal ambient declarations for the Cloudflare Workers runtime APIs this project
// uses. Kept local instead of pulling in @cloudflare/workers-types because this
// worker has no package.json / dependency graph of its own (deployed via `npx
// wrangler deploy`); `Cache`/`caches`/`Request`/`Response` already come from the
// standard "WebWorker" lib in worker/tsconfig.json.
export {};

declare global {
  interface KVNamespacePutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: unknown;
  }

  interface KVNamespaceGetWithMetadataResult<Metadata> {
    value: ArrayBuffer | null;
    metadata: Metadata | null;
  }

  interface KVNamespace {
    get(key: string, type: 'json'): Promise<any>;
    get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
    get(key: string, type?: 'text'): Promise<string | null>;
    getWithMetadata<Metadata = unknown>(key: string, type: 'arrayBuffer'): Promise<KVNamespaceGetWithMetadataResult<Metadata>>;
    put(key: string, value: string | ArrayBuffer | ArrayBufferView, options?: KVNamespacePutOptions): Promise<void>;
    delete(key: string): Promise<void>;
  }

  interface CacheStorage {
    default: Cache;
  }

  interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
  }
}
