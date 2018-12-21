import { applyReplacements } from "../text-replacements";
import { Pipe, pipe } from "../pipeline";

export interface InjectHTMLOptions {
  targetTag: string;
  html: string;
}

export function injectHTML(options: InjectHTMLOptions): Pipe {
  const { targetTag = "", html = "" } = options || {};

  return pipe("injectHTML", (fetch) => {
    if (!targetTag || !html) {
      console.warn("[injectHTML] targetTag and html must be present, skipping");
      return fetch;
    }

    return async function injectHTML(req: RequestInfo, init?: RequestInit) {
      const resp = await fetch(req, init)
      return await applyReplacements(resp, [[targetTag, html]]);
    }
  });
}
