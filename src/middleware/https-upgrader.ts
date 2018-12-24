import { RedirectOptions } from "../fetch";
import { Pipe, pipe } from "../pipeline";

/**
 * Redirects http requests to https
 * 
 * This pipe is skipped in development
 */
export function httpsUpgrader(options?: RedirectOptions): Pipe {
  const { status = 302 } = options || {};

  return pipe("httpsUpgrader", (fetch) => {
    if (app.env === "development") {
      console.log("skipping httpsUpgrader in dev");
      return fetch;
    }

    return async (req) => {
      const url = new URL(typeof req === "string" ? req : req.url);
      if (url.protocol !== "https:") {
        url.protocol = "https:";
        return Response.redirect(url.href, status);
      }
      return fetch(req);
    }
  });
}