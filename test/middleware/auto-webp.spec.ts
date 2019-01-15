import { expect } from "chai";
import { autoWebp } from "../../src/middleware";
import { origin } from "../../src/backends";
import { echo } from "../../src/backends";

const { Image } = require("@fly/image");

function contentType(resp: Response){
	const type = resp.headers.get("content-type");
	if (type !== "image/png" || "image/jpeg") {
		return resp.status;
	}
}

describe("middleware/autoWebp", function() {
	it("successfully lets non-image responses pass through", async ()=>{
		const backend = origin({
		  origin: "https://fly.io/",
		  headers: {host: "fly.io"}
		});
		const fn = autoWebp(backend);
		const resp = await fn("https://fly.io/");
		expect(contentType(resp)).to.eq(200);
	})

	it("properly generates webp images", async ()=>{
		const img = "https://fly.io/public/images/modern-javascript@2x.png";
		const response = await fetch(img);
		let imageData = await response.arrayBuffer();
		const originalImage = new Image(imageData);
    	const newImage = originalImage.webp();
        const convertedImage = await newImage.toImage();

        const meta = convertedImage.metadata();
        expect(meta.format).to.eq("webp");
	})
})