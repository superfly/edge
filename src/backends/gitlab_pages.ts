/**
 * @module Backends
 */
import { proxy, ProxyFunction } from "../proxy";
import { isObject, merge } from "../util";
import * as errors from "../errors";


/**
 * GitLab Repository information.
 */
export interface GitLabPagesOptions {

  /** Repository owner */
  owner: string,

  /** Repository name <repository> format */
  repository: string,

  /** The custom hostname on repository */
  hostname?: string
}

/**
 * Creates a fetch-like proxy function for making requests to GitLab pages
 * hosted sites.
 * 
 * Example:
 * 
 * ```typescript
 * import { gitlabPages } from "./src/backends";
 * const backend = gitlabPages({
 *  owner: "superfly",
 *  repo: "cdn",
 *  hostname: "docs.fly.io"
 * });
 * ```
 * @param config The GitLab repository to proxy to
 * @module Backends
 */
export function gitlabPages(options: GitLabPagesOptions | string): ProxyFunction<GitLabPagesOptions> {
  const config = _normalizeOptions(options);

  let glFetch = buildGitlabPagesProxy(config)
  let buildTime = 0 // first failure might need a retry

  const c = config

  const fn = async function gitlabPagesFetch(req: RequestInfo, init?: RequestInit) {
    const original = glFetch
    if(typeof req === "string"){
      req = new Request(req, init)
    }
    console.debug("glpages starting fetch:", req.url, buildTime)
    let resp = await glFetch(req, init)
    console.debug("glpages resp status:", resp.status)
    if(resp.status === 404 && glFetch.proxyConfig.hostname){
      // hostname might've been cleared
      const url = new URL(req.url)
      const diff = Date.now() - buildTime
      if(
        (url.pathname === "/" && diff > 10000) // retry after 10s for root
       || diff > 30000){ // wait 5min for everything else


        console.debug("glpages hostname request got 404:", c.hostname)
        c.hostname = undefined
        glFetch = buildGitlabPagesProxy(c)
      }
    }
    if(resp.status === 301 && !glFetch.proxyConfig.hostname){
      // 301s happen when you request <org>.github.io/<repo> and need a custom domain
      let location = resp.headers.get("location")
      if(location){
        const url = new URL(location)
        c.hostname = url.hostname
        glFetch = buildGitlabPagesProxy(c)
        console.debug("glpages found hostname:", c)
      }
    }
    if(original !== glFetch){
      // underlying proxy function changed, store it and retry
      console.debug("glpages got a new fetch fn")
      self.proxyConfig = glFetch.proxyConfig
      resp = await glFetch(req, init)
    }
    return resp
  }

  let self = Object.assign(fn, { proxyConfig: glFetch.proxyConfig})
  return self
}

gitlabPages.normalizeOptions = _normalizeOptions;

function _normalizeOptions(input: unknown): GitLabPagesOptions {
  const options: GitLabPagesOptions = { owner: "", repository: "" };

  if (typeof input === "string" && input.includes("/")) {
    [options.owner, options.repository] = input.split("/");
  } else if (isObject(input)) {
    merge(options, input, ["owner", "repository", "hostname"]);
  } else {
    throw errors.invalidInput("options must be a GitLabPagesOptions object or `owner/repo` string");
  }

  if (!options.owner) {
    throw errors.invalidProperty("owner", "is required");
  }
  if (!options.repository) {
    throw errors.invalidProperty("repository", "is required");
  }

  return options;
}

function buildGitlabPagesProxy(options: GitLabPagesOptions): ProxyFunction<GitLabPagesOptions> {
  const {owner, repository, hostname} = options
  const glHost = `${owner}.gitlab.io`
  const headers = {
    host: glHost,
    "x-forwarded-host": false
  }
  let path  = `/${repository}/`
  
  if(hostname){
    path = '/' // no repo path when hostname exists
    headers.host = hostname
  }

  console.debug("glpages creating proxy:", `https://${glHost}${path}`, {
    headers: headers,
    stripPath: path
  })
  const fn = proxy(`https://${glHost}${path}`, {
    headers: headers,
    stripPath: path
  })

  return Object.assign(fn, { proxyConfig: options } )
}