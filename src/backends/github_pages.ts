/**
 * @module Backends
 */
import { proxy } from "../proxy";
import { isObject, merge } from "../util";
import * as errors from "../errors";
import { Pipe, pipe } from "../pipeline";


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
export function githubPages(options: GitHubPagesOptions | string): Pipe {
  const config = normalizeOptions(options);

  return pipe("githubPages", (fetch) => {
    let ghFetch = buildGithubPagesProxy(config)(fetch);
    let buildTime = 0 // first failure might need a retry

    let currentConfig = config;

    return async (req) => {
      const original = ghFetch

      console.debug("ghpages starting fetch:", req.url, buildTime)
      let resp = await ghFetch(req)
      console.debug("ghpages resp status:", resp.status)
      if (resp.status === 404 && config.hostname) {
        // hostname might've been cleared
        const url = new URL(req.url)
        const diff = Date.now() - buildTime
        if (
          (url.pathname === "/" && diff > 10000) // retry after 10s for root
          || diff > 30000) { // wait 5min for everything else
          console.debug("ghpages hostname request got 404:", currentConfig.hostname)
          currentConfig.hostname = undefined
          ghFetch = buildGithubPagesProxy(currentConfig)(fetch)
        }
      }
      if (resp.status === 301 && !config.hostname) {
        // 301s happen when you request <org>.github.io/<repo> and need a custom domain
        let location = resp.headers.get("location")
        if (location) {
          const url = new URL(location)
          currentConfig.hostname = url.hostname
          ghFetch = buildGithubPagesProxy(currentConfig)(fetch)
          console.debug("ghpages found hostname:", currentConfig)
        }
      }
      if (original !== ghFetch) {
        // underlying proxy function changed, store it and retry
        console.debug("ghpages got a new fetch fn")
        resp = await ghFetch(req)
      }
      return resp
    }
  });
}

githubPages.normalizeOptions = normalizeOptions;

function normalizeOptions(input: unknown): GitHubPagesOptions {
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

function buildGithubPagesProxy(options: GitHubPagesOptions) {
  const { owner, repository, hostname } = options
  const ghHost = `${owner}.github.io`
  const headers = {
    host: ghHost,
    "x-forwarded-host": false
  }
  let path = `/${repository}/`

  if (hostname) {
    path = '/' // no repo path when hostname exists
    headers.host = hostname
  }

  console.debug("ghpages creating proxy:", `https://${ghHost}${path}`, {
    headers: headers,
    stripPath: path
  })
  
  return proxy(`https://${ghHost}${path}`, {
    headers: headers,
    stripPath: path
  })
}