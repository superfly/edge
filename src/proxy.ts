/**
 * Library for proxying requests to origins. Use this to create `fetch` like functions
 *  for making requests to other services. For example:
 *
 * ```javascript
 * // sends all traffic to an Amazon ELB,
 * // `Host` header passes through from visitor request
 * const origin = proxy("https://elb1298.amazonaws.com")
 * ```
 *
 * By default, this function sends the `Host` header inferred from the origin URL. To forward
 * host headers sent by visitors, set `forwardHostHeader` to true.
 *
 * ```javascript
 * // sends all traffic to an Amazon ELB, include host header from original request.
 * const origin = proxy("https://elb1298.amazonaws.com", {
 *  forwardHostHeader: true
 * })
 * ```
 *
 * And then way more rare, no host header at all. Usually you'd strip out `x-forwarded-host`,
 * since some origins don't like that:
 * ```javascript
 * // sends all traffic to an Amazon ELB, never sends a host header
 * const origin = proxy("https://elb1298.amazonaws.com", {
 *  headers: { host: false}
 * })
 * ```
 *
 * @preferred
 * @module HTTP
 */
import { normalizeRequest, FetchFunction } from "./fetch"

/**
 * This generates a `fetch` like function for proxying requests to a given origin.
 * When this function makes origin requests, it adds standard proxy headers like
 * `X-Forwarded-Host` and `X-Forwarded-For`. It also passes headers from the original
 * request to the origin.
 * @param origin A URL to an origin, can include a path to rebase requests.
 * @param options Options and headers to control origin request.
 */
export function proxy(origin: string | URL, options?: ProxyOptions): ProxyFunction<ProxyOptions> {
  if (!options) {
    options = {}
  }
  async function proxyFetch(req: RequestInfo, init?: RequestInit) {
    req = normalizeRequest(req)
    if (!options) {
      options = {}
    }
    const breq = buildProxyRequest(origin, options, req, init)
    let bresp = await fetch(breq)
    if(options.rewriteLocationHeaders !== false){
      bresp = rewriteLocationHeader(req.url, breq.url, bresp)
    }
    return bresp
  }

  return Object.assign(proxyFetch, { proxyConfig: options})
}

/**
 * @protected
 * @hidden
 * @param origin
 * @param options
 * @param req
 * @param init
 */
export function buildProxyRequest(origin: string | URL, options: ProxyOptions, r: RequestInfo, init?: RequestInit) {
  const req = normalizeRequest(r)

  const url = new URL(req.url)
  let breq: Request | null = null

  breq = req.clone()

  if (typeof origin === "string") {
    origin = new URL(origin)
  }

  const requestedHostname = req.headers.get("host") || url.hostname
  url.hostname = origin.hostname
  url.protocol = origin.protocol
  url.port = origin.port

  if (options.stripPath && typeof options.stripPath === "string") {
    // remove basePath so we can serve `onehosthame.com/dir/` from `origin.com/`
    url.pathname = url.pathname.substring(options.stripPath.length)
  }
  if (origin.pathname && origin.pathname.length > 0) {
    url.pathname = [origin.pathname.replace(/\/$/, ""), url.pathname.replace(/^\//, "")].join("/")
  }
  if (url.pathname.startsWith("//")) {
    url.pathname = url.pathname.substring(1)
  }

  if (url.toString() !== breq.url) {
    breq = new Request(url.toString(), breq)
  }
  // we extend req with remoteAddr
  breq.headers.set("x-forwarded-for", req.remoteAddr || "")
  breq.headers.set("x-forwarded-host", requestedHostname)
  breq.headers.set("x-forwarded-proto", url.protocol.replace(":", ""))

  if (!options.forwardHostHeader) {
    // set host header to origin.hostnames
    breq.headers.set("host", origin.hostname)
  }

  if (options.headers) {
    for (const h of Object.getOwnPropertyNames(options.headers)) {
      const v = options.headers[h]
      if (v === false) {
        breq.headers.delete(h)
      } else if (v && typeof v === "string") {
        breq.headers.set(h, v)
      }
    }
  }
  return breq;
}

export function rewriteLocationHeader(url: URL | string, burl: URL | string, resp: Response){
  const locationHeader = resp.headers.get("location")
  if(!locationHeader){
    return resp
  }
  if(typeof url === "string"){
    url = new URL(url)
  }
  if(typeof burl === "string"){
    burl = new URL(burl)
  }
  const location = new URL(locationHeader, burl)

  if(location.hostname !== burl.hostname || location.protocol !== burl.protocol){
    return resp
  }


  let pathname = location.pathname
  if(url.pathname.endsWith(burl.pathname)){
    // url path: /original/path/
    // burl path: /path/
    // need to prefix base
    const prefix = url.pathname.substring(0, url.pathname.length - burl.pathname.length)
    pathname = prefix + location.pathname

  } else if(burl.pathname.endsWith(url.pathname)) {
    // url path: /original/path/
    // burl path: /path/
    // need to remove prefix
    const remove = burl.pathname.substring(0, burl.pathname.length - url.pathname.length)
    if(location.pathname.startsWith(remove)){
      pathname = location.pathname.substring(remove.length, location.pathname.length)
    }
  }
  if(pathname !== location.pathname){
    // do the rewrite
    location.pathname = pathname
    location.protocol = url.protocol
    location.hostname = url.hostname
    resp.headers.set("location", location.toString())
  }

  return resp
}

/**
 * Options for `proxy`.
 */
export interface ProxyOptions {
  /**
   * Replace this portion of URL path before making request to origin.
   *
   * For example, this makes a request to `https://fly.io/path1/to/document.html`:
   * ```javascript
   * const opts = { stripPath: "/path2/"}
   * const origin = proxy("https://fly.io/path1/", opts)
   * origin("https://somehostname.com/path2/to/document.html")
   * ```
   */
  stripPath?: string

  /**
   * Forward `Host` header from original request. Without this options,
   * proxy requests infers a host header from the origin URL.
   * Defaults to `false`.
   */
  forwardHostHeader?: boolean

  /**
   * Rewrite location headers (defaults to true) to match incoming request.
   * 
   * Example:
   *  - Request url: http://test.com/blog/asdf
   *  - Proxy url: http://origin.com/asdf
   *  - Location http://origin.com/jklm bcomes http://test.com/blog/jklm
   */
  rewriteLocationHeaders?: boolean
  /**
   * Headers to set on backend request. Each header accepts either a `boolean` or `string`.
   * * If set to `false`, strip header entirely before sending.
   * * `true` or `undefined` send the header through unmodified from the original request.
   * * `string` header values are sent as is
   */
  headers?: {
    [key: string]: string | boolean | undefined
    /**
     * Host header to set before sending origin request. Some sites only respond to specific
     * host headers.
     */
    host?: string | boolean
  }
}


/**
 * A proxy `fetch` like function. These functions include their 
 * original configuration information.
 */
export interface ProxyFunction<T = unknown> extends FetchFunction {
  proxyConfig: T
}

export interface ProxyFactory<TOpts = any, TInput = any> {
  (options: TInput): ProxyFunction<TOpts>;
  normalizeOptions?: (input: any) => TOpts;
}

/*
 Requests with rewrites:
   - https://example.com/blog/ -> https://example.blogservice.com/
   - strip /blog/ to backend (proxy function does this)
   - prepend /blog/ to location headers on response
*/
