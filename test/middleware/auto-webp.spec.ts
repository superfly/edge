import { expect } from "chai";
import { autoWebp } from "../../src/middleware";

const img = require("../fixtures/image.png");

async function mock(req: RequestInfo){
	const url = new URL(typeof req === "string" ? req : req.url);

	if(url.pathname === "/text"){
		return new Response("this is some unaltered text", { headers: {"content-type": "text/plain"}});
	}
	if(url.pathname === "/image.png"){
		return new Response(img, { headers: {"content-type": "image/png"}});
	}
	return new Response("not found", { status: 404 })
}

describe("middleware/autoWebp", function() {
	it("successfully lets non-image responses pass through", async ()=>{
		const fetch = autoWebp(mock);
		const resp = await fetch("https://testing/text");
		expect(resp.status).to.eq(200);
		expect(resp.headers.get("content-type")).to.eq("text/plain");
	})

	it("serves webp when accept includes image/webp", async ()=>{
		const fetch = autoWebp(mock)
		const resp = await fetch("https://testing/image.png", { 
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8" // a typical chrome accept header
			}
		})
		const body = await resp.arrayBuffer();
		expect(resp.status).to.eq(200)
		expect(resp.headers.get("content-type")).to.eq("image/webp")
		expect(body.byteLength).to.be.lessThan(img.byteLength, "webp image data should be smaller than source png")
	})
	it("doesn't serve webp when header is missing", async ()=>{
		const fetch = autoWebp(mock)
		const resp = await fetch("https://testing/image.png", { 
			headers: {
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" // a typical chrome accept header
			}
		})
		const body = await resp.arrayBuffer();
		expect(resp.status).to.eq(200)
		expect(resp.headers.get("content-type")).to.eq("image/png")
		expect(body.byteLength).to.be.eq(img.byteLength, "untouched image data should be the same as the original")
	})
})