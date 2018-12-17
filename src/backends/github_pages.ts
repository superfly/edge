/**
 * @module Backends
 */
import { proxy, ProxyFunction } from "../proxy";
import { isObject } from "../util";


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
 * @param config The Github repository to proxy to
 * @module Backends
 */
export function githubPages(options: GitHubPagesOptions | string): ProxyFunction<GitHubPagesOptions> {
  if(typeof options === "string"){
    const [owner, repository] = options.split("/")
    options = { owner, repository }
  }

  isGithubPagesOptions(options);

  let ghFetch = buildGithubPagesProxy(options)
  let buildTime = 0 // first failure might need a retry

  const c = options

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

export function isGithubPagesOptions(input: unknown): input is GitHubPagesOptions {
  if (!isObject(input)) {
    throw new Error("config must be an object");
  }
  if (!input.owner) {
    throw new Error("owner must be a string");
  }
  if (!input.repository) {
    throw new Error("owner must be a string");
  }

  return true;
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