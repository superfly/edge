/**
 * GitHub Repository information, either a string formatted
 * like <owner>/<repository> or an object with owner and repository fields.
 * @module Backends
 */
export declare type GithubRepository = {
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
export declare function githubPages(config: GithubRepository | string): ((req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>) & {
    githubFetch: import("@fly/v8env/lib/fly/fetch").FetchFunction & {
        repository: string;
        hostname: string | undefined;
        buildTime: number;
    };
};
