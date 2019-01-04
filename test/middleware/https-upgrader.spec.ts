import { expect } from "chai";
import { httpsUpgrader } from "../../src/middleware";
import { echo } from "../../src/backends";


describe("middleware/httpsUpgrader", function() {
  it("redirects with default options", async ()=>{
    const fn = httpsUpgrader(echo);
    const resp = await fn("http://wat/")
    expect(resp.status).to.eq(302)
    expect(resp.headers.get("location")).to.eq("https://wat/")
  })

  it("redirects with options", async () =>{
    const fn = httpsUpgrader(echo, {status: 307, text: "hurrdurr"});
    const resp = await fn("http://wat/")
    const body = await resp.text()
    expect(resp.status).to.eq(307)
    expect(body).to.eq("hurrdurr")
    expect(resp.headers.get("location")).to.eq("https://wat/") 
  })

  it("skips redirect in dev mode", async () => {
    app.env = "development"
    const fn = httpsUpgrader(echo);
    const resp = await fn("http://wat/")
    expect(resp.status).to.eq(200)
    expect(resp.headers.get("location")).to.be.null
    app.env = "test"
  })
})