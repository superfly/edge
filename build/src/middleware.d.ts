export declare const availableMiddleware: {
    [key: string]: Middleware | undefined;
};
export declare type MiddlewareConfig = string | [string, any | undefined];
export interface Middleware {
    (fetch: Fetch, options?: any): Fetch;
}
export interface Fetch {
    (req: RequestInfo, init?: RequestInit): Promise<Response>;
}
export declare function httpsUpgrader(fetch: Fetch, optionss?: any): (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
export declare function responseHeaders(fetch: Fetch, options?: any): (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
export declare function injectHTML(fetch: Fetch, options?: any): (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
export default function middleware(fetch: Fetch, ...middleware: MiddlewareConfig[]): Fetch;
