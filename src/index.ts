
/** @module HTTP */
export * from "./fetch";
export * from "./proxy";
export * from "./pipeline";

import * as middleware from "./middleware"
export { middleware }
import * as backends from "./backends";
import { FetchFunction } from "./fetch";
export { backends };
export { isCdnConfig, buildCdn, buildAppFromConfig } from "./config";
import * as data from "./data";
export { data };

declare global {
  const fly: {
    http: {
      respondWith: (fn: (req: Request) => Promise<Response>) => void
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
    tls?: {
      servername?: string
    }
  }

  export interface Request{
    remoteAddr?: string
  }
}
