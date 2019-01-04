import { UAParser } from "ua-parser-js";
import { requestModifier } from "./builder";

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
export const deviceHeaders = requestModifier(addDeviceHeaders)

/**
 * Parses the user agent header from a request, then sets a `Fly-Device-Type` header.
 * @param req 
 */
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