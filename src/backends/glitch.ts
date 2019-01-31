/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, optionNormalizer } from "./subdomain_service";
 
/**
 * Glitch configuration.
 */
export interface GlitchOptions {
  /** Glitch application name: <appName>.glitch.me */
  appName: string
}


const normalizeOptions = optionNormalizer({hostname: false, subdomain: "appName"})

/**
 * Creates a `fetch` like function for proxying requests to Glitch apps.
 * 
 * Example:
 * ```typescript
 * import { glitch } from "./src/backends";
 * 
 * const backend = glitch({
 *  appName: "fly-example"
 * })
 * ```
 * 
 * @param options Glitch app information. Accepts `appName` as a string.
 */
export function glitch(options: GlitchOptions | string): ProxyFunction<SubdomainOptions> {
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
  return Object.assign(fn, { proxyConfig: config})
}

glitch.normalizeOptions = normalizeOptions;
