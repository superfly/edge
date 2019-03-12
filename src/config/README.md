# Fly Edge (Standalone app)

The Fly Edge can be run standalone with a yaml based configuration schema.

By default, this app looks for configuration information in `.fly.yml` and uses that to serve requests. This configuration file redirects `http` requests to `https`, and proxies all requests to a single backend (getting-started.edgeapp.net).

```yaml
app: edge-app
config:
  flyApp:
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

This config is the equivalent of writing TypeScript that consumes the `@fly/edge` as library:

```typescript

import { middleware } from "@fly/edge";
import proxy from "@fly/edge/proxy";

const origin = proxy("https://getting-started.edgeapp.net")

fly.http.respondWith(
  proxy.httpsUpgrader(
    origin
  )
);
```