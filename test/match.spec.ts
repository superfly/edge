import { expect } from "chai"

import { match, mount } from "../src"

const twoHundred = async () => new Response("twoHundred", { status: 200 })
const twoOhOne = async () => new Response("twoOhOne", { status: 201 })
const fourOhFour = async () => new Response("fourOhFour", { status: 404})

const routes = match(
  mount("/directory", twoHundred),
  mount("/path/", twoOhOne),
  fourOhFour
)(fetch);

describe("match", () => {
  it("should accept a FetchFunction", async () => {
    const fn = match(twoHundred)(fetch)

    const resp = await fn("http://wat")
    expect(resp.status).to.eq(200)

    const body = await resp.text()
    expect(body).to.eq("twoHundred")
  })

  describe("mount: /directory", () => {
    it("matches: /directory", async () =>{
      const resp = await routes("http://hello/directory")
      expect(resp.status).to.eq(200)

      const body = await resp.text()
      expect(body).to.eq("twoHundred")
    })
    it("matches: /directory/sub", async () => {
      const resp = await routes("http://hello/directory/sub")
      expect(resp.status).to.eq(200)

      const body = await resp.text()
      expect(body).to.eq("twoHundred")
    })
    it("ignores: /directory-other", async () => {
      const resp = await routes("http://hello/directory-other")
      expect(resp.status).to.eq(404)
    })
    it("ignores: /", async () => {
      const resp = await routes("http://hello/")
      expect(resp.status).to.eq(404)
    })
  })
  describe("mount: /path/", () => {
    it("matches: /path/", async () => {
      const resp = await routes("http://hello/path/")
      expect(resp.status).to.eq(201)
    })

    it("matches: /path/sub", async () => {
      const resp = await routes("http://hello/path/sub")
      expect(resp.status).to.eq(201)
    })
    
    it("ignores: /path", async () =>{
      const resp = await routes("http://hello/path")
      expect(resp.status).to.eq(404)
    })
  })
})