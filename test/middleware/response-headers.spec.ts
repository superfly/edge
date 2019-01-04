import { expect } from "chai";
import { responseHeaders } from "../../src/middleware";
import { echo } from "../../src/backends";


describe("middleware/responseHeaders", function() {
  it("works as middleware", async ()=>{
    const fn = responseHeaders(echo, { "Powered-By": "Caffeine" });
    const resp = await fn("http://wat/")
    expect(resp.headers.get("powered-by")).to.eq("Caffeine")
  })
})