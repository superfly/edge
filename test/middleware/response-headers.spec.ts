import { expect } from "chai";
import { responseHeaders } from "../../src/middleware";
import { echo } from "../../src/backends";


describe("middleware/responseHeaders", function() {
  it("sets a header with a string value", async ()=>{
    const fn = responseHeaders(echo, { "Powered-By": "Caffeine" });
    const resp = await fn("http://wat/")
    expect(resp.headers.get("powered-by")).to.eq("Caffeine")
  })
  it("removes a header with a `false` value", async ()=>{
    const fn = responseHeaders(echo, { "content-type": false });
    const resp = await fn("http://wat/")
    expect(resp.headers.get("content-type")).to.be.null
  })
  it("ignores a header setting with a `true` value", async ()=>{
    const fn = responseHeaders(echo, <any>{ "content-type": true });
    const resp = await fn("http://wat/")
    expect(resp.headers.get("content-type")).to.eq("application/json")
  })
})