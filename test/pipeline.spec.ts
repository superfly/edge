import { expect } from "chai"

import { pipeline, FetchGenerator } from "../src"
import { requestModifier } from "../src/middleware/builder";

const outer = requestModifier(function outer(req: Request) {
  req.headers.set("Outer-Fn", "woop!");
});

const inner = requestModifier(function inner(req: Request) {
  req.headers.set("Inner-Fn", "woowoo!");
});

async function echo(req: RequestInfo) {
  const headers: any = Object.assign(
    {
      stages: JSON.stringify(
        fn.stages.map(s => {
          if (typeof s === "function") {
            console.log("generator:", s.name)
            return (s as any)[FetchGenerator.symbol]
          }
          return typeof s
        })
      )
    },
    (req as any).headers.toJSON()
  )
  return new Response("hi", { headers: headers })
}

const fn = pipeline(outer, inner, echo);

describe("pipeline", () => {
  it("should make stages available", () => {
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
