import { proxy } from "../proxy";
import { Image } from "@fly/v8env/lib/fly/image/index";
import { get } from "@fly/v8env/lib/fly/cache/response";
import { set } from "@fly/v8env/lib/fly/cache/response";
import { FetchFunction } from "../fetch";

/**
 * Automatically encodes images as webp for supported clients.
 * This would apply to requests with 'image/webp' in the accept header 
 * and 'image/jpeg' or 'image/png' in the response type from origin.
 * 
 * Example: 
 * 
 * ```typescript
 * import { origin } from "./src/backends";
 * import { autoWebp } from "./src/middleware/auto-webp";
 * 
 * const backend = origin({
 *  origin: "https://fly.io/",
 *  headers: {host: "fly.io"}
 * })
 * 
 * const images = autoWebp(backend);
 * 
 * fly.http.respondWith(images);
 * ```
 */

export const images = new Array();

export function autoWebp(origin: FetchFunction): FetchFunction {
  return async function imageConversions(req: RequestInfo, init?: RequestInit) {
    if (typeof origin === "string") {
      origin = proxy(origin)
    }
    if (typeof req === "string") req = new Request(req, init)

    const op = new URL(req.url)

    // check if client supports webp
    const webp = webpAllowed(req)

    // generate a cache key
    const key = cacheKey(op, webp)

    // get response from responseCache and serve it (if available)
    let resp: Response = await get(key)
    if(resp){
      resp.headers.set("Fly-Cache", "HIT")
      return resp
    }

    const breq = new Request(op.toString(), req)
    resp = await fetchFromCache(breq, origin)

    let start = Date.now()

    // check if the req is a png or jpeg image
    if(!isImage(resp)) {
      return resp
    }

    if (req.method === "GET"){
      let img = await loadImage(resp)

      if(webp){
        img = img.webp({ force: true })
        resp.headers.set("content-type", "image/webp")
      }

      const body = await img.toBuffer()
      resp = new Response(body.data, resp)
      resp.headers.set("content-length", body.data.byteLength.toString())

      // set image in responseCache
      await set(key, resp, { tags: [op.toString()], ttl: 3600 })
      resp.headers.set("Fly-Cache", "MISS")
    }
    return resp
  }
}

async function fetchFromCache(req: Request, origin: FetchFunction) {
  let start = Date.now()
  let resp: Response = await get(req.url)
  if (resp) {
    resp.headers.set("Fly-Cache", "hit")
    console.log(`Image fetch from cache (${Date.now() - start}):`, req.url)
    return resp
  }

  resp = await origin(req)

  if (resp.status === 200 && req.method === "GET") {
    console.log(`Image fetch from URL (${Date.now() - start}):`, req.url)
    start = Date.now()
    await set(req.url, resp, { tags: [req.url], ttl: 3600 * 24 * 30 * 6 })
    console.log(`Image write to cache (${Date.now() - start}):`, req.url, resp.headers.get("content-length"))
    resp.headers.set("Fly-Cache", "miss")
    return resp
  }
  return resp
}

async function loadImage(resp: Response): Promise<Image> {
  if (!isImage(resp)) {
    throw new Error("Response wasn't an image")
  }
  const raw = await resp.arrayBuffer()
  const img = new Image(raw)
  
  const meta = img.metadata()
  console.log("Image:", meta)
  
  return img
}

function isImage(resp: Response): boolean{
  const contentType = resp.headers.get("Content-Type") || ""
  if (contentType.includes("image/png") || contentType.includes("image/jpeg")) {
    return true
  }
  return false
}

export function webpAllowed(req: Request){
  const accept = req.headers.get("accept") || ""
  if(
    accept.includes("image/webp")
  ){
    return true
  }
  return false
}

function cacheKey(op: URL, webp: boolean){
  return [
    op,
    webp
  ].join("|")
}
