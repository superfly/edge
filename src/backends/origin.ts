import { ProxyFunction, proxy } from "../proxy";
import { isObject, merge } from "../util";
import { FetchFunction } from "../fetch";
import * as errors from "../errors";
import { Pipe } from "../pipeline";

/**
 * Proxy options for generic http/https backends
 * @ignore
 * See {@link Backends/backend}
 */
export interface OriginOptions {
  origin: string | URL,
  headers?: { [name: string]: string | boolean | undefined },
}

/**
 * Creates a fetch-like proxy function for making requests to http/https origins
 * @module Backends
 */
export function origin(options: OriginOptions | string | URL): Pipe {
  const config = normalizeOptions(options);
  
  return proxy(config.origin, { forwardHostHeader: true, headers: config.headers });

  // return Object.assign(fn, { proxyConfig: config });
}

origin.normalizeOptions = normalizeOptions;

function normalizeOptions(input: unknown): OriginOptions {
  const options: OriginOptions = {
    origin: ""
  };

  if (typeof input === "string" || input instanceof URL) {
    options.origin = input;
  } else if (isObject(input)) {
    merge(options, input, ["origin", "headers"]);
  } else {
    throw errors.invalidInput("options must be an OriginOptions object or url string");
  }

  errors.assertPresent(options.origin, "origin");
  errors.assertUrl(options.origin, "origin");

  return options;
}
