/**
 * @module Middleware
 */
import { FetchFunction, RedirectOptions } from "../fetch";

/**
 * Redirects http requests to https in production.
 * 
 * In development, this only logs a message
 */
export function httpsUpgrader(fetch: FetchFunction, options?: RedirectOptions): FetchFunction {
  return async function httpsUpgrader(req: RequestInfo, init?: RequestInit) {
    let { status, text } = options || { status: 302, text: "" }
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