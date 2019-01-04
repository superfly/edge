/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, normalizeOptions } from "./subdomain_service";
 
/**
 * Glitch configugration.
 */
export interface GlitchOptions extends SubdomainOptions {
  hostname?: undefined
}

/**
 * Creates a `fetch` like function for proxying requests to Glitch apps.
 * @param options Glitch app information. Accepts subdomain as a string.
 */
export function glitch(options: GlitchOptions | string): ProxyFunction<GlitchOptions> {
  const config = normalizeOptions(options);
  if(config.hostname){
    delete config.hostname
  }

  const glitchHost = `${config.subdomain}.glitch.me`
  const uri = `https://${glitchHost}`
  const headers = {
    "host": glitchHost
  }

  const fn = proxy(uri, { headers: headers })
  return Object.assign(fn, { proxyConfig: (config as GlitchOptions)})
}

glitch.normalizeOptions = normalizeOptions;
