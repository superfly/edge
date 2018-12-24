import { normalizeRequest, FetchFunction } from "./fetch";

export type MountInfo = [string | RegExp, FetchFunction];

export function mount(paths: MountInfo[]) {
  function matchMount(req: RequestInfo, init?: RequestInit) {
    req = normalizeRequest(req)

    const url = new URL(req.url)
    for (const [p, f] of paths) {
      if (typeof p === "string" && url.pathname.startsWith(p)) {
        return f
      } else if (p instanceof RegExp && url.pathname.match(p)) {
        return f
      }
    }
    return null
  }

  const fn = async function mountFetch(req: RequestInfo, init?: RequestInit) {
    const f = matchMount(req, init)
    if (f) {
      return f(req, init)
    }
    return new Response("no mount found", { status: 404 })
  }

  return Object.assign(fn, { match: matchMount })
}