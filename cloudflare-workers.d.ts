/// <reference types="@cloudflare/workers-types" />

declare module "cloudflare:workers" {
  export const env: {
    SITE_DATA: KVNamespace;
    VINEXT_KV_CACHE: KVNamespace;
    PHOTOS: R2Bucket;
    ADMIN_PASSWORD?: string;
  };
}
