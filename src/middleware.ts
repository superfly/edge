/**
 * @module Middleware
 */
import { applyReplacements } from "./text-replacements";
import { FetchFunction } from "@fly/fetch";
import { RedirectOptions } from "src";

declare var app: any
/** @ignore */
export const availableMiddleware: { [key: string]: Middleware | undefined } = {
  "https-upgrader": httpsUpgrader,
  "response-headers": responseHeaders,
  "inject-html": injectHTML
}
/** @ignore */
export interface MiddlewareConfig {
  type: string;
  [prop: string]: unknown;
}

/** @ignore */
export interface Middleware {
  (fetch: FetchFunction, options?: any): FetchFunction
}

/**
 * Redirects http requests to https in production.
 * 
 * In development, this only logs a message
 */
export function httpsUpgrader(fetch: FetchFunction, options?: RedirectOptions) {
  return async function httpsUpgrader(req: RequestInfo, init?: RequestInit) {
    let { status, text } = options || { status: 302, text: ""}
    status = status || 302
    text = text || "Redirecting"
    if (app.env === "development") console.log("skipping httpsUpgrader in dev")
    const url = new URL(typeof req === "string" ? req : req.url)
    if (app.env != "development" && url.protocol != "https:") {
      url.protocol = "https:"
      return new Response(text, { status: status, headers: { location: url.toString() } })
    }
    return fetch(req, init)
  }
}

/** @ignore */
export function responseHeaders(fetch: FetchFunction, options?: any) {
  return async function responseHeaders(req: RequestInfo, init?: RequestInit) {
    const resp = await fetch(req, init)
    if (options) {
      const h = options['headers'] || {}
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

/** @ignore */
export function injectHTML(fetch: FetchFunction, options?: any) {
  return async function injectHTML(req: RequestInfo, init?: RequestInit) {
    const resp = await fetch(req, init)
    if (!options) return resp
    const { target_tag, html } = options
    if (!target_tag || !html) return resp
    return applyReplacements(resp, [[target_tag, html]])
  }
}

/** @ignore */
export default function middleware(fetch: FetchFunction, ...middleware: MiddlewareConfig[]) {
  const mw = middleware.map((m) => {
    const fn = availableMiddleware[m.type]
    if (!fn) throw new Error(`Invalid middleware ${m}`)
    return <[Middleware, any]>[fn, m]
  })
  for (let i = mw.length - 1; i >= 0; i--) {
    const [fn, opts] = mw[i]
    fetch = fn(fetch, opts)
  }
  return fetch
}