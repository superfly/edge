declare module "src/backends/github_pages" {
    /**
     * GitHub Repository information, either a string formatted
     * like <owner>/<repository> or an object with owner and repository fields.
     * @module Backends
     */
    export type GithubRepository = {
        /**
         * Repository owner
         */
        owner: string;
        /**
         * Repository name <repository> format
         */
        repository: string;
        /**
         * The custom hostname on repository
         */
        hostname?: string;
    };
    /**
     * Creates a fetch-like proxy function for making requests to GitHub pages
     * hosted sites.
     * @param config The Github repository to proxy to
     * @module Backends
     */
    export function githubPages(config: GithubRepository | string): ((req: RequestInfo, init?: RequestInit | undefined) => Promise<any>) & {
        githubFetch: any;
    };
}
declare module "src/backends" {
    export { githubPages } from "src/backends/github_pages";
    export interface BackendInfo {
        origin: string | string[];
        type?: string;
        headers?: {
            [name: string]: string | boolean | undefined;
        };
    }
    export interface Backend {
        (req: RequestInfo, init?: RequestInit): Promise<Response>;
        info: BackendInfo;
    }
    export type BackendMap = Map<String, Backend>;
    export default function backend(backend: BackendInfo): Backend;
}
declare module "src/text-replacements" {
    /**
     * @module Site
     * @ignore
     */
    export function applyReplacements(resp: Response, replacements?: [string, string][]): Promise<Response>;
}
declare module "src/rules" {
    /**
     * @module Rules
     * @ignore
     * */
    import { BackendMap } from "src/backends";
    export interface RuleInfo {
        actionType: "redirect" | "rewrite";
        backendKey?: string;
        matchScheme?: string;
        hostname?: string;
        pathMatchMode?: "prefix" | "full";
        httpHeaderKey?: string;
        httpHeaderValue?: RegExp | string;
        pathPattern?: RegExp | string;
        pathReplacementPattern?: string;
        redirectURLPattern?: string;
        redirectStatus?: number;
        responseReplacements?: [string, string][];
    }
    export default function rules(backends: BackendMap, rules: RuleInfo[]): (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
}
declare module "src/middleware" {
    export const availableMiddleware: {
        [key: string]: Middleware | undefined;
    };
    export type MiddlewareConfig = string | [string, any | undefined];
    export interface Middleware {
        (fetch: Fetch, options?: any): Fetch;
    }
    export interface Fetch {
        (req: RequestInfo, init?: RequestInit): Promise<Response>;
    }
    export function httpsUpgrader(fetch: Fetch, optionss?: any): (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
    export function responseHeaders(fetch: Fetch, options?: any): (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
    export function injectHTML(fetch: Fetch, options?: any): (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
    export default function middleware(fetch: Fetch, ...middleware: MiddlewareConfig[]): Fetch;
}
declare module "src/site" {
    /** @module Site */
    import { BackendInfo, BackendMap } from "src/backends";
    import { RuleInfo } from "src/rules";
    import { MiddlewareConfig } from "src/middleware";
    export interface SiteConfig {
        middleware: MiddlewareConfig[];
        backends: {
            [key: string]: BackendInfo;
        };
        rules: RuleInfo[];
    }
    export class Site {
        backends: BackendMap;
        fetch: (req: RequestInfo, init?: RequestInit) => Promise<Response>;
        constructor(config: SiteConfig);
    }
}
declare module "index" { }
declare module "src/index" {
    /**
     * @module CDN
     */
    /** */
    module "Backends";
    export { BackendInfo, BackendMap } from "src/backends";
    export { RuleInfo } from "src/rules";
    export { MiddlewareConfig } from "src/middleware";
    export { SiteConfig } from "src/site";
}
