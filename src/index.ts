
export * from "./fetch";
export * from "./proxy";
import * as middleware from "./middleware"
export { middleware }
import * as backends from "./backends";
export { backends };
export { isCdnConfig, buildCdn, buildCdnFromAppConfig } from "./config";

declare global {
  var app: any
}
