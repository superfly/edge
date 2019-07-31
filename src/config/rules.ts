/**
 * @module Config
 * @ignore
 * */
import { applyReplacements } from "../text-replacements";
import { BackendProxies } from "./index";

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
  redirectStatus?: number,
  responseReplacements?: [string, string][],
}

declare var app: any

export function validateRule(r: any): r is RuleInfo {
  if (typeof r !== "object") {
    throw new Error("must be an object")
  }
  if (!r.actionType) {
    throw new Error("actionType must be defined")
  }
  if (r.actionType !== "redirect" && r.actionType !== "rewrite") {
    throw new Error("actionType must be either `redirect` or `rewrite`")
  }
  if (r.actionType === "rewrite" && !r.backendKey) {
    throw new Error("must inclue `backendKey` when actionType is set to `rewrite`")
  }
  return true
}

export function buildRules(backends: BackendProxies, rules: RuleInfo[]) {
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
      let original = new URL(req.url)
      let url: string | undefined = undefined
      if (match.pathPattern && rule.redirectURLPattern) {
        url = match.pathPattern.replace(original.pathname, rule.redirectURLPattern)
      } else if (rule.redirectURLPattern) {
        url = rule.redirectURLPattern
      }
      if (!url || original.toString() === url) {
        return new Response("Can't redirect to a bad URL", { status: 500 })
      }
      const status = rule.redirectStatus || 302
      const redirectTo = new URL(url, original)
      return new Response("Redirect", { status: status, headers: { location: redirectTo.toString() } })
    }
    if (rule.actionType !== "rewrite") {
      return new Response("Invalid rule action", { status: 500 })
    }
    const backend = rule.backendKey && backends ? backends.get(rule.backendKey) : undefined
    if (!backend) {
      return new Response("No backend for rule", { status: 502 })
    }
    // rewrite request if necessary
    if (match.pathPattern && rule.pathReplacementPattern) {
      let url = new URL(req.url)
      url = new URL(match.pathPattern.replace(url.pathname, rule.pathReplacementPattern), url)
      req = new Request(url.toString(), <RequestInit>req)
    }
    if (!rule.responseReplacements || rule.responseReplacements.length === 0) {
      return await backend(req, init)
    }

    req.headers.delete("accept-encoding")
    let resp = await backend(req, init)
    return applyReplacements(resp, rule.responseReplacements)
  }
}

function compileRule(rule: RuleInfo) {
  const pathPattern = ensurePathPatternMatcher(rule.pathPattern)
  const httpHeaderValue = ensureRegExp(rule.httpHeaderValue)
  const fn = function compiledRule(req: Request) {
    const url = new URL(req.url)
    if (rule.matchScheme === "http" || rule.matchScheme === "https") {
      const scheme = url.protocol.slice(0, -1)
      if (scheme !== rule.matchScheme) return false
    }
    if (rule.hostname && rule.hostname !== "") {
      if (url.hostname !== rule.hostname) {
        return false
      }
    }
    if (rule.httpHeaderKey && rule.httpHeaderKey !== "" && httpHeaderValue) {
      const header = req.headers.get(rule.httpHeaderKey)
      if (!header || !header.match(httpHeaderValue)) {
        return false
      }
    }
    if (pathPattern && !pathPattern.match(url.pathname)) {
      return false
    }
    return true
  }
  return Object.assign(fn, { rule: rule, pathPattern: pathPattern })
}

function ensureRegExp(pattern?: string | RegExp): RegExp | null {
  if (!pattern || pattern == "") return null
  if (typeof pattern === "string") return new RegExp(pattern)
  if (pattern instanceof RegExp) return pattern

  throw new Error("Pattern must be a string or RegExp: " + typeof pattern)
}

function ensurePathPatternMatcher(pattern?: string | RegExp): PathPatternMatcher | null {
  if (!pattern || pattern == "") return null
  if (typeof pattern === "string") return new PathPatternMatcher(pattern)
  if (pattern instanceof RegExp) return new PathPatternMatcher(pattern)

  throw new Error("Pattern must be a string or RegExp: " + typeof pattern)
}


export class PathPatternMatcher {
  private regex: RegExp
  private params: string[] = []

  constructor(pattern: string | RegExp) {
    if (pattern instanceof RegExp) {
      this.regex = pattern
    } else {
      const matches = pattern.match(/([:\*]\w+)/g)
      if (matches) {
        for (const match of matches) {
          this.params.push(match.substring(1))
          if (match.startsWith(":")) {
            pattern = pattern.replace(match, "([^/.]+)")
          } else if (match.startsWith("*")) {
            pattern = pattern.replace(match, "(.+)")
          }
        }
      }
      this.regex = new RegExp(pattern)
    }
  }

  match(path: string) {
    return this.regex.test(path)
  }

  parse(path: string) {
    const params: { [name: string]: string } = {}

    const match = this.regex.exec(path)
    if (!match) {
      return params
    }
    for (const [paramIndex, paramName] of this.params.entries()) {
      params[paramName] = match[paramIndex + 1];
    }
    return params
  }

  replace(path: string, replacement: string) {
    const params = this.parse(path)
    for (const [name, value] of Object.entries(params)) {
      replacement = replacement.replace(`$${name}`, value)
    }
    return replacement
  }
}
