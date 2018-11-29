/** @module Site */
import { BackendInfo, BackendMap } from "./backends";
import { RuleInfo } from "./rules";
import { MiddlewareConfig } from "./middleware";
export interface SiteConfig {
    middleware: MiddlewareConfig[];
    backends: {
        [key: string]: BackendInfo;
    };
    rules: RuleInfo[];
}
export declare class Site {
    backends: BackendMap;
    fetch: (req: RequestInfo, init?: RequestInit) => Promise<Response>;
    constructor(config: SiteConfig);
}
