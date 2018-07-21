import proxy from "@fly/proxy"

export interface BackendInfo {
  origin: string, // was upstream,
  type?: string,
  headers?: { [name: string]: string | boolean | undefined }
}

export interface Backend {
  (req: RequestInfo, init?: RequestInit): Promise<Response>,
  info: BackendInfo
}

const notImplemented = ["aws_lambda", "aws_s3", "dropbox", "gravatar"]
export default function backend(backend: BackendInfo): Backend {
  //TODO: Implement s3, dropbox, lamdba, etc
  console.log("Proxying:", backend)
  const b = notImplemented.filter((t) => t === backend.type).length == 0 ?
    proxy(backend.origin, { forwardHostHeader: true, headers: backend.headers }) :
    unsupportedBackend(backend.type || "default")
  return Object.assign(b, { info: backend })
}

function unsupportedBackend(type: string) {
  return async function (req: RequestInfo, init?: RequestInit) {
    return new Response("Unsupported backend: " + type)
  }
}