import { backends, proxy, middleware, pipeline } from "@fly/cdn";

const mw = pipeline(
  middleware.httpsUpgrader,
  middleware.httpCache
)

const app = mw(
  proxy("https://getting-started.edgeapp.net")
);

fly.http.respondWith(app);