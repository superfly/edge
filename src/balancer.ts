import { FetchFunction } from "./fetch";

/**
 * A fetch function load balancer. Distributes requests to a set of backends; attempts to 
 * send requests to most recently healthy backends using a 2 random (pick two healthiest, 
 * randomize which gets requests).
 * 
 * If all backends are healthy, tries to evenly distribute requests as much as possible.
 * 
 * When backends return server errors (500-599) it retries idempotent requests
 *  until it gets a good response, or all backends have been tried.
 * 
 * @param backends fetch functions for each backend to balance accross
 * @returns a function that behaves just like fetch, with a `.backends` property for 
 * retrieving backend stats.
 */
export default function balancer(backends: FetchFunction[]) {
  const tracked = backends.map((h) => {
    if (typeof h !== "function") {
      throw Error("Backend must be a fetch like function")
    }
    // To track these per region, use the cache
    // const statsRaw = await cache.getString(`backend:${id}`)
    // const backend: Backend  = JSON.parse(statsRaw)
    return <Backend>{
      proxy: h,
      requestCount: 0,
      scoredRequestCount: 0,
      statuses: Array<number>(10),
      latencies: Array<number>(10),
      lastError: 0,
      healthScore: 1,
      latencyScore: 1,
      errorCount: 0
    }
  })

  const fn = async function fetchBalancer(req: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
    if (typeof req === "string") {
      req = new Request(req)
    }
    const url = new URL(req.url)
    let trackLatency = url.pathname === "/" // this would be configurable in real life
    const attempted = new Set<Backend>()
    while (attempted.size < tracked.length) {
      let backend: Backend | null = null
      const [backendA, backendB] = chooseBackends(tracked, attempted)

      if (!backendA) {
        return new Response("No backend available", { status: 502 })
      }
      if (!backendB) {
        backend = backendA
      } else {
        // randomize between 2 good candidates
        backend = (Math.floor(Math.random() * 2) == 0) ? backendA : backendB
      }

      const promise = backend.proxy(req, init)
      if (backend.scoredRequestCount != backend.requestCount) {
        // fixup score
        // this should be relatively concurrent with the fetch promise
        scoreHealth(backend)
      }
      backend.requestCount += 1
      attempted.add(backend)

      const start = Date.now()
      let resp: Response
      try {
        resp = await promise
      } catch (e) {
        resp = proxyError
        trackLatency = false
      }
      setFixedArrayValue(backend.statuses, resp.status, 10, backend.requestCount)

      if(trackLatency){
        const ms = Date.now() - start
        setFixedArrayValue(backend.latencies, ms, 10, backend.requestCount)
        scoreLatency(backend)
      }

      // save backend stats every 3s
      /*if(!backend.lastSaved || (Date.now() - backend.lastSaved) > 3000){

      }*/

      if (resp.status >= 500 && resp.status < 600) {
        backend.lastError = Date.now()
        // always recompute score on errors
        scoreHealth(backend)

        // clear out response to trigger retry
        if (canRetry(req, resp)) {
          continue
        }
      }

      return resp
    }

    return proxyError
  }

  return Object.assign(fn, { backends: tracked })
}
const proxyError = new Response("couldn't connect to origin", { status: 502 })

/**
 * Represents a backend with health and statistics.
 */
export interface Backend {
  proxy: (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>,
  requestCount: 0,
  scoredRequestCount: 0,
  statuses: number[],
  latencies: number[],
  lastError: number,
  healthScore: number,
  latencyScore: number,
  errorCount: 0,
  lastSaved?: number
}
// compute a backend health score with time + status codes
function scoreHealth(backend: Backend, errorBasis?: number) {
  if (typeof errorBasis !== "number" && !errorBasis) errorBasis = Date.now()

  const timeSinceError = (errorBasis - backend.lastError)
  const statuses = backend.statuses
  const timeWeight = (backend.lastError === 0 && 0) ||
    ((timeSinceError < 1000) && 1) ||
    ((timeSinceError < 3000) && 0.8) ||
    ((timeSinceError < 5000) && 0.3) ||
    ((timeSinceError < 10000) && 0.1) ||
    0;
  if (statuses.length == 0) return 0
  let requests = 0
  let errors = 0
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i]
    if (status && !isNaN(status)) {
      requests += 1
      if (status >= 500 && status < 600) {
        errors += 1
      }
    }
  }
  const healthScore = (1 - (timeWeight * (errors / requests)))
  backend.healthScore = healthScore
  backend.scoredRequestCount = backend.requestCount
  return healthScore
}
function scoreLatency(backend: Backend){
  let total = 0
  for(const l of backend.latencies){
    total += l
  }
  const avgLatency = total / backend.latencies.length

  backend.latencyScore = orderOfMagnitude(avgLatency)
  return backend.latencyScore
}
function canRetry(req: Request, resp: Response) {
  if (resp && resp.status < 500) return false // don't retry normal boring errors or success
  if (req.method == "GET" || req.method == "HEAD") return true
  return false
}

function chooseBackends(backends: Backend[], attempted?: Set<Backend>) {
  let b1: Backend | undefined
  let b2: Backend | undefined
  for (let i = 0; i < backends.length; i++) {
    const b = backends[i]
    if (attempted && attempted.has(b)) continue;

    if (!b1) {
      b1 = b
      continue
    }
    if (!b2) {
      b2 = b
      continue
    }

    const old1 = b1
    b1 = bestBackend(b, b1)

    if (old1 != b1) {
      // b1 got replaced, make sure it's not better
      b2 = bestBackend(old1, b2)
    } else {
      b2 = bestBackend(b, b2)
    }
  }

  // if two best backends have different latency, use only the fastest one
  if(b1 && b2 && b1.latencyScore < b2.latencyScore) return [b1]
  if(b1 && b2 && b2.latencyScore < b1.latencyScore) return [b2]
  
  return [b1, b2]
}

function bestBackend(b1: Backend, b2: Backend) {
  // simple health check before we compare latency
  if(b1.healthScore < 0.85 && b2.healthScore > 0.85){
    return b2
  }
  if(b2.healthScore < 0.85 && b1.healthScore > 0.85){
    return b1
  }
  if (
    b1.latencyScore < b2.latencyScore ||
    (b1.latencyScore == b2.latencyScore && b1.requestCount < b2.requestCount)
  ) {
    return b1
  }
  return b2
}

function setFixedArrayValue<T>(arr: T[], value: T, maxLength: number, totalCount: number){
  if(arr.length < maxLength){
    arr.push(value)
  }else{
    arr[(totalCount- 1) % arr.length] = value
  }
}

function orderOfMagnitude(value: number){
  //https://stackoverflow.com/questions/23917074/javascript-flooring-number-to-order-of-magnitude
  const order = Math.floor(Math.log(value) / Math.LN10)
  return Math.pow(10, order)
}

/** @private */
export const _internal = {
  chooseBackends,
  scoreHealth,
  scoreLatency
}