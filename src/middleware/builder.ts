/**
 * @module Middleware
 */
import { FetchFunction, FetchGeneratorWithOptions, FetchGenerator } from "../fetch";

export type ResponseModifierResult = Promise<undefined | void | Response> | undefined | void | Response
/**
 * A convenience function for building middleware that only operates on a request.
 * @param fn 
 */
export function requestModifier<J>(fn: (req: Request, options: J) => ResponseModifierResult): FetchGeneratorWithOptions<J>
/**
 * A convenience function for building middleware that only operates on a response.
 * @param fn 
 */
export function requestModifier(fn: (req: Request, ...args: any[]) => ResponseModifierResult): FetchGenerator
{
  return function(fetch: FetchFunction, ...args: any[]){
    return async function(req: RequestInfo, init?: RequestInit){
      if(typeof req === "string"){
        req = new Request(req, init)
        init = undefined
      }
      let resp = fn(req, ...args)
      if(resp instanceof Promise){
        resp = await resp
      }
      if(resp){
        return resp
      }
      return fetch(req, init)
    }
  }
}

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