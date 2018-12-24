/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { isObject } from "../util";
 
/**
 * Heroku application configugration.
 */
export interface HerokuOptions {
  /** Blog's subdomain: <subdomain>.ghost.io */
  appName: string
}

/**
 * Creates a `fetch` like function for proxying requests to a Heroku app.
 * @param config Heroku app information. Accepts appName as a string.
 */
export function heroku(options: HerokuOptions | string): ProxyFunction<HerokuOptions>{
  if(typeof options === "string"){
    options = { appName: options }
  }

  isHerokuOptions(options);

  const herokuHost = `${options.appName}.herokuapp.com`
  const uri = `https://${herokuHost}`
  const headers = {
    "host": herokuHost
  }

  const fn = proxy(uri, { headers } )
  return Object.assign(fn, { proxyConfig: options})
}

export function isHerokuOptions(input: unknown): input is HerokuOptions {
  if (!isObject(input)) {
    throw new Error("config must be an object");
  }
  if (!input.appName) {
    throw new Error("appName must be a string");
  }

  return true;
}
