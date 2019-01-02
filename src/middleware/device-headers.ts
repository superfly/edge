import { FetchFunction } from "../fetch";
import { UAParser } from "ua-parser-js";

/**
 * Appends device headers to a request.
 * 
 * Example:
 * 
 * ```typescript
 * import { pipeline, middleware, backends } from "./src/";
 *  
 * const origin = backends.echo;
 * 
 * const app = pipeline(
 *   middleware.httpsUpgrader,
 *   middleware.deviceHeaders
 * );
 * 
 * declare var fly: any;
 * fly.http.respondWith(app(origin));
 * ```
 * @param fetch a fetch function to forward the request to
 */
export function deviceHeaders(fetch: FetchFunction): FetchFunction {
  return async function deviceHeaders(req: RequestInfo, init?: RequestInit){
    if(typeof req === "string"){
      req = new Request(req, init)
      init = undefined
    }
    addDeviceHeaders(req);
    return fetch(req, init)
  }
}

export function addDeviceHeaders(req: Request){
  const ua = req.headers.get("user-agent")
  console.log("User Agent:", ua)
  if(ua){
    const parser = new UAParser(ua);
    console.log("User Agent Parsed:", parser.getResult())
    const device = parser.getDevice();

    if(device.type){
      req.headers.set("Fly-Device-Type", device.type);
    }
  }
}