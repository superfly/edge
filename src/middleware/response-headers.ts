import { FetchFunction } from "../fetch";
import { ProxyFunction } from "../proxy";

export interface ResponseHeadersOptions {
  headers?: {};
}

/**
 * Middleware to set headers on every response.
 * @param fetch 
 * @param options 
 */
export function responseHeaders(fetch: FetchFunction, options?: ResponseHeadersOptions): FetchFunction {
  const headers = options;

  return async function responseHeaders(req: RequestInfo, init?: RequestInit) {
    const resp = await fetch(req, init)
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
}