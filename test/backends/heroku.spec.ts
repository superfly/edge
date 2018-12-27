import { expect } from "chai";
import { heroku } from "../../src/backends"
import * as errors from "../../src/errors";


describe("backends/heroku", function () {
  this.timeout(15000)

  describe("options", () => {
    const validOptions = [
      [
        "example",
        { appName: "example" }
      ],
      [
        { appName: "example" },
        { appName: "example" }
      ],
    ];

    for (const [input, config] of validOptions) {
      it(`accepts ${JSON.stringify(input)}`, () => {
        expect(heroku(input as any).proxyConfig).to.eql(config);
      })
    }

    const invalidOptions = [
      [undefined, errors.InputError],
      ["", /appName is required/],
      [{}, /appName is required/],
      [{ appName: "" }, /appName is required/],
    ]

    for (const [input, err] of invalidOptions) {
      it(`rejects ${JSON.stringify(input)}`, () => {
        expect(() => { heroku(input as any) }).throw(err as any);
      })
    }
  })

  it('works', async () => {
    const fn = heroku("example");

    const resp = await fn("https://heroku/", { method: "HEAD" })
    expect(resp.status).to.eq(200)
  })
})