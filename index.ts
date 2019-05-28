import { buildAppFromConfig } from "./src";
  
// from config
fly.http.respondWith(buildAppFromConfig());
