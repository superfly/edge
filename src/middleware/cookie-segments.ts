import { FetchFunction } from "../fetch";

/**
 * Assign users segments of 1-100
 * Usage:
 * routeSegments(
 *  "gcp-test", // name
 *  { weight: "20%", origin: origins.gcp },
 *  { weight: "80%", origin: origins.aws}
 * )
 */

export interface Segment{
  weight: number | string,
  id: string,
  origin: FetchFunction
}

export function routeSegments(cookieName: string, ...segments: Segment[]){
  validateSegments(cookieName, segments)
  return async function fetchSegment(req: RequestInfo, init?: RequestInit): Promise<Response>{
    if(typeof req === "string"){
      req = new Request(req, init)
    }
    const segment = selectSegment(req, cookieName, segments)

    if(segment){
      req.headers.set("Fly-Segment", segment.id)
      return segment.origin(req, init)
    }

    return new Response("Segment out of range", { status: 500 })
  }
}

function selectSegment(req: Request, cookieName: string, segments: Segment[]){
  const rand = Math.ceil(Math.random() * 100)
  const cookieValue = req.cookies.get(cookieName)
  let s: Segment | undefined
  if(cookieValue){
    s = segments.find((s) => s.id === cookieValue)
  }
  if(!s){
    s = segments.find((s) => getWeight(s) > rand)
  }
  if(!s) return

  return s
}

function validateSegments(cookieName: string, defs: Segment[]){
  const segments = defs
  const ids = new Set<string>()
  for(const i in defs){
    const s = defs[i]
    const weight = getWeight(s)
    if(ids.has(s.id)){
      throw new Error(`Segment ids must be unique: ${cookieName}/${s.id}`)
    }
    segments[i] = { id: s.id, weight: weight, origin: s.origin}
  }
  const total = segments.map(getWeight).reduce((a,b) => a + b, 0)
  if(total !== 100){
    throw new Error(`Segment weights must add up to exactly 100: ${cookieName}`)
  }
  return segments
}

function getWeight(s: Segment){
  if(typeof s.weight === "string" && s.weight.match(/^\d+%$/)){
    s.weight = parseInt(s.weight)
  }
  if(s.weight === undefined){
    return s.weight
  }
  if(typeof s.weight !== "number"){
    throw "weight must be a number or percent string"
  }

  return s.weight;
}