import { buildCdnFromAppConfig } from "./src";
  
declare var fly: any

fly.http.respondWith(buildCdnFromAppConfig());