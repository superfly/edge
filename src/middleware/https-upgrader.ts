/**
 * @module Middleware
 */
import { RedirectOptions } from "../fetch";
import { requestModifier } from "./builder";

/**
 * Redirects http requests to https in production.
 * 
 * In development, this only logs a message
 * @function
 */
export const httpsUpgrader = requestModifier(httpsRedirect)

/**
 * Checks request protocol, returns Redirect response if request is http.
 * 
 * In development, this function just logs a message to the console.
 * 
 * @param req The request to check
 * @param options Options for the resulting redirect
 */
export function httpsRedirect(req: Request, options?: RedirectOptions){
  let { status, text } = options || { status: 302, text: "" }
  status = status || 302
  text = text || "Redirecting"
  if (app.env === "development") console.log("skipping httpsUpgrader in dev")
  const url = new URL(req.url)
  if (app.env != "development" && url.protocol != "https:") {
    url.protocol = "https:"
    return new Response(text, { status: status, headers: { location: url.toString() } })
  }
}