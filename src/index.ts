
export * from "./fetch";
export * from "./proxy";
export * from "./pipeline";

import * as middleware from "./middleware"
export { middleware }
import * as backends from "./backends";
import { FetchFunction } from "./fetch";
export { backends };
export { isCdnConfig, buildCdn, buildCdnFromAppConfig } from "./config";

declare global {
  const fly: {
    http: {
      respondWith: (fn: FetchFunction) => void
    }
  }
  const app: {
    env: "production" | "development" | "test",
    region: string,
    config: any
  }
}
