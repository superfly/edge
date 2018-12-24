import { backends, proxy, middleware, normalizeRequest } from "./src";
import { pipeline, pipe, match, gate, mount } from "./src/pipeline";
import { routeSegments } from "./src/segments";
  
declare var fly: any

function say(message: string) {
  return pipe(`say ${message}`, (fetch) => {
    return (req) => {
      return Promise.resolve(new Response(message));
    }
  })
}

function echoPath() {
  return pipe(`echoPath`, (fetch) => {
    return (req) => {
      const url = new URL(req.url);
      return Promise.resolve(new Response(url.pathname));
    }
  })
}

function cycle(every: number) {
  let i = 0;
  return (req: Request) => {
    return i++ % every === 0;
  }
}

const heyOrigin = say("hey");
const hoOrigin = say("ho");

const segment = routeSegments({
  name: "fake-segments",
  segments: [
    { id: "hey", origin: heyOrigin },
    { id: "ho", origin: hoOrigin },
  ]
});

const app = pipeline(
  middleware.httpsUpgrader(),
  match(
    mount("/colors", echoPath()),
    segment
  )
)(fetch);

fly.http.respondWith(app);


