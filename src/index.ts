import { FlyRequest } from "@fly/fetch";

/**
 * HTTP helpers, utilities, etc.
 * @module HTTP
 */

export { BackendInfo, BackendMap } from "./backends"
export { RuleInfo } from "./rules"
import * as middleware from "./middleware"
export { MiddlewareConfig } from "./middleware"
export { middleware }

export { SiteConfig } from "./site"

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
export interface FetchFunction{
  /**
   * @param req URL or request object
   * @param init Options for request
   */
  (req: RequestInfo, init?: RequestInit): Promise<Response>
}


/**
 * Options for redirects
 */
export interface RedirectOptions{
  /** The HTTP status code to send (defaults to 302) */
  status?: number,

  /** Text to send as response body. Defaults to "". */
  text?: string
}