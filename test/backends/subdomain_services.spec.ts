import { expect } from "chai";
import { squarespace, ghostProBlog, glitch, netlify, heroku } from "../../src/backends"
import * as errors from "../../src/errors";
import { normalizeOptions } from "../../src/backends/subdomain_service";

const defs = [
  { backend: ghostProBlog, tests: [
    { subdomain: "fly-io", hostname: 'fly.io', directory: "/articles/" },
    { subdomain: "demo" }
  ]},
  { backend: glitch, options: ["subdomain"], tests: [
    { appName: "fly-example" },
  ]},
  { backend: heroku, tests: [
    { appName: "example" }
  ]},
  { backend: netlify, options: ["subdomain", "directory"], tests: [
    { subdomain: "example" }
  ]},
  { backend: squarespace, tests: [
    { subdomain: "example" }
  ]}
]
for(const d of defs){
  const backend = d.backend as Function;
  describe(`backends/${backend.name}`, function() {
    this.timeout(15000)

    for(const t of d.tests){
      it(`works with settings: ${JSON.stringify(t)}`, async () => {
        const fn = backend(t as any);

        const resp = await fn("https://backend/", { method: "HEAD"})
        expect(resp.status).to.eq(200)
      })
    }
  })
}

describe("backends/subdomainService", () => {
  const validOptions = [
    [
      "subdomain",
      { subdomain: "subdomain", directory: "/" }
    ],
    [
      "subdomain ",
      { subdomain: "subdomain", directory: "/"}
    ],
    [
      { subdomain: "subdomain " },
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
    it(`normalizes ${JSON.stringify(input)}`, () => {
      expect(normalizeOptions(input)).to.eql(config);
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
      expect(() => { normalizeOptions(input) }).throw(err as any);
    })
  }
})
