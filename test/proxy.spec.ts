import { expect } from "chai"

import * as proxy from "../src/proxy"

const origin = "https://fly.io/proxy/"
const req = new Request("https://wat.com/path/to/thing", { headers: { host: "notwat.com" } })
describe("proxy", () => {
  it("includes host header and base path properly", () => {
    const breq = proxy.buildProxyRequest(origin, {}, req)
    const url = new URL(breq.url)
    expect(breq.headers.get("host")).to.eq("fly.io")
    expect(breq.headers.get("x-forwarded-host")).to.eq("notwat.com")
    expect(url.pathname).to.eq("/proxy/path/to/thing")
  })

  it("includes host header from request when forwardHostHeader", () => {
    const breq = proxy.buildProxyRequest(origin, { forwardHostHeader: true }, req)
    const url = new URL(breq.url)
    expect(breq.headers.get("host")).to.eq("notwat.com")
    expect(breq.headers.get("x-forwarded-host")).to.eq("notwat.com")
    expect(url.pathname).to.eq("/proxy/path/to/thing")
  })

  it("rewrites paths properly", () => {
    const breq = proxy.buildProxyRequest(origin, { stripPath: "/path/to/" }, req)
    const url = new URL(breq.url)
    expect(url.pathname).to.eq("/proxy/thing")
  })

  describe("location header", () =>{
    it("rewrites location when path stripped", () => {
      const url = "http://test.com/blog/asdf"
      const burl = "http://origin.com/asdf"
      let resp = new Response("hi", { headers: { location: "/wakka"}})

      resp = proxy.rewriteLocationHeader(url, burl, resp)

      expect(resp.headers.get("location")).to.eq("http://test.com/blog/wakka")
    })

    it("rewrites location when path prefixed", () => {
      const url = "http://test.com/asdf"
      const burl = "http://origin.com/blog/asdf"

      let resp = new Response("hi", { headers: { location: "/blog/wakka"}})

      resp = proxy.rewriteLocationHeader(url, burl, resp)

      expect(resp.headers.get("location")).to.eq("http://test.com/wakka")
    })

    it("leaves unrelated header alone", () =>{
      const url = "http://test.com/blog/asdf"
      const burl = "http://origin.com/asdf"

      let resp = new Response("hi", { headers: { location: "http://another.com/wakka"}})

      resp = proxy.rewriteLocationHeader(url, burl, resp)

      expect(resp.headers.get("location")).to.eq("http://another.com/wakka")
    })
  })
})
