/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { normalizeOptions, SubdomainOptions } from "./subdomain_service";

/**
 * Creates a `fetch` like function for proxying requests to hosted Firebase sites.
 * 
 * Example:
 * ```typescript
 * import { firebase } from "./src/backends";
 * const backend = firebase({
 *  subdomain: "multi-site-magic"
 * });
 * ```
 * @param options Firebase site information. Accepts subdomain as a string.
 */
export function firebase(options: SubdomainOptions | string): ProxyFunction<SubdomainOptions> {
  const config = normalizeOptions(options);

  const firebaseHost = `${config.subdomain}.firebaseapp.com` 
  const uri = `https://${firebaseHost}${config.directory}`
  const headers = {
    "host": firebaseHost,
    "x-forwarded-host": config.hostname || false
  }

  const fn = proxy(uri, { headers: headers })
  return Object.assign(fn, { proxyConfig: config})
}

firebase.normalizeOptions = normalizeOptions;
