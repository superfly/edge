/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
 
/**
 * Heroku application configugration.
 */
export interface Heroku{
  /** Blog's subdomain: <subdomain>.ghost.io */
  appName: string
}

/**
 * Creates a `fetch` like function for proxying requests to a Heroku app.
 * @param config Heroku app information. Accepts appName as a string..
 */
export function heroku(config: Heroku | string): ProxyFunction<Heroku>{
  if(typeof config === "string"){
    config = { appName: config }
  }

  const herokuHost = `${config.appName}.herokuapp.com`
  const uri = `https://${herokuHost}`
  const headers = {
    "host": herokuHost
  }

  const fn = proxy(uri, { headers: headers} )
  const f = Object.assign(fn, { proxyConfig: config})
  return f
}