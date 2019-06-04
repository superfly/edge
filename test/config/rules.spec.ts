import { expect } from "chai"
import { PathPatternMatcher } from "../../src/config/rules";


it("replaces a matched pattern", () => {
  const pathPattern = new PathPatternMatcher("/first/:first/second/:second/rest/*rest")

  const path = "/first/1/second/2/rest/a/b/c/1/2/3"
  expect(pathPattern.match(path)).to.be.true

  expect(pathPattern.parse(path)).to.eql({ first: "1", second: "2", rest: "a/b/c/1/2/3" })
  
  expect(pathPattern.replace(path, "/$first/$second/$rest")).to.equal("/1/2/a/b/c/1/2/3")
})

it("ensures a match", () => {
  const pathPattern = new PathPatternMatcher("/first/:first/second/:second/rest/*rest")

  const path = "/first/1/second/2"
  expect(pathPattern.match(path)).to.be.false
})