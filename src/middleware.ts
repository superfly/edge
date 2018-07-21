declare var app: any
export const availableMiddleware: { [key: string]: Middleware | undefined } = {
  "https-upgrader": httpsUpgrader,
  "response-headers": responseHeaders
}
export type MiddlewareConfig = string | [string, any | undefined]
export interface Middleware {
  (fetch: Fetch, options?: any): Fetch
}
export interface Fetch {
  (req: RequestInfo, init?: RequestInit): Promise<Response>
}

export function httpsUpgrader(fetch: Fetch, optionss?: any) {
  return async function httpsUpgrader(req: RequestInfo, init?: RequestInit) {
    if (app.env === "development") console.log("skipping httpsUpgrader in dev")
    const url = new URL(typeof req === "string" ? req : req.url)
    if (app.env != "development" && url.protocol != "https:") {
      url.protocol = "https:"
      return new Response("", { status: 302, headers: { location: url.toString() } })
    }
    return fetch(req, init)
  }
}
export function responseHeaders(fetch: Fetch, options?: any) {
  return async function responseHeaders(req: RequestInfo, init?: RequestInit) {
    const resp = await fetch(req, init)
    if (options) {
      const h = options['header_definition'] || {}
      for (const k of Object.getOwnPropertyNames(h)) {
        const v = h[k]
        if (v === false) {
          resp.headers.delete(k)
        }
        if (v) {
          resp.headers.set(k, v.toString())
        }
      }
    }
    return resp
  }
}

export default function middleware(fetch: Fetch, ...middleware: MiddlewareConfig[]) {
  const mw = middleware.map((m) => {
    if (typeof m === "string") m = [m, undefined]
    const fn = availableMiddleware[m[0]]
    if (!fn) throw new Error(`Invalid middleware ${m[0]}`)
    return <[Middleware, any]>[fn, m[1]]
  })
  for (let i = mw.length - 1; i >= 0; i--) {
    const [fn, opts] = mw[i]
    fetch = fn(fetch, opts)
    //const mw = 
  }
  return fetch
}