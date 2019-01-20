/**
 * @module Backends
 */

import { ProxyFunction } from "../proxy";
// import { fetch } from "@fly/v8env/lib/fetch";

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

  async function proxyFetch() {
		var config = normalizeOptions(options)
    let bresp = await fetch(host, config)
		return bresp
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