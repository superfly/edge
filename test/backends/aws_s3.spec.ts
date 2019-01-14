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
            expect(resp.headers.get("etag")).to.not.be.empty
        })
        it("uses index.html by default", async () => {
            const fn = awsS3("flyio-test-website");
            const resp = await fn("/");
            expect(resp.status).to.eq(200);
            for (let h in resp.headers)
                expect(h.startsWith("x-amz-")).to.eq(false)
        })
        it("responds to HEAD requests correctly", async () => {
            const fn = awsS3("flyio-test-website");
            const resp = await fn("/", { method: "HEAD" });
            expect(resp.status).to.eq(200);
            for (let h in resp.headers)
                expect(h.startsWith("x-amz-")).to.eq(false)
            expect(await resp.text()).to.be.empty
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
            it("return an error for anything other than GET or HEAD methods", async () => {
                for (let method of ["POST", "PUT", "PATCH", "DELETE", "TRACE", "CONNECT", "GIBBERISH"]) {
                    let resp = await awsS3({ bucket: "flyio-test-website" })("/index.html", { method })
                    expect(resp.status).to.eq(405)
                }
            })
            it("GET returns a 404 when file is not found", async () => {
                const fn = awsS3({ bucket: "flyio-test-website" });
                const resp = await fn("/index2.html");
                expect(resp.status).to.eq(404);
                for (let h in resp.headers)
                    expect(h.startsWith("x-amz-")).to.eq(false) // just to make sure we don't leak
            })
            it("HEAD returns a 404 when file is not found", async () => {
                const fn = awsS3({ bucket: "flyio-test-website" });
                const resp = await fn("/index2.html", { method: "HEAD" });
                expect(resp.status).to.eq(404);
                for (let h in resp.headers)
                    expect(h.startsWith("x-amz-")).to.eq(false) // just to make sure we don't leak
                expect(resp.body).to.be.null
            })
        })
    })

    describe("private", () => {
        describe("error handling", () => {
            it("return an error for anything other than GET or HEAD methods", async () => {
                for (let method of ["POST", "PUT", "PATCH", "DELETE", "TRACE", "CONNECT", "GIBBERISH"]) {
                    let resp = await awsS3({
                        bucket: "flyio-private-website",
                        credentials: {
                            accessKeyId: "gibberish",
                            secretAccessKey: "gibberish"
                        }
                    })("/index.html", { method })
                    expect(resp.status).to.eq(405)
                }
            })
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
                it('404 might work (did not run, missing proper secrets)');
                return
            }
            it("GET returns a 404 when a file is not found", async () => {
                const fn = awsS3({
                    bucket: "flyio-private-website",
                    credentials: {
                        accessKeyId: app.config.aws_s3_access_key_id,
                        secretAccessKey: app.config.aws_s3_secret_access_key
                    }
                });
                const resp = await fn("/index2.html");
                expect(resp.status).to.eq(404);
                for (let h in resp.headers)
                    expect(h.startsWith("x-amz-")).to.eq(false) // just to make sure we don't leak
            })
            it("HEAD returns a 404 when a file is not found", async () => {
                const fn = awsS3({
                    bucket: "flyio-private-website",
                    credentials: {
                        accessKeyId: app.config.aws_s3_access_key_id,
                        secretAccessKey: app.config.aws_s3_secret_access_key
                    }
                });
                const resp = await fn("/index2.html", { method: "HEAD" });
                expect(resp.status).to.eq(404);
                for (let h in resp.headers)
                    expect(h.startsWith("x-amz-")).to.eq(false) // just to make sure we don't leak
                expect(resp.body).to.be.null
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
            expect(resp.headers.get("etag")).to.not.be.empty
        })

        it("responds to HEAD requests correctly", async () => {
            const fn = awsS3({
                bucket: "flyio-private-website",
                credentials: {
                    accessKeyId: app.config.aws_s3_access_key_id,
                    secretAccessKey: app.config.aws_s3_secret_access_key
                }
            });
            const resp = await fn("/", { method: "HEAD" });
            expect(resp.status).to.eq(200);
            for (let h in resp.headers)
                expect(h.startsWith("x-amz-")).to.eq(false)
            expect(await resp.text()).to.be.empty
        })
    })

})