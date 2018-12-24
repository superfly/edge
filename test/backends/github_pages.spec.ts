import { expect } from 'chai';
import { githubPages } from "../../src/backends"


describe("backends/githubPages", function() {
  this.timeout(15000)

  describe("factory", () => {
    it("accepts a owner/repo string", () => {
      const fn = githubPages("superfly/cdn");
      expect(fn.proxyConfig.owner).equal("superfly");
      expect(fn.proxyConfig.repository).equal("cdn");
      expect(fn.proxyConfig.hostname).to.be.undefined;
    })

    it("accepts an object", () => {
      const fn = githubPages({ owner: "superfly", repository: "cdn" });
      expect(fn.proxyConfig.owner).equal("superfly");
      expect(fn.proxyConfig.repository).equal("cdn");
      expect(fn.proxyConfig.hostname).to.be.undefined;
    })

    const testCases = [
      ["invalid-repo", /repository/]
    ]

    for (const [input, err] of testCases) {
      it(`rejects invalid input: ${input}`, () => {
        const x = () => { githubPages(input as any) };
        expect(x).throws(err);
      })
    }
  })

  describe("fetch", () => {
    it("works with plain repos", async () => {
      const fn = githubPages("superfly/cdn");
      const config = fn.proxyConfig;

      const resp = await fn("https://fly.io/", { method: "HEAD" })
      expect(resp.status).to.eq(200)
      expect(fn.proxyConfig).to.eq(config, "ghFetch function changed when it shouldn't have")
    })

    it("detects a custom domain and retries", async () => {
      const fn = githubPages("superfly/landing")
      const config = fn.proxyConfig;
      expect(config.hostname).to.be.undefined

      const resp = await fn("https://fly.io/", { method: "HEAD" })
      expect(resp.status).to.eq(200)
      expect(fn.proxyConfig.hostname).to.eq("preview.fly.io")
    })

    it("detects custom domain removal and retries", async () => {
      const fn = githubPages({
        owner: "superfly",
        repository: "cdn",
        hostname: "docs.fly.io"
      })
      const config = fn.proxyConfig
      expect(config.hostname).to.eq("docs.fly.io")

      const resp = await fn("https://fly.io/", { method: "HEAD" })
      expect(resp.status).to.eq(200)
      expect(fn.proxyConfig.hostname).to.be.undefined
    })
  })
})