import { FlyRequest } from "@fly/v8env/lib/fly/fetch";

/**
 * HTTP helpers, utilities, etc.
 * @module HTTP
 */

export interface FlyFetch {
  (req: Request): Promise<Response>;
}

/**
 * Converts RequestInfo into a Request object.
 * @param req raw request
 */
export function normalizeRequest(req: RequestInfo) {
  if (typeof req === "string") {
    req = new Request(req)
  }
  if (!(req instanceof Request)) {
    throw new Error("req must be either a string or a Request object")
  }
  return req as FlyRequest
}

/**
 * A `fetch` like function. These functions accept HTTP 
 * requests, do some magic, and return HTTP responses.
 */
export interface FetchFunction {
  /**
   * @param req URL or request object
   * @param init Options for request
   */
  (req: RequestInfo, init?: RequestInit): Promise<Response>
}

/**
 * Options for redirects
 */
export interface RedirectOptions {
  /** The HTTP status code to send (defaults to 302) */
  status?: number,
}

export interface FetchFactory {
  (fetch: FetchFunction, options?: any): FetchFunction;
}
