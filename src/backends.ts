/**
 * Functions for proxying requests to various backends.
 * @module Backends
 * @primary
 * */

import proxy from "@fly/fetch/proxy"
import balancer from "@fly/load-balancer"
import { FetchFunction } from "src";

export { githubPages } from "./backends/github_pages"
export { ghostProBlog } from "./backends/ghost_pro"

/**
 * Proxy options for generic http/https backends
 * See {@link Backends/backend}
 */
export interface BackendInfo {
  origin: string | string[], // was upstream,
  type?: string,
  headers?: { [name: string]: string | boolean | undefined }
}

/**
 * A `fetch` function generated with `BackendInfo.
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
 */
export default function backend(backend: BackendInfo): Backend {
  //TODO: Implement s3, dropbox, lamdba, etc
  console.log("Proxying:", backend)
  const b = notImplemented.filter((t) => t === backend.type).length == 0 ?
    originFetch(backend) :
    unsupportedBackend(backend.type || "default")
  return Object.assign(b, { info: backend })
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