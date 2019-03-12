/**
 * @module Backends
 */
import { proxy, ProxyFunction } from "../proxy";
import { isObject, merge } from "../util";
import * as errors from "../errors";


/**
 * GitHub Repository information.
 */
export interface GitHubPagesOptions {

  /** Repository owner */
  owner: string,

  /** Repository name <repository> format */
  repository: string,

  /** The custom hostname on repository */
  hostname?: string
}

/**
 * Creates a fetch-like proxy function for making requests to GitHub pages
 * hosted sites.
 * 
 * Example:
 * 
 * ```typescript
 * import { githubPages } from "./src/backends";
 * const backend = githubPages({
 *  owner: "superfly",
 *  repo: "edge",
 *  hostname: "docs.fly.io"
 * });
 * ```
 * @param config The Github repository to proxy to
 * @module Backends
 */
export function githubPages(options: GitHubPagesOptions | string): ProxyFunction<GitHubPagesOptions> {
  const config = _normalizeOptions(options);

  let ghFetch = buildGithubPagesProxy(config)
  let buildTime = 0 // first failure might need a retry

  const c = config

  const fn = async function githubPagesFetch(req: RequestInfo, init?: RequestInit) {
    const original = ghFetch
    if(typeof req === "string"){
      req = new Request(req, init)
    }
    console.debug("ghpages starting fetch:", req.url, buildTime)
    let resp = await ghFetch(req, init)
    console.debug("ghpages resp status:", resp.status)
    if(resp.status === 404 && ghFetch.proxyConfig.hostname){
      // hostname might've been cleared
      const url = new URL(req.url)
      const diff = Date.now() - buildTime
      if(
        (url.pathname === "/" && diff > 10000) // retry after 10s for root
       || diff > 30000){ // wait 5min for everything else


        console.debug("ghpages hostname request got 404:", c.hostname)
        c.hostname = undefined
        ghFetch = buildGithubPagesProxy(c)
      }
    }
    if(resp.status === 301 && !ghFetch.proxyConfig.hostname){
      // 301s happen when you request <org>.github.io/<repo> and need a custom domain
      let location = resp.headers.get("location")
      if(location){
        const url = new URL(location)
        c.hostname = url.hostname
        ghFetch = buildGithubPagesProxy(c)
        console.debug("ghpages found hostname:", c)
      }
    }
    if(original !== ghFetch){
      // underlying proxy function changed, store it and retry
      console.debug("ghpages got a new fetch fn")
      self.proxyConfig = ghFetch.proxyConfig
      resp = await ghFetch(req, init)
    }
    return resp
  }

  let self = Object.assign(fn, { proxyConfig: ghFetch.proxyConfig})
  return self
}

githubPages.normalizeOptions = _normalizeOptions;

function _normalizeOptions(input: unknown): GitHubPagesOptions {
  const options: GitHubPagesOptions = { owner: "", repository: "" };

  if (typeof input === "string" && input.includes("/")) {
    [options.owner, options.repository] = input.split("/");
  } else if (isObject(input)) {
    merge(options, input, ["owner", "repository", "hostname"]);
  } else {
    throw errors.invalidInput("options must be a GitHubPagesOptions object or `owner/repo` string");
  }

  if (!options.owner) {
    throw errors.invalidProperty("owner", "is required");
  }
  if (!options.repository) {
    throw errors.invalidProperty("repository", "is required");
  }

  return options;
}

function buildGithubPagesProxy(options: GitHubPagesOptions): ProxyFunction<GitHubPagesOptions> {
  const {owner, repository, hostname} = options
  const ghHost = `${owner}.github.io`
  const headers = {
    host: ghHost,
    "x-forwarded-host": false
  }
  let path  = `/${repository}/`
  
  if(hostname){
    path = '/' // no repo path when hostname exists
    headers.host = hostname
  }

  console.debug("ghpages creating proxy:", `https://${ghHost}${path}`, {
    headers: headers,
    stripPath: path
  })
  const fn = proxy(`https://${ghHost}${path}`, {
    headers: headers,
    stripPath: path
  })

  return Object.assign(fn, { proxyConfig: options } )
}