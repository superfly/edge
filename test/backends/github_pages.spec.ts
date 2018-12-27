import { expect } from 'chai';
import { githubPages } from "../../src/backends"
import * as errors from "../../src/errors";


describe("backends/githubPages", function () {
  this.timeout(15000)

  describe("options", () => {
    const validOptions = [
      [
        "superfly/cdn",
        { owner: "superfly", repository: "cdn" }
      ],
      [
        { owner: "superfly", repository: "cdn" },
        { owner: "superfly", repository: "cdn" }
      ],
      [
        { owner: "superfly", repository: "cdn", hostname: "host.name" },
        { owner: "superfly", repository: "cdn", hostname: "host.name" }
      ],
    ];

    for (const [input, config] of validOptions) {
      it(`accepts ${JSON.stringify(input)}`, () => {
        expect(githubPages(input as any).proxyConfig).to.eql(config);
      })
    }

    const invalidOptions = [
      [undefined, errors.InputError],
      ["", errors.InputError],
      [{}, /owner is required/],
      [{ owner: "", repository: "cdn" }, /owner is required/],
      [{ repository: "cdn" }, /owner is required/],
      [{ owner: "superfly", repository: "" }, /repository is required/],
      [{ owner: "superfly" }, /repository is required/],
    ]

    for (const [input, err] of invalidOptions) {
      it(`rejects ${JSON.stringify(input)}`, () => {
        expect(() => { githubPages(input as any) }).throw(err as any);
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