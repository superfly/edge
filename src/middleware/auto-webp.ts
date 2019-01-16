import { Image } from "@fly/v8env/lib/fly/image";
import responseCache from "@fly/v8env/lib/fly/cache/response";
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

export function autoWebp(fetch: FetchFunction): FetchFunction {
  return async function imageConversions(req: RequestInfo, init?: RequestInit) {
    if (typeof req === "string"){
      req = new Request(req, init);
      init = undefined;
    }

    // pass through if client doesn't support webp
    if(!webpAllowed(req)){
      return fetch(req, init);
    }

    // generate a cache key
    const key = `webp:${req.url}`;

    // get response from responseCache and serve it (if available)
    let resp: Response = await responseCache.get(key)
    if(resp){
      resp.headers.set("Fly-Image-Cache", "HIT")
      return resp
    }

    resp = await fetch(req, init);

    // check if the req is a png or jpeg image
    if(!isImage(resp)) {
      return resp
    }

    if (req.method === "GET"){
      let img = await loadImage(resp)
      img = img.webp({ force: true, quality: 60 });
      resp.headers.set("content-type", "image/webp");

      const body = await img.toBuffer()
      resp = new Response(body.data, resp)
      resp.headers.set("content-length", body.data.byteLength.toString())

      // put webp in responseCache for an hour
      await responseCache.set(key, resp, { tags: [req.url], ttl: 3600 })
      resp.headers.set("Fly-Image-Cache", "MISS")
    }
    return resp
  }
}

async function loadImage(resp: Response): Promise<Image> {
  if (!isImage(resp)) {
    throw new Error("Response wasn't an image")
  }
  const raw = await resp.arrayBuffer()
  const img = new Image(raw)

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