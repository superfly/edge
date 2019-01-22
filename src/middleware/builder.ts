/**
 * @module Middleware
 */
import { FetchFunction, FetchGenerator } from "../fetch";

export type RequestModifierResult = Promise<undefined | void | Response> | undefined | void | Response

/**
 * A convenience function for building middleware that only operates on a response.
 * @param fn 
 */
export function requestModifier<T>(fn: (req: Request, options?: T) => RequestModifierResult)
{
  function generator(fetch: FetchFunction, options?: T){
    return async function(req: RequestInfo, init?: RequestInit){
      if(typeof req === "string"){
        req = new Request(req, init)
        init = undefined
      }
      let resp = fn(req, options);
      if(resp instanceof Promise){
        resp = await resp
      }
      if(resp){
        return resp
      }
      return fetch(req, init)
    }
  }

  generator.configure = function(options: T): FetchGenerator{
    return FetchGenerator.build(function(fetch: FetchFunction){
        return generator(fetch, options)
      }, fn.name);
  }

  return FetchGenerator.build(generator, fn.name);
}

/**
 * A convenience function for building middleware that only operates on a response.
 * @param fn 
 */
export function responseModifier(fn: (resp: Response, ...args: any[]) => Promise<Response> | Response): FetchGenerator
{
  const generator = function(fetch: FetchFunction, ...args: any[]){
    return async function(req: RequestInfo, init?: RequestInit){
      const resp = await fetch(req, init)
      if(typeof req === "string"){
        req = new Request(req, init)
        init = undefined
      }

      return fn(resp, ...args)
    }
  };

  return FetchGenerator.build(generator, fn.name);
}