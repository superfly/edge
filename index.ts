import { proxy, middleware, pipeline } from "./src";

const mw = pipeline(
  middleware.httpsUpgrader
)

const app = mw(
  proxy("https://getting-started.edgeapp.net")
);

fly.http.respondWith(app);