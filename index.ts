import { buildCdnFromAppConfig } from "./src";
  
// from config
fly.http.respondWith(buildCdnFromAppConfig());