/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, normalizeOptions } from "./subdomain_service";

/**
 * Creates a `fetch` like function for proxying requests to hosted Zeit Now.
 *
 * Example:
 * ```typescript
 * import { zeitNow } from "./src/backends";
 * const backend = zeitNow({
 *  subdomain: "archmotorcycle", <======= needs sample here
 *  directory: "/", <======= needs sample here
 *  hostname: "www.archmotorcycle.com" <======= needs sample here
 * });
 * ```
 * @param options zeitNow information. Accepts subdomain as a string.
 */
export function zeitNow(options: SubdomainOptions | string): ProxyFunction<SubdomainOptions> {
  const config = normalizeOptions(options);

  const zeitNowHost = `${config.subdomain}.zeit-now.com`
  const uri = `https://${zeitNowHost}${config.directory}`
  const headers = {
    "host": zeitNowHost,
    "x-forwarded-host": config.hostname || false
  }

  const fn = proxy(uri, { headers: headers, rewriteLocationHeaders: true })
  return Object.assign(fn, { proxyConfig: config})
}

zeitNow.normalizeOptions = normalizeOptions;
