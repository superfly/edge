import { ProxyFunction, proxy } from "../proxy";
import { isObject } from "../util";
import { FetchFunction } from "../fetch";
import balancer from "@fly/load-balancer";

/**
 * Proxy options for generic http/https backends
 * @ignore
 * See {@link Backends/backend}
 */
export interface OriginOptions {
  origin: string | string[],
  headers?: { [name: string]: string | boolean | undefined }
}

/**
 * Creates a fetch-like proxy function for making requests to http/https origins
 * @module Backends
 */
export function origin(config: OriginOptions | string | string[]): ProxyFunction<OriginOptions> {
  if (typeof config === "string") {
    config = { origin: config };
  } else if (config instanceof Array) {
    config = { origin: config };
  }

  config.headers = config.headers || { };
  
  isOriginOptions(config);

  let fn: FetchFunction;
  
  if (config.origin instanceof Array) {
    const headers = config.headers || {};
    const backends = config.origin.map((o) => {
      return proxy(o, { forwardHostHeader: true, headers })
    })
    fn = balancer(backends);
  } else {
    fn = proxy(config.origin, { forwardHostHeader: true, headers: config.headers });
  }

  return Object.assign(fn, { proxyConfig: config });
}

export function isOriginOptions(input: unknown): input is OriginOptions {
  if (!isObject(input)) {
    throw new Error("config must be an object");
  }
  if (!input.origin) {
    throw new Error("origin must be a string or array of strings");
  }
  
  // TODO: verify origin is a valid url

  return true;
}
