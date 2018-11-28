import { expect } from 'chai';
import { githubPages } from "../src/backends"

describe("githubPages", function() {
  this.timeout(15000)
  it("detects a custom domain and retries", async ()=>{
    const fn = githubPages("superfly/landing")
    const ghFetch = fn.githubFetch
    expect(ghFetch.hostname).to.be.undefined

    const resp = await fn("https://fly.io/", { method: "HEAD"})
    expect(resp.status).to.eq(200)
    expect(fn.githubFetch.hostname).to.eq("preview.fly.io")
  })

  it("works with plain repos", async ()=>{
    
  })
})