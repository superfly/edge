/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, normalizeOptions } from "./subdomain_service";

/**
 * Creates a `fetch` like function for proxying requests to hosted Squarespace.
 *
 * Example:
 * ```typescript
 * import { squarespace } from "./src/backends";
 * const backend = squarespace({
 *  subdomain: "archmotorcycle", 
 *  directory: "/",
 *  hostname: "www.archmotorcycle.com"
 * });
 * ```
 * @param options SquareSpace information. Accepts subdomain as a string.
 */
export function squarespace(options: SubdomainOptions | string): ProxyFunction<SubdomainOptions> {
  const config = normalizeOptions(options);

  const squarespaceHost = `${config.subdomain}.squarespace.com`
  const uri = `https://${squarespaceHost}${config.directory}`
  const headers = {
    "host": squarespaceHost,
    "x-forwarded-host": config.hostname || false
  }

  const fn = proxy(uri, { headers: headers, rewriteLocationHeaders: true })
  return Object.assign(fn, { proxyConfig: config})
}

squarespace.normalizeOptions = normalizeOptions;
