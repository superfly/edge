import { expect } from 'chai';
import { githubPages } from "../src/backends"

describe("backends", () => {
  describe("githubPages", function() {
    this.timeout(15000)

    it("works with plain repos", async ()=>{
      const fn = githubPages("superfly/cdn");
      const ghFetch = fn.githubFetch
      
      const resp = await fn("https://fly.io/", { method: "HEAD"})
      expect(resp.status).to.eq(200)
      expect(fn.githubFetch).to.eq(ghFetch, "ghFetch function changed when it shouldn't have")
    })

    it("detects a custom domain and retries", async ()=>{
      const fn = githubPages("superfly/landing")
      const ghFetch = fn.githubFetch
      expect(ghFetch.hostname).to.be.undefined

      const resp = await fn("https://fly.io/", { method: "HEAD"})
      expect(resp.status).to.eq(200)
      expect(fn.githubFetch.hostname).to.eq("preview.fly.io")
    })

    it("detects custom domain removal and retries", async ()=>{
      const fn = githubPages({
        owner:"superfly",
        repository:"cdn",
        hostname: "docs.fly.io"
      })
      const ghFetch = fn.githubFetch
      expect(ghFetch.hostname).to.eq("docs.fly.io")

      const resp = await fn("https://fly.io/", { method: "HEAD"})
      expect(resp.status).to.eq(200)
      expect(fn.githubFetch.hostname).to.be.undefined
    })
  })
})