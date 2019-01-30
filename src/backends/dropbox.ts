/**
 * @module Backends
 */

import { ProxyFunction } from "../proxy";

/** limit requests to GET and HEAD */
const allowedMethods = ["GET", "HEAD"]

/** const Dropbox path */
const dropboxEndpoint = "https://content.dropboxapi.com/2/files/"

/**
 * Dropbox options
 */
export interface DropboxOptions {
    token: string,
    file: string,
    path?: string,
    hostname?: string
}

/**
 * Creates a POST `fetch` with Dropbox headers
 * ```
 *  {
 *  	"Authorization": `bearer ${options.token}`,
 *  	"Dropbox-API-Arg": options.path
 *  }
 * ```
 * @param options strictly enforced DropboxOptions (no support for strings yet)
 */
export function dropbox(options: DropboxOptions): ProxyFunction<DropboxOptions> {

  const host = `${dropboxEndpoint}download` 
  const token = options.token

  async function proxyFetch(req: RequestInfo, init?: RequestInit): Promise<Response> {

    if (typeof req === "string") req = new Request(req, init)

    if (!allowedMethods.includes(req.method))
      return new Response(`HTTP Method not allowed, only ${allowedMethods.join(", ")} are allowed.`, { status: 405 })

		var config = normalizeOptions(options)
    let bresp = await fetch(host, config)
		
    if (bresp.status === 409) {
      return new Response("File does not exist.", { status: 404 })
    }

    let resOptions = { method: req.method, headers: req.headers, status: 200 }
    let res: Response;
    if (req.method == "GET") {
      res = new Response(bresp.body, resOptions)
    } else {
      // try { bresp.body.cancel() } catch(e) {}
      res = new Response("HEAD request", resOptions)
    }

    return res
  }

  return Object.assign(proxyFetch, { proxyConfig: options })

}


function normalizeOptions(options: DropboxOptions): RequestInit {
	var headers = {
      "Authorization": `Bearer ${options.token}`,
  		"Dropbox-API-Arg": JSON.stringify( { path: options.file } )
   }

	return { 
		method: 'POST',
		headers: headers,
		cache: 'default',
	}
};

dropbox.normalizeOptions = normalizeOptions