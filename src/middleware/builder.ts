import { FetchFunction, FetchGeneratorWithOptions, FetchGenerator } from "../fetch";

/**
 * A convenience function for building middleware that only operates on a response.
 * @param fn 
 */
export function responseModifier<J>(fn: (resp: Response, options: J) => Promise<Response> | Response): FetchGeneratorWithOptions<J>
/**
 * A convenience function for building middleware that only operates on a response.
 * @param fn 
 */
export function responseModifier(fn: (resp: Response, ...args: any[]) => Promise<Response> | Response): FetchGenerator
{
  return function(fetch: FetchFunction, ...args: any[]){
    return async function(req: RequestInfo, init?: RequestInit){
      const resp = await fetch(req, init)
      if(typeof req === "string"){
        req = new Request(req, init)
        init = undefined
      }

      return fn(resp, ...args)
    }
  }
}