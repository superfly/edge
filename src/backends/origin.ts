/**
 * @module Backends
 */
import { ProxyFunction, proxy } from "../proxy";
import { isObject, merge } from "../util";
import * as errors from "../errors";

/**
 * Proxy options for generic http/https backends
 * @hidden
 * See {@link Backends/backend}
 */
export interface OriginOptions {
  origin: string | URL,
  forwardHostHeader?: boolean,
  headers?: { [name: string]: string | boolean | undefined },
}

/**
 * Creates a fetch-like proxy function for making requests to http/https origins
 * @hidden
 */
export function origin(options: OriginOptions | string | URL): ProxyFunction<OriginOptions> {
  const config = normalizeOptions(options);
  
  const fn = proxy(config.origin, { forwardHostHeader: true, headers: config.headers });

  return Object.assign(fn, { proxyConfig: config });
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

  if(options.forwardHostHeader === undefined){
    options.forwardHostHeader = false;
  }

  return options;
}
