/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { SubdomainOptions, optionNormalizer } from "./subdomain_service";
 
/**
 * Glitch configugration.
 */
export interface GlitchOptions {
  appName: string
}


const normalizeOptions = optionNormalizer({hostname: false, subdomain: "appName"})

/**
 * Creates a `fetch` like function for proxying requests to Glitch apps.
 * @param options Glitch app information. Accepts subdomain as a string.
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
