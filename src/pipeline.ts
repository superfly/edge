/**
 * A library for composing `fetch` generators into a single pipeline.
 *
 * @preferred
 * @module HTTP
 */

import { FetchGenerator, FetchFunction, isFetchGenerator } from "./fetch"

export interface PipelineFetch extends FetchFunction{
  stages: PipelineStage[]
}

export interface PipelineFetchGenerator extends FetchGenerator{
  stages: PipelineStage[]
}

/**
 * PipeplineStage can either be a FetchGenerator function, or a tuple of
 * FetchGenerator + args.
 */
export type PipelineStage = FetchFunction | FetchGenerator

/**
 * Combine multiple fetches into a single function. Allows middleware type functionality
 *
 * Example:
 *
 * ```javascript
 * import { httpsUpgrader, httpCache } from "@fly/cdn";
 * import { echo } from "@fly/cdn/backends/echo";
 *
 * const p = pipeline(
 *   httpsUpgrader,
 *   httpCache,
 *   echo
 * )
 *
 * fly.http.respondWith(p)
 *```
 * 
 * @param stages fetch generator functions that apply additional logic
 * @returns a combined that can be used anywhere that wants `fetch`
 */
export function pipeline(...stages: PipelineStage[]): PipelineFetch {
  const fetchIndex = stages.findIndex((s) => !isFetchGenerator(s) && typeof s === "function");
  let fetch : FetchFunction | undefined
  if(fetchIndex >= 0){
    fetch = stages[fetchIndex] as FetchFunction;
  }
  if(!fetch){
    fetch = () => Promise.resolve(new Response("not found", { status: 404}))
  }
  for (let i = stages.length - 1; i >= 0; i--) {
    const fn = stages[i]
    if(isFetchGenerator(fn)){
      fetch = fn(fetch)
    }else{
      // can't proceed past a Fetch function
      break;
    }
  }
  return Object.assign(fetch, { stages })
}

export default pipeline
