import { expect } from 'chai';
import { backends } from "../../src"

const { awsS3 } = backends

describe("backends/awsS3", () => {
    describe("public", () => {
        it('works', async () => {
            const fn = awsS3("flyio-test-website");
            const resp = await fn("/index.html");
            expect(resp.status).to.eq(200);
        })
    })

    describe("w/ options", () => {
        it('works', async () => {
            const fn = awsS3({ bucket: "flyio-test-website" });
            const resp = await fn("/index.html");
            expect(resp.status).to.eq(200);
        })
    })

    describe("private", () => {
        if (app.config.aws_s3_secret_access_key)
            it('works', async () => {
                console.log(JSON.stringify(app))
                const fn = awsS3({
                    bucket: "flyio-private-website",
                    credentials: {
                        accessKeyId: app.config.aws_s3_access_key_id,
                        secretAccessKey: app.config.aws_s3_secret_access_key
                    }
                });
                const resp = await fn("/index.html");
                expect(resp.status).to.eq(200);
            })
        else
            it('works (did not run, missing proper secrets)')
    })

})