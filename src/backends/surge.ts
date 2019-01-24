/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, normalizeOptions } from "./subdomain_service";

/**
 * Creates a `fetch` like function for proxying requests to hosted Surge.
 *
 * Example:
 * ```typescript
 * import { surge } from "./src/backends";
 * const backend = surge({
 *  subdomain: "archmotorcycle", <======= needs sample here
 *  directory: "/", <======= needs sample here
 *  hostname: "www.archmotorcycle.com" <======= needs sample here
 * });
 * ```
 * @param options surge information. Accepts subdomain as a string.
 */
export function surge(options: SubdomainOptions | string): ProxyFunction<SubdomainOptions> {
  const config = normalizeOptions(options);

  const surgeHost = `${config.subdomain}.surge.sh`
  const uri = `https://${surgeHost}${config.directory}`
  const headers = {
    "host": surgeHost,
    "x-forwarded-host": config.hostname || false
  }

  const fn = proxy(uri, { headers: headers, rewriteLocationHeaders: true })
  return Object.assign(fn, { proxyConfig: config})
}

surge.normalizeOptions = normalizeOptions;
