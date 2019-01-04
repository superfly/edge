import { expect } from "chai"

import { pipeline, FetchFunction } from "../src"

function outer(fetch: FetchFunction) {
  return async function outerFetch(req: RequestInfo, init?: RequestInit) {
    (req as any).headers.set("Outer-Fn", "woop!")
    return fetch(req, init)
  }
}

function inner(fetch: FetchFunction) {
  return async function innerFetch(req: RequestInfo, init?: RequestInit) {
    (req as any).headers.set("Inner-Fn", "woowoo!")
    return fetch(req, init)
  }
}

async function echo(req: RequestInfo, init?: RequestInit) {
  const headers: any = Object.assign(
    {
      stages: JSON.stringify(
        fn.stages.map(s => {
          if (typeof s === "function") {
            return s.name
          }
          return typeof s
        })
      )
    },
    (req as any).headers.toJSON()
  )
  return new Response("hi", { headers: headers })
}

const p = pipeline(outer, inner)
const fn = p(echo)

describe("pipeline", () => {
  it("should make stages available", () => {
    expect(p.stages).to.exist
    expect(p.stages.length).to.eq(2)
    expect(p.stages[0]).to.eq(outer)
    expect(p.stages[1]).to.eq(inner)
  })

  it("should make stages available after fetch is generated", () => {
    expect(fn.stages).to.exist
    expect(fn.stages.length).to.eq(2)
    expect(fn.stages[0]).to.eq(outer)
    expect(fn.stages[1]).to.eq(inner)
  })

  it("should run pipeline functions", async () => {
    const resp = await fn(new Request("http://localhost"))
    expect(resp.headers.get("Outer-Fn")).to.eq("woop!")
    expect(resp.headers.get("Inner-Fn")).to.eq("woowoo!")
    expect(resp.headers.get("stages")).to.eq('["outer","inner"]')
  })
})
