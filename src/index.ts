/**
 * HTTP helpers, utilities, etc.
 * @module HTTP
 */
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

export { BackendInfo, BackendMap } from "./backends"
export { RuleInfo } from "./rules"
export { MiddlewareConfig } from "./middleware"
export { SiteConfig } from "./site"