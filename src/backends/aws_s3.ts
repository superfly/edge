import { FetchFunction } from '../fetch';
import aws, { Credentials } from '../aws'

export interface AwsS3Options {
    bucket: string,
    region?: string,
    credentials?: Credentials
}

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