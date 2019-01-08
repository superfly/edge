import { expect } from "chai";
import { httpCache } from "../../src/middleware";

function withHeaders(headers:any){
  return async function fetchWithHeaders(..._:any[]){
    const resp = new Response(`response at: ${Date.now()}`)
    for(const k of Object.getOwnPropertyNames(headers)){
      const v = headers[k];
      resp.headers.set(k, v);
    }
    return resp;
  }
}

const noCacheHeaders = [
  ["response", {"vary": "any", "cache-control": "public, max-age=3600"}],
  ["response", {"cache-control": "no-cache"}],
  ["response", {"cache-control": "public, max-age=0"}],
  ["request", { "authorization": "blerp" }],
  ["request", { "cookie": "blerp" }]
]
describe("middleware/httpCache", function() {
  for(const [type, h] of noCacheHeaders){
    it(`doesn't cache ${type} headers: ` + JSON.stringify(h), async () => {
      const responseHeaders = type === "response" ? h : { "cache-control": "public, max-age=3600"};
      const fn = httpCache(
        withHeaders(Object.assign({}, responseHeaders))
      );

      const requestHeaders = type === "request" ? h : {};
      const resp = await fn(`http://anyurl.com/asdf-${Math.random()}`, { headers: requestHeaders});

      expect(resp.status).to.eq(200);
      expect(resp.headers.get("fly-cache")).is.null;
    });
  }

  it("properly sets fly-cache to miss when cache happens", async () => {
    const fn = httpCache(
      withHeaders({
        "cache-control": "public, max-age=3600"
      })
    );
    const resp1 = await fn("http://anyurl.com/cached-url");
    const resp2 = await fn("http://anyurl.com/cached-url");

    expect(resp1.headers.get('fly-cache')).to.eq('miss');
    expect(resp2.headers.get("fly-cache")).to.eq('hit')

    const [body1, body2] = await Promise.all([
      resp1.text(),
      resp2.text()
    ]);

    expect(body1).to.eq(body2);
  })

  it("accepts max-age overrides", async () => {
    const generator = httpCache.configure({ overrideMaxAge: 100})
    const fn = generator(withHeaders({
      "cache-control": "public, max-age=0"
    }))

    const resp1 = await fn("http://anyurl.com/cached-url-max-age");
    const resp2 = await fn("http://anyurl.com/cached-url-max-age");

    expect(resp1.headers.get('fly-cache')).to.eq('miss');
    expect(resp2.headers.get("fly-cache")).to.eq('hit')
  })
//   it("redirects with default options", async ()=>{
//     const fn = httpsUpgrader(echo);
//     const resp = await fn("http://wat/")
//     expect(resp.status).to.eq(302)
//     expect(resp.headers.get("location")).to.eq("https://wat/")
//   })

//   it("redirects with options", async () =>{
//     const fn = httpsUpgrader(echo, {status: 307, text: "hurrdurr"});
//     const resp = await fn("http://wat/")
//     const body = await resp.text()
//     expect(resp.status).to.eq(307)
//     expect(body).to.eq("hurrdurr")
//     expect(resp.headers.get("location")).to.eq("https://wat/") 
//   })

//   it("skips redirect in dev mode", async () => {
//     app.env = "development"
//     const fn = httpsUpgrader(echo);
//     const resp = await fn("http://wat/")
//     expect(resp.status).to.eq(200)
//     expect(resp.headers.get("location")).to.be.null
//     app.env = "test"
//   })
})