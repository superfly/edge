import { pipeline, middleware, backends } from "../../src/";
 
const origin = backends.echo;

const app = pipeline(
  middleware.httpsUpgrader,
  middleware.deviceHeaders
);

declare var fly: any;
fly.http.respondWith(app(origin));