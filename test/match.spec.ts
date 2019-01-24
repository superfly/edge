import { expect } from "chai"

import { match, mount } from "../src"
import { requestModifier } from "../src/middleware/builder";

const twoHundred = async () => new Response("twoHundred", { status: 200 } )
const passThru = requestModifier((req: Request) => req.headers.set("pass-thru", new Date().toString()))

describe("match", () => {
  it("should accept a FetchFunction", async () => {
    const fn = match(twoHundred)(fetch)

    const resp = await fn("http://wat")
    expect(resp.status).to.eq(200)

    const body = await resp.text()
    expect(body).to.eq("twoHundred")
  })
})