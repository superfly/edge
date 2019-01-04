/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, normalizeOptions } from "./subdomain_service";

/**
 * Creates a `fetch` like function for proxying requests to hosted Ghost Pro blogs.
 * @param options Ghost Pro blog information. Accepts subdomain as a string..
 */
export function ghostProBlog(options: SubdomainOptions | string): ProxyFunction<SubdomainOptions> {
  const config = normalizeOptions(options);

  const ghostHost = `${config.subdomain}.ghost.io`
  const uri = `https://${ghostHost}${config.directory}`
  const headers = {
    "host": ghostHost,
    "x-forwarded-host": config.hostname || false
  }

  const fn = proxy(uri, { headers: headers })
  return Object.assign(fn, { proxyConfig: config})
}

ghostProBlog.normalizeOptions = normalizeOptions;
