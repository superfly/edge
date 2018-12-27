import { expect } from "chai";
import { origin } from "../../src/backends"
import * as errors from "../../src/errors";


describe("backends/origin", function () {
  this.timeout(15000)

  describe("options", () => {
    const validOptions = [
      [
        "https://fly.io",
        { origin: "https://fly.io" }
      ],
      [
        new URL("https://fly.io"),
        { origin: new URL("https://fly.io") }
      ],
      [
        { origin: "https://fly.io" },
        { origin: "https://fly.io" },
      ]
    ];

    for (const [input, config] of validOptions) {
      it(`accepts ${JSON.stringify(input)}`, () => {
        expect(origin(input as any).proxyConfig).to.eql(config);
      })
    }

    const invalidOptions = [
      [undefined, errors.InputError],
      ["", /origin is required/],
      // URL in fly doesn't follow spec right now so these are valid :(
      // ["not-a-url", /origin must be a valid url/],
      // ["google.com/missing-schema", /origin must be a valid url/],
      [{}, /origin is required/],
      [{ origin: "" }, /origin is required/],
    ]

    for (const [input, err] of invalidOptions) {
      it(`rejects ${JSON.stringify(input)}`, () => {
        expect(() => { origin(input as any) }).throw(err as any);
      })
    }
  })

  it('works', async () => {
    const fn = origin("https://fly.io");

    const resp = await fn("https://origin/", { method: "HEAD" })
    expect(resp.status).to.eq(200)
  })
})