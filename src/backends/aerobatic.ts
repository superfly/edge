/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { normalizeOptions, SubdomainOptions } from "./subdomain_service";

/**
 * Creates a `fetch` like function for proxying requests to hosted Aerobatic sites.
 * 
 * Example:
 * ```typescript
 * import { aerobatic } from "./src/backends";
 * const backend = aerobatic({
 *  subdomain: "sample"
 * });
 * ```
 * @param options Aerobatic site information. Accepts subdomain as a string.
 */
export function aerobatic(options: SubdomainOptions | string): ProxyFunction<SubdomainOptions> {
  const config = normalizeOptions(options);

  const aerobaticHost = `${config.subdomain}.aerobaticapp.com` 
  const uri = `https://${aerobaticHost}${config.directory}`
  const headers = {
    "host": aerobaticHost,
    "x-forwarded-host": config.hostname || false
  }

  const fn = proxy(uri, { headers: headers })
  return Object.assign(fn, { proxyConfig: config})
}

aerobatic.normalizeOptions = normalizeOptions;
