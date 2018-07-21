import { Site } from "./src/site";
declare var fly: any
declare var app: any

const site = new Site(app.config)

fly.http.respondWith(site.fetch)