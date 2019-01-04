/**
 * @module Backends
 */
/**
 * A useful fetch-like function for debugging. Echos request information
 * as a JSON response.
 * @param req The request to echo
 * @param init Request init information
 */
export async function echo(req: RequestInfo, init?: RequestInit){
  if(typeof req === "string"){
    req = new Request(req, init)
    init = undefined
  }

  const body = {
    method: req.method,
    url: req.url,
    remoteAddr: (req as any).remoteAddr,
    headers: (req.headers as any).toJSON()
  }

  return new Response(JSON.stringify(body, null, "\t"), { headers: {"content-type": "application/json"}});
}