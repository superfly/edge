/**
 * Functions for proxying requests to various backends.
 * @module Backends
 * @primary
 * */

import { proxy } from "./proxy";
import balancer from "@fly/load-balancer"
import { FetchFunction } from "src";
import { githubPages, isGithubPages } from "./backends/github_pages";

export { githubPages } from "./backends/github_pages"
export { ghostProBlog } from "./backends/ghost_pro"

/**
 * Proxy options for generic http/https backends
 * @ignore
 * See {@link Backends/backend}
 */
export interface BackendInfo {
  origin?: string | string[], // was upstream,
  type?: string,
  headers?: { [name: string]: string | boolean | undefined }
}

/**
 * A `fetch` function generated with `BackendInfo.
 * @ignore
 */
export interface Backend extends FetchFunction{
  /** The config used to generate this function */
  info: BackendInfo
}

/** @ignore */
export type BackendMap = Map<String, Backend>

const notImplemented = ["aws_lambda", "aws_s3", "dropbox", "gravatar"]

/**
 * Create a generic http/https proxy backend
 * @param backend Proxy configuration options
 * @ignore
 */
export default function backend(backend: BackendInfo): Backend {
  //TODO: Implement s3, dropbox, lamdba, etc
  console.log("Proxying:", backend)

  if (backend.type === "origin") {
    return Object.assign(originFetch(backend), { info: backend });
  }
  
  if (backend.type === "github_pages" && isGithubPages(backend)) {
    return Object.assign(githubPages(backend), { info: backend });
  }

  return Object.assign(unsupportedBackend(backend.type || "none"), { info: backend });
}

function originFetch(backend: BackendInfo){
  if(typeof backend.origin === "string"){
    return proxy(backend.origin, { forwardHostHeader: true, headers: backend.headers })
  }
  if(backend.origin instanceof Array){
    const backends = backend.origin.map((o) =>{
      return proxy(o, { forwardHostHeader: true, headers: backend.headers })
    })
    return balancer(backends)
  }
}

function unsupportedBackend(type: string) {
  return async function (req: RequestInfo, init?: RequestInit) {
    return new Response("Unsupported backend: " + type)
  }
}