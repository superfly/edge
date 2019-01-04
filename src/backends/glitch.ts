/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { isObject, merge } from "../util";
import * as errors from "../errors";
 
/**
 * Glitch configugration.
 */
export interface GlitchOptions {
  /** Blog's subdomain: <subdomain>.glitch.com */
  subdomain: string
}

/**
 * Creates a `fetch` like function for proxying requests to Glitch apps.
 * @param options Glitch app information. Accepts subdomain as a string.
 */
export function glitch(options: GlitchOptions | string): ProxyFunction<GlitchOptions> {
  const config = normalizeOptions(options);

  const glitchHost = `${config.subdomain}.glitch.me`
  const uri = `https://${glitchHost}`
  const headers = {
    "host": glitchHost
  }

  const fn = proxy(uri, { headers: headers })
  return Object.assign(fn, { proxyConfig: config})
}

function normalizeOptions(input: unknown): GlitchOptions {
  const options: GlitchOptions = {
    subdomain: ""
  };

  if (typeof input === "string") {
    options.subdomain = input;
  } else if (isObject(input)) {
    merge(options, input, ["subdomain"]);
  } else {
    throw errors.invalidInput("options must be a GlitchOptions object or string");
  }

  if (!options.subdomain) {
    throw errors.invalidProperty("subdomain", "is required");
  }
  
  return options;
}

glitch.normalizeOptions = normalizeOptions;
