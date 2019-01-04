/**
 * @module Middleware
 */
import { responseModifier } from "./builder";

/**
 * Header name/value pairs to set on a response. The boolean `false` removes the header entirely.
 */
export interface ResponseHeadersOptions {
  [name: string]: string | false
}

/**
 * Middleware to set headers on responses
 * @param fetch 
 * @param options 
 */
export const responseHeaders = responseModifier(addResponseHeaders)

/**
 * Sets provided headers on a response object
 * @private
 * @param resp 
 * @param options 
 */
export async function addResponseHeaders(resp: Response, headers: ResponseHeadersOptions){
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (v === false) {
        resp.headers.delete(k)
      } else if (<any>v !== true) { // true implies pass through
        resp.headers.set(k, v.toString())
      }
    }
  }
  return resp
}
