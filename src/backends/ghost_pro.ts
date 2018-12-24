/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { isObject } from "../util";
 
/**
 * Ghost Pro configugration.
 */
export interface GhostProOptions {
  /** Blog's subdomain: <subdomain>.ghost.io */
  subdomain: string,
  /** Subdirectory blog is served from (if any) */
  directory?: string,
  /** Ghost Pro blogs can be configured with a custom hostname, we need that to proxy properly */
  hostname?: string
}

/**
 * Creates a `fetch` like function for proxying requests to hosted Ghost Pro blogs.
 * @param config Ghost Pro blog information. Accepts subdomain as a string..
 */
export function ghostProBlog(config: GhostProOptions | string): ProxyFunction<GhostProOptions> {
  if(typeof config === "string") {
    config = { subdomain: config }
  }
  if(!config.directory) {
    config.directory = "/"
  }

  isGhostProOptions(config);

  const ghostHost = `${config.subdomain}.ghost.io`
  const uri = `https://${ghostHost}${config.directory}`
  const headers = {
    "host": ghostHost,
    "x-forwarded-host": config.hostname || false
  }

  const fn = proxy(uri, { headers: headers} )
  const f = Object.assign(fn, { proxyConfig: config})
  return f
}

export function isGhostProOptions(input: unknown): input is GhostProOptions {
  if (!isObject(input)) {
    throw new Error("config must be an object");
  }
  if (!input.subdomain) {
    throw new Error("subdomain must be a string");
  }
  if (!input.directory) {
    throw new Error("subdomain must be a string");
  }

  return true;
}
