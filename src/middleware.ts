declare var app: any
const middleware = {
  "https-upgrader": httpsUpgrader
}

export interface Fetch {
  (req: RequestInfo, init?: RequestInit): Promise<Response>
}
export function httpsUpgrader(fetch: Fetch) {
  return async function httpsUpgrader(req: RequestInfo, init?: RequestInit) {
    const url = new URL(typeof req === "string" ? req : req.url)
    if (app.env != "development" && url.protocol != "https:") {
      url.protocol = "https:"
      return new Response("", { status: 302, headers: { location: url.toString() } })
    }
    return fetch(req, init)
  }
}
export default middleware