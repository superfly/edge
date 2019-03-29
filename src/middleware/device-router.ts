/**
 * @module Middleware
 */
import { origin } from "../backends/origin";
import { FetchFunction } from "../fetch";
import { UAParser } from "ua-parser-js";

/**
 * Device routing options
 */
export interface DeviceOptions {
  /** `ios` should be the name of app in the App Store */
  ios: string,
  /** `android` should be the "package name" of app in the Google Play Store */
  android: string,
}

/**
 * Routes to an app's store page on the App Store/Play Store based on user device + OS
 * 
 * Pre-requisites: UAParser.js(`npm install ua-parser-js`)
 *
 * Example:
 *
 * ```typescript
 * import { origin } from "./src/backends";
 * import { deviceRouter} from "./src/middleware/device-router";
 *
 * const backend = origin({
 *   origin: "https://www.airbnb.com/",
 *   headers: {host: "www.airbnb.com"}
 * })
 *
 * const route = deviceRouter(backend, {
 *   ios: "airbnb",
 *   android: "com.airbnb.android"
 * });
 *
 *  declare var fly: any;
 *  fly.http.respondWith(route);
 * ```
 * 
 * @param fetch 
 * @param options 
 */
export function deviceRouter(fetch: FetchFunction, options: DeviceOptions): FetchFunction {
  return async function deviceRoute(req: RequestInfo, init?: RequestInit): Promise<Response> {

    if(typeof req === "string"){
      req = new Request(req, init);
      init = undefined;
    }

    // get user-agent info from the request
    const ua = req.headers.get("user-agent");

    if(ua){
      // parse the user agent so that we can read/use it
      const parser = new UAParser(ua);

      const device = parser.getDevice();
      const deviceType = device.type;

      const os = parser.getOS();
      const osName = os.name;

      // add device headers to the request
      if(deviceType){
        req.headers.set("Fly-Device-Type", deviceType);
        console.log("Device Type:", deviceType);
      }

      if(osName){
        req.headers.set("Fly-Device-OS", osName);
        console.log("Device OS:", osName);
      }

      // route to app's App Store page if mobile device + iOS is detected
      if (deviceType === "mobile" && osName === "iOS") {
        const backend = origin({
          origin: `http://appstore.com/${options.ios}`,
          headers: {host: "appstore.com"}
        });
        return backend(req);
      } 

      // route to app's Play Store page if mobile device + Android OS is detected
      if (deviceType === "mobile" && osName === "Android") {
        const backend = origin({
          origin: `https://play.google.com/store/apps/details?id=${options.android}`,
          headers: {host: "play.google.com"}
        });
        return backend(req);
      }
    }

    // returns the original response if mobile is not detected (user is on Desktop, tablet, etc..)
    let resp = await fetch(req, init);
    return resp;
  }
}