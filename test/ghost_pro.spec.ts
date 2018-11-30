import { expect } from "chai";
import { ghostProBlog } from "../src/backends"

describe("backends", () => {
  describe("ghostPro", function() {
    this.timeout(15000)
    it('generated config from subdomain only', () => {
      const fn = ghostProBlog("demo")
      expect(fn.proxyConfig.subdomain).to.eq("demo")
      expect(fn.proxyConfig.directory).to.eq("/")
      expect(fn.proxyConfig.hostname).to.be.undefined
    })

    it('works with just a subdomain', async () =>{
      const fn = ghostProBlog("demo")

      const resp = await fn("https://ghostpro/", { method: "HEAD"})
      expect(resp.status).to.eq(200)
    })

    it('works with a custom domain and directory', async () =>{
      const fn = ghostProBlog({
        subdomain: "fly-io",
        hostname: "fly.io",
        directory: "/articles/"
      })

      const resp = await fn("https://ghostpro/", { method: "HEAD"})
      expect(resp.status).to.eq(200)
    })
  })
})