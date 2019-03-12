import { expect } from "chai"
import { buildAppFromConfig, backends } from "../../src";
import { glitch } from "../../src/backends";

const expected:any = {
  "getting-started": backends.origin({
    origin: "https://getting-started.edgeapp.net",
    headers:{
      host: "getting-started.edgeapp.net"
    }
  }),
  "glitch": glitch({appName:"fly-example"})
}
describe("config/buildApp", () => {
  it("should build default config", () => {
    const cdn = buildAppFromConfig(defaultConfig);
    for(const [k, b] of cdn.backends.entries()){
      const fn = expected[k];
      expect(b.proxyConfig).to.eql(fn.proxyConfig);
    }

  })
});

const defaultConfig = {
	"backends": {
		"getting-started": {
			"type": "origin",
			"origin": "https://getting-started.edgeapp.net",
			"headers": {
				"host": "getting-started.edgeapp.net"
			}
    },
    "glitch": {
      "type": "glitch",
      "appName": "fly-example"
    }
	},
	"rules": [
		{
			"actionType": "rewrite",
			"backendKey": "getting-started"
		}
	],
	"middleware": [
		{
			"type": "https-upgrader"
		}
	]
};