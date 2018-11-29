/** @module Site */
import backend, { BackendInfo, BackendMap } from "./backends";
import rules, { RuleInfo } from "./rules";
import middleware, { MiddlewareConfig } from "./middleware";

export interface SiteConfig {
  middleware: MiddlewareConfig[],
  backends: {
    [key: string]: BackendInfo
  }
  rules: RuleInfo[]
}

export class Site {
  backends: BackendMap
  fetch: (req: RequestInfo, init?: RequestInit) => Promise<Response>
  constructor(config: SiteConfig) {
    if (!isSite(config)) {
      throw new Error('Invalid site config')
    }
    this.backends = new Map()
    for (const k of Object.getOwnPropertyNames(config.backends)) {
      this.backends.set(k, backend(config.backends[k]))
    }

    let fn = rules(this.backends, config.rules)

    this.fetch = (config.middleware && config.middleware.length > 0) ?
      middleware(fn, ...config.middleware) :
      fn
  }
}

// runtime validation of site config
function isSite(config: any): config is SiteConfig {
  if (!config.backends) config.backends = {}
  if (!config.rules) config.rules = []
  if (typeof config.backends !== "object") {
    throw new Error("backends key must be a map of keys -> Backend definition")
  }
  for (const k of Object.getOwnPropertyNames(config.backends)) {
    if (typeof k !== "string") {
      throw new Error("Invalid backend key: " + k)
    }
    try { isBackendInfo(config.backends[k]) }
    catch (err) {
      throw new Error(`backend definition for ${k} is invalid: ${err.message ? err.message : err}`)
    }
  }
  if (!(config.rules instanceof Array)) {
    throw new Error("rules must be an array of Rule definitions")
  }
  for (let i = 0; i < config.rules.length; i++) {
    const r = config.rules[i]
    try { isRule(r) }
    catch (err) {
      throw new Error(`rule at index ${i} is invalide: ${err.message ? err.message : err}`)
    }
  }
  return true
}

function isBackendInfo(b: any): b is BackendInfo {
  if (typeof b !== "object") {
    throw new Error("must be a hash")
  }
  if (!b.origin) {
    throw new Error("origin is not defined")
  }
  return true
}
function isRule(r: any): r is RuleInfo {
  if (typeof r !== "object") {
    throw new Error("must be a hash")
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