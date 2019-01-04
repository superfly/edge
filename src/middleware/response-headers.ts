/**
 * @module Middleware
 */
import * as builder from "./builder";

export interface ResponseHeadersOptions {
  [name: string]: string | boolean
}

/**
 * Sets provided headers on a response object
 * @param resp 
 * @param options 
 */
export async function addResponseHeaders(resp: Response, headers: ResponseHeadersOptions){
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (v === false) {
        resp.headers.delete(k)
      }
      if (v) {
        resp.headers.set(k, v.toString())
      }
    }
  }
  return resp
}

/**
 * Middleware to set headers on responses
 * @param fetch 
 * @param options 
 */
export const responseHeaders = builder.responseModifier(addResponseHeaders)