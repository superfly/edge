import { expect } from "chai";
import { deviceRouter } from "../../src/middleware";
import { echo } from "../../src/backends";

describe("middleware/deviceRouter", function() {
	it("routes to an iOS app if user is on a mobile device with iOS", async ()=>{
		const route = deviceRouter(echo, {
		    ios: "airbnb",
		    android: "com.airbnb.android"
		});

		const resp = await route("https://www.airbnb.com/", { 
			headers: {
				"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1" // a typical iPhone user-agent header
			}
		});

		expect(resp.url).to.include("appstore.com");
	})

	it("routes to an Android app if user is on a mobile device with Android OS", async ()=>{
		const route = deviceRouter(echo, {
		    ios: "airbnb",
		    android: "com.airbnb.android"
		});

		const resp = await route("https://www.airbnb.com/", { 
			headers: {
				"user-agent": "Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Mobile Safari/537.36" // a typical Google Pixel user-agent header
			}
		});

		expect(resp.url).to.include("play.google.com");
	})

	it("successfully lets non-mobile responses pass through", async ()=>{
		const route = deviceRouter(echo, {
		    ios: "airbnb",
		    android: "com.airbnb.android"
		});

		const resp = await route("https://www.airbnb.com/", { 
			headers: {
				"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36" // a typical desktop/Mac user-agent header
			}
		});

		expect(resp.status).to.eq(200);
	})
})