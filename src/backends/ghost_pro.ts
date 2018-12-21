/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { isObject, merge } from "../util";
import * as errors from "../errors";
import { Pipe } from "../pipeline";
 
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
 * @param options Ghost Pro blog information. Accepts subdomain as a string..
 */
export function ghostProBlog(options: GhostProOptions | string): Pipe {
  const config = normalizeOptions(options);

  const ghostHost = `${config.subdomain}.ghost.io`
  const uri = `https://${ghostHost}${config.directory}`
  const headers = {
    "host": ghostHost,
    "x-forwarded-host": config.hostname || false
  }

  return proxy(uri, { headers: headers })
  // return Object.assign(fn, { proxyConfig: config})
}

function normalizeOptions(input: unknown): GhostProOptions {
  const options: GhostProOptions = {
    subdomain: "",
    directory: "/"
  };

  if (typeof input === "string") {
    options.subdomain = input;
  } else if (isObject(input)) {
    merge(options, input, ["subdomain", "directory", "hostname"]);
  } else {
    throw errors.invalidInput("options must be a GhostProOptions object or string");
  }

  if (!options.subdomain) {
    throw errors.invalidProperty("subdomain", "is required");
  }
  
  return options;
}

ghostProBlog.normalizeOptions = normalizeOptions;
