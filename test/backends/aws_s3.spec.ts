import { expect } from 'chai';
import { backends } from "../../src"

const { awsS3 } = backends

describe("backends/awsS3", () => {
    describe("public", () => {
        it("responds with the file's content", async () => {
            const fn = awsS3("flyio-test-website");
            const resp = await fn("/index.html");
            expect(resp.status).to.eq(200);
            for (let h in resp.headers)
                expect(h.startsWith("x-amz-")).to.eq(false)
        })
        it("uses index.html by default", async () => {
            const fn = awsS3("flyio-test-website");
            const resp = await fn("/");
            expect(resp.status).to.eq(200);
            for (let h in resp.headers)
                expect(h.startsWith("x-amz-")).to.eq(false)
        })
        describe("w/ options", () => {
            it("responds with the file's content", async () => {
                const fn = awsS3({ bucket: "flyio-test-website" });
                const resp = await fn("/index.html");
                expect(resp.status).to.eq(200);
                for (let h in resp.headers)
                    expect(h.startsWith("x-amz-")).to.eq(false)
            })
        })
        describe("error handling", () => {
            it("returns a 404 when file is not found", async () => {
                const fn = awsS3({ bucket: "flyio-test-website" });
                const resp = await fn("/index2.html");
                expect(resp.status).to.eq(404);
                for (let h in resp.headers)
                    expect(h.startsWith("x-amz-")).to.eq(false) // just to make sure we don't leak
            })
        })
    })

    describe("private", () => {
        describe("error handling", () => {
            it("returns a 500 when credentials are off", async () => {
                const fn = awsS3({
                    bucket: "flyio-private-website",
                    credentials: {
                        accessKeyId: "gibberish",
                        secretAccessKey: "gibberish"
                    }
                });
                const resp = await fn("/index.html");
                expect(resp.status).to.eq(500);
                for (let h in resp.headers)
                    expect(h.startsWith("x-amz-")).to.eq(false) // just to make sure we don't leak
            })

            if (!app.config.aws_s3_secret_access_key) {
                it('500 when access denied might work (did not run, missing proper secrets)');
                return
            }
            it("returns a 500 when a file is not found (aws: access denied)", async () => {
                const fn = awsS3({
                    bucket: "flyio-private-website",
                    credentials: {
                        accessKeyId: app.config.aws_s3_access_key_id,
                        secretAccessKey: app.config.aws_s3_secret_access_key
                    }
                });
                const resp = await fn("/index2.html");
                expect(resp.status).to.eq(500);
                for (let h in resp.headers)
                    expect(h.startsWith("x-amz-")).to.eq(false) // just to make sure we don't leak
            })
        })

        if (!app.config.aws_s3_secret_access_key) {
            it('might work (did not run, missing proper secrets)');
            return
        }

        it('responds with the file', async () => {
            const fn = awsS3({
                bucket: "flyio-private-website",
                credentials: {
                    accessKeyId: app.config.aws_s3_access_key_id,
                    secretAccessKey: app.config.aws_s3_secret_access_key
                }
            });
            const resp = await fn("/index.html");
            expect(resp.status).to.eq(200);
            for (let h in resp.headers)
                expect(h.startsWith("x-amz-")).to.eq(false)
        })
    })

})