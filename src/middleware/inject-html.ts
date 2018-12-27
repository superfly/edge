import { FetchFunction, normalizeRequest } from "../fetch";
import { applyReplacements } from "../text-replacements";

export interface InjectHTMLOptions {
  targetTag: string;
  html: string;
}

/** @ignore */
export function injectHTML(fetch: FetchFunction, options?: InjectHTMLOptions): FetchFunction {
  const { targetTag = "", html = "" } = options || {};

  if (!targetTag || !html) {
    return fetch;
  }

  return async function injectHTML(req: RequestInfo, init?: RequestInit) {
    req = normalizeRequest(req);
    req.headers.delete("accept-encoding")
    const resp = await fetch(req, init)
    return applyReplacements(resp, [[targetTag, html]])
  }
}