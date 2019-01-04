import { buildCdnFromAppConfig } from "./src";
  
fly.http.respondWith(buildCdnFromAppConfig());