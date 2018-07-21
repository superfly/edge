export interface RuleInfo {
  actionType: "redirect" | "rewrite",
  backendKey?: string,
  matchScheme?: string,
  hostname?: string,
  pathMatchMode?: "prefix" | "full",
  httpHeaderKey?: string,
  httpHeaderValue?: RegExp | string,
  pathPattern?: RegExp | string,
  pathReplacementPattern?: string,
  redirectURLPattern?: string,
  responseReplacements?: [string, string][],
}

export interface BackendMap {
  [key: string]: (req: RequestInfo, init?: RequestInit) => Promise<Response>
}

export default function rules(backends: BackendMap, rules: RuleInfo[]) {
  const compiled = rules.map(compileRule)
  return async function ruleFetch(req: RequestInfo, init?: RequestInit) {
    if (typeof req === "string") {
      req = new Request(req, init)
    }
    const match = compiled.find((r) => r(<Request>req))
    if (!match) {
      return new Response("no routing rule found", { status: 404 })
    }
    const rule = match.rule
    // do the redirect
    if (rule.actionType === "redirect") {
      let url = req.url
      if (match.pathPattern && rule.pathReplacementPattern) {
        url = url.replace(match.pathPattern, rule.pathReplacementPattern)
      }
      return new Response("Redirect", { status: 302, headers: { location: url.toString() } })
    }
    if (rule.actionType !== "rewrite") {
      return new Response("Invalid rule action", { status: 500 })
    }
    const backend = rule.backendKey && backends ? backends[rule.backendKey] : undefined
    if (!backend) {
      return new Response("No backend for rule", { status: 502 })
    }
    // rewrite request if necessary
    if (match.pathPattern && rule.pathReplacementPattern) {
      let url = new URL(req.url)
      url = new URL(url.pathname.replace(match.pathPattern, rule.pathReplacementPattern))
      req = new Request(url.toString(), <RequestInit>req)
    }
    if (rule.responseReplacements && rule.responseReplacements.length > 0) {
      req.headers.delete("accept-encoding")
    }
    let resp = await backend(req, init)
    return applyReplacements(resp, rule.responseReplacements)
  }
}

async function applyReplacements(resp: Response, replacements?: [string, string][]) {
  if (!replacements) return resp
  const contentType = resp.headers.get("content-type") || ""
  if (
    contentType.includes("/html") ||
    contentType.includes("application/javascript") ||
    contentType.includes("application/json") ||
    contentType.includes("text/")
  ) {
    const start = Date.now()
    let body = await resp.text()
    for (const r of replacements) {
      body = body.replace(r[0], r[1])
    }
    resp.headers.delete("content-length")
    resp = new Response(body, resp)
  }
  return resp
}

function compileRule(rule: RuleInfo) {
  const pathPattern = ensureRegExp(rule.pathPattern)
  const httpHeaderValue = ensureRegExp(rule.httpHeaderValue)
  console.log("compiling rule:", rule)
  const fn = function compiledRule(req: Request) {
    const url = new URL(req.url)
    if (rule.matchScheme && rule.matchScheme != "") {
      const scheme = url.protocol.substring(0, -1)
      if (scheme != rule.matchScheme) return false
    }
    if (rule.hostname && rule.hostname != "") {
      if (url.hostname != rule.hostname) {
        return false
      }
    }
    if (rule.httpHeaderKey && rule.httpHeaderKey != "" && httpHeaderValue) {
      const header = req.headers.get(rule.httpHeaderKey)
      if (!header || !header.match(httpHeaderValue)) {
        return false
      }
    }

    if (pathPattern) {
      if (!url.pathname.match(pathPattern)) {
        return false
      }
    }
    return true
  }
  return Object.assign(fn, { rule: rule, pathPattern: pathPattern })
}
function ensureRegExp(pattern?: string | RegExp) {
  if (!pattern || pattern == "") return null
  if (typeof pattern === "string") return new RegExp(pattern)
  if (typeof pattern != "object" || !(pattern instanceof RegExp)) {
    throw new Error("Pattern must be a string or RegExp: " + typeof pattern)
  }
  return pattern
}