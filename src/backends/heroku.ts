/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, optionNormalizer } from "./subdomain_service";
 
/**
 * Heroku application configuration.
 */
export interface HerokuOptions {
  /** Heroku App name: <appName>.herokuapp.com */
  appName: string,

  /** If Heroku is configured with a custom domain name, use it. */
  hostname?: string
}
const normalizeOptions = optionNormalizer({subdomain: "appName"})

/**
 * Creates a `fetch` like function for proxying requests to a Heroku app.
 * Example:
 * ```typescript
 * import { heroku } from "./src/backends";
 * const backend = heroku({
 *  appName: "example"
 * });
 * ```
 * @param config Heroku app information. Accepts appName as a string.
 */
export function heroku(options: HerokuOptions | string): ProxyFunction<SubdomainOptions>{
  const config = normalizeOptions(options);

  const herokuHost = `${config.subdomain}.herokuapp.com`;
  const uri = `https://${herokuHost}`;
  const headers = {
    "host": herokuHost,
    "x-forwarded-host": config.hostname
  };

  const fn = proxy(uri, { headers });
  return Object.assign(fn, { proxyConfig: config });
}

heroku.normalizeOptions = normalizeOptions;
