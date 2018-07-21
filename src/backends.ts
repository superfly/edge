import proxy from "@fly/proxy"

export interface BackendInfo {
  origin: string, // was upstream,
  headers?: { [name: string]: string | boolean | undefined }
}

export interface Backend {
  (req: RequestInfo, init?: RequestInit): Promise<Response>,
  backend: BackendInfo
}

export default function backend(backend: BackendInfo): Backend {
  //TODO: Implement s3, dropbox, lamdba, etc
  console.log("Proxying:", backend)
  const b = proxy(backend.origin, { forwardHostHeader: true, headers: backend.headers })
  return Object.assign(b, { backend: backend })
}