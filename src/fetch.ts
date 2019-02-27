/**
 * HTTP helpers, utilities, etc.
 * @module HTTP
 */

/**
 * Converts RequestInfo + RequestInit into a Request object.
 * @param req raw request
 */
export function normalizeRequest(req: RequestInfo, init?: RequestInit) {
  if (typeof req === "string") {
    req = new Request(req, init)
  }
  if (!(req instanceof Request)) {
    throw new Error("req must be either a string or a Request object")
  }
  return {req: req, init: init };
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

export interface FlyFetchFunction {
  (req: Request): Promise<Response>
}

export const FetchGenerator = {
  build: function buildFetchGenerator<T extends FetchGenerator>(fn: T, name: string): T{
    (fn as any)[FetchGenerator.symbol] = name;
    return fn;
  },
  symbol: Symbol("fetchGenerator")
}
/**
 * A function that generates a fetch-like function with additional logic
 */
export interface FetchGenerator {
  (fetch: FetchFunction, ...args: any[]): FetchFunction,
  //[key: Symbol]: string
}

export function isFetchGenerator(obj: any): obj is FetchGenerator{
  return typeof obj === "function" && typeof obj[FetchGenerator.symbol] === "string"
}

/**
 * Options for redirects
 */
export interface RedirectOptions {
  /** The HTTP status code to send (defaults to 302) */
  status?: number,

  /** Text to send as response body. Defaults to "". */
  text?: string
}

export interface FetchFactory {
  (fetch: FetchFunction, options?: any): FetchFunction;
}
