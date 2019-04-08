
/** @module HTTP */
export * from "./fetch";
export * from "./proxy";
export * from "./pipeline";
export * from "./mount";

import * as middleware from "./middleware"
export { middleware }
import * as backends from "./backends";
import { FetchFunction } from "./fetch";
export { backends };
export { isCdnConfig, buildCdn, buildAppFromConfig } from "./config";

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

  export interface RequestInit{
    timeout?: number
    readTimeout?: number
    certificate?: {
      key?: string | Buffer | Array<string | Buffer>
      cert?: string | Buffer | Array<string | Buffer>
      ca?: string | Buffer | Array<string | Buffer>
      pfx?: string | Buffer | Array<string | Buffer>
      passphrase?: string
    }
  }
}
