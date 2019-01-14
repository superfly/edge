/**
 * @module Backends
 */
import { FetchFunction } from '../fetch';
import aws, { Credentials } from '../aws'

/**
 * AWS S3 bucket options
 */
export interface AwsS3Options {
    bucket: string,
    region?: string,
    credentials?: Credentials
}

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
export function awsS3(options: AwsS3Options | string): FetchFunction {
    const opts = normalizeOptions(options);
    return async function awsS3Fetch(req: RequestInfo, init?: RequestInit): Promise<Response> {
        if (typeof req === "string") req = new Request(req, init);
        const url = new URL(req.url);
        if (typeof opts.credentials === 'object') {
            return aws.fetch({
                path: `/${opts.bucket}${url.pathname}`,
                service: 's3',
                region: opts.region,
            }, opts.credentials);
        }
        const publicUrl = buildS3Url(opts, url.pathname);
        return fetch(publicUrl, { headers: req.headers })
    }
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