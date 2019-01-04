/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, optionNormalizer } from "./subdomain_service";
 
/**
 * Heroku application configugration.
 */
export interface HerokuOptions {
  /** Blog's subdomain: <subdomain>.ghost.io */
  appName: string,
  hostname?: string
}
const normalizeOptions = optionNormalizer({subdomain: "appName"})

/**
 * Creates a `fetch` like function for proxying requests to a Heroku app.
 * @param config Heroku app information. Accepts appName as a string.
 */
export function heroku(options: HerokuOptions | string): ProxyFunction<SubdomainOptions>{
  const config = normalizeOptions(options);

  const herokuHost = `${config.subdomain}.herokuapp.com`;
  const uri = `https://${herokuHost}`;
  const headers = {
    "host": herokuHost
  };

  const fn = proxy(uri, { headers });
  return Object.assign(fn, { proxyConfig: config });
}

heroku.normalizeOptions = normalizeOptions;
