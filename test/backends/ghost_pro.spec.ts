import { expect } from "chai";
import { ghostProBlog } from "../../src/backends"
import * as errors from "../../src/errors";


describe("backends/ghostPro", function () {
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

    for (const [input, config] of validOptions) {
      it(`accepts ${JSON.stringify(input)}`, () => {
        expect(ghostProBlog(input as any).proxyConfig).to.eql(config);
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
    const fn = ghostProBlog({ subdomain: "demo" });

    const resp = await fn("https://ghostpro/", { method: "HEAD" })
    expect(resp.status).to.eq(200)
  })

  it('works with a custom domain and directory', async () => {
    const fn = ghostProBlog({
      subdomain: "fly-io",
      hostname: "fly.io",
      directory: "/articles/"
    })

    const resp = await fn("https://ghostpro/", { method: "HEAD" })
    expect(resp.status).to.eq(200)
  })
})