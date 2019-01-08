/**
 * @module Middleware
 */
import cache from "@fly/v8env/lib/fly/cache";
import { FetchFunction } from "../fetch";

/**
 * HTTP caching options.
 */
export interface HTTPCacheOptions{
  /** Overrides the cache TTL for all cacheable requests */
  overrideMaxAge?: number
}
/**
 * Cache HTTP responses with `cache-control` headers.
 * 
 * Basic example:
 * ```typescript
 * import httpCache from "./src/middleware/http-cache";
 * import backends from "./src/backends";
 * 
 * const glitch = backends.glitch("fly-example");
 * 
 * const origin = httpCache(glitch, { overrideMaxAge: 3600 });
 * 
 * fly.http.respondWith(origin);
 * ```
 * 
 * @param fetch 
 * @param options 
 */
export function httpCache(fetch: FetchFunction, options?: HTTPCacheOptions): FetchFunction{
  return async function httpCacheFetch(req: RequestInfo, init?: RequestInit): Promise<Response>{
    if(!options) options = {};
    if(typeof req === "string"){
      req = new Request(req, init);
      init = undefined;
    }

    // check the cache
    let cacheable = true;
    for(const h of ["Authorization", "Cookie"]){
      if(req.headers.get(h)){
        console.warn(h + " headers are not supported in http-cache")
        cacheable = false;
      }
    }
    let resp = cacheable ? await storage.match(req) : undefined;

    if(resp){
      // got a hit
      resp.headers.set("Fly-Cache", "hit");
      return resp;
    }

    resp = await fetch(req, init);

    // this should do nothing if the response can't be cached
    const cacheHappened = cacheable ? await storage.put(req, resp, options.overrideMaxAge) : false;

    if(cacheHappened){
      resp.headers.set("Fly-Cache", "miss");
    }
    return resp;
  }
}

/**
 * Configurable HTTP caching middleware. This is extremely useful within a `pipeline`:
 * 
 * ```typescript
 * const app = pipeline(
 *     httpsUpgrader,
 *     httpCaching.configure({overrideMaxAge: 3600}),
 *     glitch("fly-example")
 * )
 * 
 */
httpCache.configure = (options?: HTTPCacheOptions) => {
  return (fetch: FetchFunction) => httpCache(fetch, options)
}

// copied from fly v8env
const CachePolicy = require("http-cache-semantics");
/**
 * export:
 * 	match(req): res | null
 * 	add(req): void
 * 	put(req, res): void
 * @private
 */

const storage = {
  async match(req: Request) {
    const hashed = hashData(req)
    const key = "httpcache:policy:" + hashed // first try with no vary variant
    for (let i = 0; i < 5; i++) {
      const policyRaw = await cache.getString(key)
      console.debug("Got policy:", key, policyRaw)
      if (!policyRaw) {
        return undefined
      }
      const policy = CachePolicy.fromObject(JSON.parse(policyRaw))

      // if it fits i sits
      if (policy.satisfiesWithoutRevalidation(req)) {
        const headers = policy.responseHeaders()
        const bodyKey = "httpcache:body:" + hashed

        const body = await cache.get(bodyKey)
        console.debug("Got body", body.constructor.name, body.byteLength)
        return new Response(body, { status: policy._status, headers })
        // }else if(policy._headers){
        // TODO: try a new vary based key
        // policy._headers has the varies / vary values
        // key = hashData(req, policy._headers)
        // return undefined
      } else {
        return undefined
      }
    }
    return undefined // no matches found
  },
  async add(req: Request) {
    console.debug("cache add")

    const res = await fetch(req)
    return await storage.put(req, res)
  },
  async put(req: Request, res: Response, ttl?: number): Promise<boolean> {
    const resHeaders: any = {}
    const key = hashData(req)

    if(res.headers.get("vary")){
      console.warn("Vary headers are not supported in http-cache")
      return false;
    }

    for (const [name, value] of (res as any).headers) {
      resHeaders[name] = value
    }
    const cacheableRes = {
      status: res.status,
      headers: resHeaders
    }
    const policy = new CachePolicy(
      {
        url: req.url,
        method: req.method,
        headers: req.headers || {}
      },
      cacheableRes
    )

    if(typeof ttl === "number"){
      policy._rescc['max-age'] = ttl; // hack to make policy handle overridden ttl
      console.warn("ttl:", ttl, "storable:", policy.storable());
    }

    ttl = typeof ttl === "number" ? ttl : Math.floor(policy.timeToLive() / 1000);
    if (policy.storable() && ttl > 0) {
      console.debug("Setting cache policy:", "httpcache:policy:" + key, ttl)
      await cache.set("httpcache:policy:" + key, JSON.stringify(policy.toObject()), ttl)
      const respBody = await res.arrayBuffer()
      await cache.set("httpcache:body:" + key, respBody, ttl)
      return true;
    }
    return false;
  }
}

function hashData(req: Request) {
  let toHash = ``

  const u = normalizeURL(req.url)

  toHash += u.toString()
  toHash += req.method

  // TODO: cacheable cookies
  // TODO: cache version for grand busting

  console.debug("hashData", toHash)
  return (crypto as any).subtle.digestSync("sha-1", toHash, "hex")
}

function normalizeURL(u:string) {
  const url = new URL(u)
  url.hash = ""
  const sp = url.searchParams
  sp.sort()
  url.search = sp.toString()

  return url
}
