/**
 * @module Backends
 */
import aws, { Credentials } from '../aws'
import { ProxyFunction } from '../proxy';

/**
 * AWS S3 bucket options
 */
export interface AwsS3Options {
    bucket: string,
    region?: string,
    credentials?: Credentials
}

const allowedMethods = ["GET", "HEAD"]

/**
 * Creates a fetch-like proxy function for making requests to AWS S3.
 * 
 * Example:
 * 
 * ```typescript
 * import { awsS3 } from "./src/backends";
 * const backend = awsS3({
 *  bucket: "flyio-test-website",
 *  // region: "us-east-1"
 *  // credentials: { // for private S3 buckets
 *  //   accessKeyId: app.config.aws_access_key_id,
 *  //   secretAccessKey: app.config.aws_secret_access_key, // store this as a secret
 *  // }
 * });
 * ```
 * @param options AWS S3 bucket to proxy to
 * @module Backends
 */
export function awsS3(options: AwsS3Options | string): ProxyFunction<AwsS3Options> {
    const opts = normalizeOptions(options);

    const fn = async function awsS3Fetch(req: RequestInfo, init?: RequestInit): Promise<Response> {
        if (typeof req === "string") req = new Request(req, init);

        if (!allowedMethods.includes(req.method))
            return new Response(`HTTP Method not allowed, only ${allowedMethods.join(", ")} are allowed.`, { status: 405 })

        const url = new URL(req.url);
        if (url.pathname.endsWith("/"))
            url.pathname += "index.html"

        let res: Response;

        if (typeof opts.credentials !== 'object')
            res = await fetch(buildS3Url(opts, url.pathname), { method: req.method, headers: req.headers })
        else
            res = await aws.fetch({
                path: `/${opts.bucket}${url.pathname}`,
                service: 's3',
                region: opts.region,
                method: req.method,
            }, opts.credentials);

        if (res.status >= 500) {
            console.error(`AWS S3 returned a server error, status code: ${res.status}, body:`, await res.text());
            return new Response(req.method === "GET" ? "Something went wrong." : null, { status: 500 })
        }

        if (res.status === 404)
            return new Response(req.method === "GET" ? "Not found." : null, { status: 404 })

        if (res.status >= 400) {
            console.error(`AWS S3 returned a client error, status code: ${res.status}, body:`, await res.text());
            return new Response(req.method === "GET" ? "Something went wrong." : null, { status: 500 })
        }

        for (let h in res.headers)
            if (h.startsWith("x-amz-"))
                res.headers.delete(h)

        return res
    }

    return Object.assign(fn, { proxyConfig: opts })
}

function normalizeOptions(options: AwsS3Options | string): AwsS3Options {
    if (typeof options === 'string')
        options = { bucket: options }
    return options
}

function buildS3Url(opts: AwsS3Options, path: string): string {
    const region = opts.region || 'us-east-1';
    let host: string;
    if (region === 'us-east-1') {
        host = "s3.amazonaws.com"
    } else {
        host = `s3-${opts.region}.amazonaws.com`
    }

    return `http://${host}/${opts.bucket}${path}`
}
