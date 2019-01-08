# Fly CDN

The Fly CDN implements a fully functional CDN as a Fly [Edge App](https://fly.io/docs/#edge-applications) in TypeScript. Out of the box, you're just a `fly deploy` away from leveraging a scalable CDN, infinitely customizable to your needs through code. It's easy to run locally, you can write tests for it, and even integrate it into your normal CI / CD / build pipelines.

## Getting Started

### Want a UI?

Sign up for an account on fly.io and use the `create app` button.

### Pre-requisites

* Node 10.x
* node-gyp: https://github.com/nodejs/node-gyp#installation

### Clone and run tests.

* `git clone https://github.com/superfly/cdn.git <name-of-your-app>` 
* `cd <name-of-your-app>`
* `yarn install`
* `yarn test`

### Local development server

Run `yarn start` to launch a local development server on port 3000, then have a look in your browser: http://localhost:3000

### Deploy to production

You can deploy this app to the Fly hosting service using the CLI. Sign up at fly.io, then run:

* `yarn fly login`
* `yarn fly app create <name-of-your-app>`
* `yarn fly deploy`

## Backends and Middleware

### Backends

[Backends](https://github.com/superfly/cdn/tree/master/src/backends) are origin services you can route requests to. The project includes a backend type [any HTTP service](https://github.com/superfly/cdn/blob/master/src/backends/origin.ts), and more specialized types for proxying to third party services. 

* [GitHub Pages](https://github.com/superfly/cdn/blob/master/src/backends/github_pages.ts)
* [Heroku](https://github.com/superfly/cdn/blob/master/src/backends/heroku.ts)
* [Ghost Pro](https://github.com/superfly/cdn/blob/master/src/backends/ghost_pro.ts)

You can route requests to different backends by importing functions from `/backends/`. This will create a `fetch`-like, proxy function for making requests to either generic http/https backends or more specific origins like GitHub pages hosted sites. 

```import { heroku } from "./src/backends"; 
const backend = heroku({ 
    appName: "example" 
});
```

Want to help out? Write a new backend type and [open a Pull Request](https://github.com/superfly/cdn/compare).

### Middleware

[Middleware](https://github.com/superfly/cdn/tree/master/src/middleware) applies logic to requests before they're sent to the backend, and responses before they're sent to users. We’ve included middleware functions to help you do a number of things such as: 

- Add, remove or overwrite response headers before they're sent to visitors
- Redirect http requests to https in production 
- [Inject HTML](https://fly.io/articles/fly-edge-apps-advanced-http-routing/)
- Build middleware that only operates on a response

## Configuration vs code

By default, this app looks for configuration information in `.fly.yml` and uses that to serve requests. This configuration file redirects `http` requests to `https`, and proxies all requests to a single backend (getting-started.edgeapp.net).

```yaml
app: cdn
config:
  flyCDN:
    backends:
      getting-started:
        type: origin
        origin: https://getting-started.edgeapp.net
        headers:
          host: getting-started.edgeapp.net
    rules:
    - actionType: rewrite
      backendKey: getting-started
    middleware:
    - type: https-upgrader
```

If you'd prefer to write TypeScript, you can modify the index.ts file to look like this, and it will do the exact same thing:

```typescript

import { middleware } from "./src/";
import proxy from "./src/proxy";

const origin = proxy("https://getting-started.edgeapp.net")

fly.http.respondWith(
  proxy.httpsUpgrader(
    origin
  )
);
```
