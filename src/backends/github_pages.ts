/**
 * @module Backends
 */
import proxy from "@fly/fetch/proxy"
import { FetchFunction } from "src";

/**
 * GitHub Repository information.
 */
export interface GitHubRepository {

  /** Repository owner */
  owner: string,

  /** Repository name <repository> format */
  repository: string,

  /** The custom hostname on repository */
  hostname?: string
}

/**
 * GitHub Pages need different fetch functions when they're configured 
 * with custom hostnames. This is a wrapper `fetch` like function that
 * keeps the proper inner function around based on the page config.
 */
export interface GitHubPagesFetch extends FetchFunction{
  /** The underlying `fetch` function that makes GitHub origin requests */
  githubFetch: FetchFunction & {
    /** The GitHub <owner/repository> */
    repository: string, 
    /** Custom hostname on repository */
    hostname?: string,
    /** Unix time fetch function was generated */
    buildTime: number
  }
}

/**
 * Creates a fetch-like proxy function for making requests to GitHub pages
 * hosted sites.
 * @param config The Github repository to proxy to
 * @module Backends
 */
export function githubPages(config: GitHubRepository | string){
  if(typeof config === "string"){
    const [owner, repository] = config.split("/")
    config = { owner, repository }
  }
  let ghFetch = buildGithubPagesProxy(config)
  ghFetch.buildTime = 0 // first failure might need a retry

  const c = config

  const fn = async function githubPagesFetch(req: RequestInfo, init?: RequestInit) {
    if(typeof req === "string"){
      req = new Request(req, init)
    }
    console.debug("ghpages starting fetch:", req.url, ghFetch.buildTime)
    let resp = await ghFetch(req, init)
    console.debug("ghpages resp status:", resp.status)
    if(resp.status === 404 && ghFetch.hostname){
      // hostname might've been cleared
      const url = new URL(req.url)
      const diff = Date.now() - ghFetch.buildTime
      if(
        (url.pathname === "/" && diff > 10000) // retry after 10s for root
       || diff > 30000){ // wait 5min for everything else


        console.debug("ghpages hostname request got 404:", c.hostname)
        c.hostname = undefined
        ghFetch = buildGithubPagesProxy(c)
      }
    }
    if(resp.status === 301 && !ghFetch.hostname){
      // 301s happen when you request <org>.github.io/<repo> and need a custom domain
      let location = resp.headers.get("location")
      if(location){
        const url = new URL(location)
        c.hostname = url.hostname
        ghFetch = buildGithubPagesProxy(c)
        console.debug("ghpages found hostname:", c)
      }
    }
    if(self.githubFetch != ghFetch){
      // underlying proxy function changed, store it and retry
      console.debug("ghpages got a new fetch fn:", self.githubFetch.buildTime, ghFetch.buildTime)
      self.githubFetch = ghFetch
      resp = await ghFetch(req, init)
    }
    return resp
  }

  let self = Object.assign(fn, { githubFetch: ghFetch})
  return self
}

function buildGithubPagesProxy(config: GitHubRepository) {
  const {owner, repository, hostname} = config
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

  return Object.assign(fn, {
    repository: repository, 
    hostname: hostname, 
    buildTime: Date.now()
  })
}