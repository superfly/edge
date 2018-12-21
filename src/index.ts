
export * from "./fetch";
export * from "./proxy";
import * as middleware from "./middleware"
export { middleware }
import * as backends from "./backends";
export { backends };
export { isCdnConfig, buildCdn, buildCdnFromAppConfig } from "./config";

declare global {
  var app: any

  class CookieJar {
    private cookies;
    private parent;
    constructor(parent: any);
    /**
     * Gets a cookie by name
     * @param {String} name
     */
    get(name: any): any;
    /**
     * Sets a cookie, and applies it to the underlying {@linkcode Request} or {@linkcode Response}
     * @param {String} name
     * @param {String} value
     * @param {Object} [options]
     */
    append(name: any, value: any, options: any): void;
  }

  interface Request {
    newProperty?: number;
    readonly cookies: CookieJar
  }

  interface Response {
    readonly cookies: CookieJar;
  }
}


