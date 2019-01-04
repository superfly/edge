import { expect } from "chai";
import { ghostProBlog, glitch } from "../../src/backends"
import * as errors from "../../src/errors";

const defs = [
  { backend: ghostProBlog, subdomain: "fly-io" },
  { backend: glitch, subdomain: "fly-example", options: ["subdomain"] }
]
for(const d of defs){
  const backend = d.backend
  describe(`backends/${backend.name}`, function() {
    this.timeout(15000)

    describe("options", () => {
      const validOptions = [
        [
          "subdomain",
          { subdomain: "subdomain", directory: "/" }
        ],
        [
          { subdomain: "subdomain" },
          { subdomain: "subdomain", directory: "/" }
        ],
        [
          { subdomain: "subdomain", hostname: "host.name" },
          { subdomain: "subdomain", directory: "/", hostname: "host.name" }
        ],
        [
          { subdomain: "subdomain", directory: "/" },
          { subdomain: "subdomain", directory: "/" }
        ]
      ];

      for (const [input, c] of validOptions) {
        const config:any = Object.assign({}, c)
        console.log("checking:", input, config)
        it(`accepts ${JSON.stringify(input)}`, () => {
          if(d.options){
            for(const k of Object.getOwnPropertyNames(config)){
              if(!d.options.includes(k)){
                console.log("deleting key:", k)
                delete config[k]
              }
            }
          }
          expect(backend(input as any).proxyConfig).to.eql(config);
        })
      }

      const invalidOptions = [
        [undefined, errors.InputError],
        ["", /subdomain is required/],
        [{}, /subdomain is required/],
        [{ subdomain: "" }, /subdomain is required/],
      ];

      for (const [input, err] of invalidOptions) {
        it(`rejects ${JSON.stringify(input)}`, () => {
          expect(() => { ghostProBlog(input as any) }).throw(err as any);
        })
      }
    })

    it('works with just a subdomain', async () => {
      const fn = backend({ subdomain: "demo" });

      const resp = await fn("https://backend/", { method: "HEAD"})
      expect(resp.status).to.eq(200)
    })

    it('works with a custom domain and directory', async () =>{
      const fn = backend(<any>{
        subdomain: d.subdomain,
        hostname: "fly.io",
        directory: "/articles/"
      })

      const resp = await fn("https://backend/", { method: "HEAD"})
      expect(resp.status).to.eq(200)
    })
  })
}