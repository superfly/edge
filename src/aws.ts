/** @module HTTP */
import { RequestSigner, sign } from 'aws4';

/** @hidden */
export interface Credentials {
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string, // only required for temporary credentials
}
/** @hidden */
export interface RequestOptions {
    path: string,
    host?: string,
    method?: string,
    headers?: any,
    service?: string,
    region?: string,
}
/** @hidden */
const aws = {
    fetch(opts: RequestOptions, credentials: Credentials) {
        let signer = new RequestSigner(opts, credentials);
        signer.request.protocol = 'https:';
        signer.sign();
        const req = signer.request;
        let url = `${req.protocol}//${req.hostname}${req.path}`
        console.debug("AWS S3 requesting URL:", url)
        return fetch(url, { method: req.method, headers: req.headers });
    },
    sign
}
/** @hidden */
export default aws;
