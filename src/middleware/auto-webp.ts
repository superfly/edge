import { proxy } from "../proxy";
import { Image } from "@fly/v8env/lib/fly/image/index";
import { get } from "@fly/v8env/lib/fly/cache/response";
import { set } from "@fly/v8env/lib/fly/cache/response";

/**
 * Automatically encodes images as webp for supported clients.
 * This would apply to requests with 'image/webp' in the accept header 
 * and 'image/jpeg' or 'image/png' in the response type from origin.
 * 
 * Example:
 * 
 * ```typescript
 * import { imageService } from "./src/middleware/auto-webp";
 *
 * const images = imageService(
 *   "http://www.example.com/"
 * )
 *
 * fly.http.respondWith(images)
 * ```
 */

export interface ImageServiceOptions {
  rootPath?: string,
  webp?: boolean
}

export type FetchFn = (req: RequestInfo, init?: RequestInit) => Promise<Response>

export function imageService(origin: FetchFn | string): FetchFn {
  return async function imageServiceFetch(req: RequestInfo, init?: RequestInit) {
    const parser = defaultParser
    if (typeof origin === "string") {
      origin = proxy(origin)
    }
    if (typeof req === "string") req = new Request(req, init)
    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Only GET/HEAD allowed", { status: 405 })
    }

    const op = parser(new URL(req.url))
    const webp = webpAllowed(req)

    const key = cacheKey(op, webp)
    let resp: Response = await get(key)
    if(resp){
      resp.headers.set("Fly-Cache", "HIT")
      return resp
    }

    const breq = new Request(op.url.toString(), req)
    resp = await fetchFromCache(breq, origin)

    let start = Date.now()

    if(!isImage(resp)) {
      return resp
    }

    if (req.method === "GET"){
      let img = await loadImage(resp)

      if(webp){
        img = img.webp({ force: true })
        resp.headers.set("content-type", "image/webp")
      }else{
        console.log("webp not allowed:", op.url.pathname)
      }
      const body = await img.toBuffer()
      resp = new Response(body.data, resp)
      resp.headers.set("content-length", body.data.byteLength.toString())

      // set image in responseCache
      await set(key, resp, { tags: [op.url.toString()], ttl: 3600 })
      resp.headers.set("Fly-Cache", "MISS")
    }
    return resp
  }
}

async function fetchFromCache(req: Request, origin: FetchFn) {
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

export interface TransformURL {
  url: URL
}

export type TransformURLParser = (url: URL, opts?: ImageServiceOptions) => TransformURL
export function defaultParser(url: URL, opts?: ImageServiceOptions): TransformURL {
  return {
    url: url
  }
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

function cacheKey(op: TransformURL, webp: boolean){
  return [
    op.url,
    webp
  ].join("|")
}
